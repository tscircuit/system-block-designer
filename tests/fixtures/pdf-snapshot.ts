import { mkdir, readdir, unlink } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import { expect } from "bun:test"
import { pdfToPng, VerbosityLevel } from "pdf-to-png-converter"
import { PNG } from "pngjs"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPdfSnapshot(testPath: string): Promise<void>
  }
}

interface PngComparison {
  matches: boolean
  diff: PNG
  message: string
}

expect.extend({
  async toMatchPdfSnapshot(received: unknown, testPath: string) {
    const pdfBytes = toUint8Array(received)
    if (!pdfBytes) {
      return {
        pass: false,
        message: () =>
          "Expected a PDF Uint8Array, ArrayBuffer, or Buffer for PDF snapshot matching",
      }
    }

    const snapshotInfo = getPdfSnapshotInfo(testPath)
    const shouldUpdate =
      Boolean(process.env.BUN_UPDATE_SNAPSHOTS) ||
      Boolean(process.env.FORCE_BUN_UPDATE_SNAPSHOTS)
    const pages = await pdfToPng(pdfBytes, {
      viewportScale: 1,
      returnPageContent: true,
      verbosityLevel: VerbosityLevel.ERRORS,
    })

    if (shouldUpdate) {
      await mkdir(snapshotInfo.snapshotDir, { recursive: true })
      await removeStaleSnapshots(snapshotInfo, pages.length)
      for (const page of pages) {
        if (page.kind !== "content" || !page.content) {
          return {
            pass: false,
            message: () => `PDF page ${page.pageNumber} did not render content`,
          }
        }
        await Bun.write(
          getPageSnapshotPath(snapshotInfo, page.pageNumber),
          page.content,
        )
      }
      return {
        pass: true,
        message: () =>
          `Updated ${pages.length} PDF page snapshot(s) for ${snapshotInfo.baseName}`,
      }
    }

    const failures: string[] = []
    for (const page of pages) {
      if (page.kind !== "content" || !page.content) {
        failures.push(`page ${page.pageNumber} did not render content`)
        continue
      }

      const snapshotPath = getPageSnapshotPath(snapshotInfo, page.pageNumber)
      const snapshot = Bun.file(snapshotPath)
      if (!(await snapshot.exists())) {
        failures.push(`missing snapshot ${snapshotPath}`)
        continue
      }

      const expected = new Uint8Array(await snapshot.arrayBuffer())
      const actual = new Uint8Array(page.content)
      if (Buffer.from(actual).equals(Buffer.from(expected))) continue

      const comparison = comparePngs(expected, actual)
      if (!comparison.matches) {
        const diffPath = snapshotPath.replace(/\.png$/, ".diff.png")
        await Bun.write(diffPath, PNG.sync.write(comparison.diff))
        failures.push(
          `${basename(snapshotPath)} mismatch: ${comparison.message}. Diff written to ${diffPath}`,
        )
      }
    }

    const staleSnapshots = await findStaleSnapshots(snapshotInfo, pages.length)
    for (const staleSnapshot of staleSnapshots) {
      failures.push(`stale snapshot ${staleSnapshot}`)
    }

    return {
      pass: failures.length === 0,
      message: () =>
        failures.length === 0
          ? `Expected PDF not to match snapshots for ${snapshotInfo.baseName}`
          : failures.join("\n"),
    }
  },
})

function toUint8Array(value: unknown) {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (Buffer.isBuffer(value)) return new Uint8Array(value)
  return undefined
}

function getPdfSnapshotInfo(testPath: string) {
  const testDir = dirname(testPath)
  const testFile = basename(testPath)
  const baseName = testFile.replace(/(?:\.test)?\.[^.]+$/, "")
  return {
    baseName,
    snapshotDir: join(testDir, "__snapshots__"),
  }
}

function getPageSnapshotPath(
  snapshotInfo: ReturnType<typeof getPdfSnapshotInfo>,
  pageNumber: number,
) {
  return join(
    snapshotInfo.snapshotDir,
    `${snapshotInfo.baseName}-page-${String(pageNumber).padStart(2, "0")}.png`,
  )
}

async function removeStaleSnapshots(
  snapshotInfo: ReturnType<typeof getPdfSnapshotInfo>,
  pageCount: number,
) {
  for (const staleSnapshot of await findStaleSnapshots(
    snapshotInfo,
    pageCount,
  )) {
    await unlink(staleSnapshot)
  }
}

async function findStaleSnapshots(
  snapshotInfo: ReturnType<typeof getPdfSnapshotInfo>,
  pageCount: number,
) {
  const dir = Bun.file(snapshotInfo.snapshotDir)
  if (!(await dir.exists())) return []

  const staleSnapshots: string[] = []
  const snapshotPattern = new RegExp(
    `^${escapeRegExp(snapshotInfo.baseName)}-page-(\\d+)\\.png$`,
  )
  for (const entry of await readdir(snapshotInfo.snapshotDir)) {
    const match = entry.match(snapshotPattern)
    if (!match) continue
    if (Number(match[1]) > pageCount) {
      staleSnapshots.push(join(snapshotInfo.snapshotDir, entry))
    }
  }
  return staleSnapshots
}

function comparePngs(expectedBytes: Uint8Array, actualBytes: Uint8Array) {
  const expected = PNG.sync.read(Buffer.from(expectedBytes))
  const actual = PNG.sync.read(Buffer.from(actualBytes))

  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      matches: false,
      diff: createDimensionDiff(expected, actual),
      message: `dimension mismatch expected ${expected.width}x${expected.height}, received ${actual.width}x${actual.height}`,
    } satisfies PngComparison
  }

  const diff = new PNG({ width: expected.width, height: expected.height })
  const pixelTolerance = 24
  const maxMismatchRatio = 0.02
  let mismatchedPixels = 0
  let maxDelta = 0

  for (let offset = 0; offset < expected.data.length; offset += 4) {
    const rDelta = Math.abs(expected.data[offset] - actual.data[offset])
    const gDelta = Math.abs(expected.data[offset + 1] - actual.data[offset + 1])
    const bDelta = Math.abs(expected.data[offset + 2] - actual.data[offset + 2])
    const aDelta = Math.abs(expected.data[offset + 3] - actual.data[offset + 3])
    const delta = Math.max(rDelta, gDelta, bDelta, aDelta)
    maxDelta = Math.max(maxDelta, delta)

    if (delta > pixelTolerance) {
      mismatchedPixels += 1
      diff.data[offset] = 255
      diff.data[offset + 1] = 0
      diff.data[offset + 2] = 0
      diff.data[offset + 3] = 255
    } else {
      diff.data[offset] = actual.data[offset]
      diff.data[offset + 1] = actual.data[offset + 1]
      diff.data[offset + 2] = actual.data[offset + 2]
      diff.data[offset + 3] = 80
    }
  }

  const totalPixels = expected.width * expected.height
  const mismatchRatio = mismatchedPixels / totalPixels

  return {
    matches: mismatchRatio <= maxMismatchRatio,
    diff,
    message: `${mismatchedPixels}/${totalPixels} pixels differed beyond tolerance ${pixelTolerance} (${(mismatchRatio * 100).toFixed(3)}%, max channel delta ${maxDelta})`,
  } satisfies PngComparison
}

function createDimensionDiff(expected: PNG, actual: PNG) {
  const width = Math.max(expected.width, actual.width)
  const height = Math.max(expected.height, actual.height)
  const diff = new PNG({ width, height })
  diff.data.fill(255)
  return diff
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
