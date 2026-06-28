import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { expect, test } from "bun:test"
import { pdfToPng, VerbosityLevel } from "pdf-to-png-converter"
import { PNG } from "pngjs"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import { createPdf, type CreatePdfParams } from "../../lib/pdfgen/createPdf"

const drv8876SchematicSheetSvg = await Bun.file(
  join(
    import.meta.dir,
    "fixtures",
    "DRV8876-driver-pwm-operation-ph-en.circuit-schematic-simulation.snap.svg",
  ),
).text()
const circuitToSvgSchematicSheetSvg = await Bun.file(
  join(import.meta.dir, "fixtures", "schematic-sheet.snap.svg"),
).text()

const examplePdf: CreatePdfParams = {
  titlePage: {
    type: "title",
    projectName: "Smart Lock (UWB Smart Lock)",
    subtitle: "System design package",
    description:
      "Reference package generated from the system block designer PDF generator.",
    preparedFor: "Product Engineering",
    preparedBy: "System Block Designer",
    date: "2026-06-27",
    revision: "A",
  },
  projectDetailsPage: {
    type: "project_details",
    summary:
      "A compact architecture package for an ultra-wideband smart lock platform.",
    details: {
      Project: "Smart Lock",
      Variant: "UWB Smart Lock",
      Status: "Concept",
      Owner: "Hardware Systems",
    },
    sections: [
      {
        title: "Scope",
        body: "This package captures the project overview, technical specification baseline, system architecture, and schematic sheet previews.",
      },
      {
        title: "Deliverables",
        items: [
          "System block diagram",
          "Technical specifications summary",
          "Schematic sheet image pages",
        ],
      },
    ],
  },
  technicalSpecificationsPage: {
    type: "technical_specifications",
    summary: "Initial electrical and integration targets.",
    rows: [
      {
        name: "Connectivity",
        value: "UWB / BLE / NFC",
        notes: "Supports proximity, mobile unlock, and commissioning flows.",
      },
      {
        name: "Host",
        value: "BLE Module",
        notes: "Coordinates radio, flash, authentication, and PMIC control.",
      },
      {
        name: "Power",
        value: "PMIC",
        notes: "Supplies regulated rails to the application electronics.",
      },
      {
        name: "External Interfaces",
        value: "SPI / I2C / GPIO",
        notes: "Shown in the generated system architecture page.",
      },
    ],
  },
  systemArchitecturePage: {
    type: "system_architecture",
    subtitle: "Generated from the smart-lock system JSON fixture.",
    systemJson: createSmartLockSystemJson(),
  },
  schematicSheetSvgs: [
    {
      type: "schematic_sheet",
      title: "Schematics - DRV8876 Driver PWM Operation",
      svg: drv8876SchematicSheetSvg,
    },
    {
      type: "schematic_sheet",
      title: "Schematics - Circuit Sheet",
      svg: circuitToSvgSchematicSheetSvg,
    },
  ],
}

test("snapshots each page of example01 as png", async () => {
  const pdfBytes = await createPdf(examplePdf)
  const pages = await pdfToPng(pdfBytes, {
    viewportScale: 1,
    returnPageContent: true,
    verbosityLevel: VerbosityLevel.ERRORS,
  })

  expect(pages).toHaveLength(6)

  for (const page of pages) {
    expect(page.kind).toBe("content")
    expect(page.content).toBeDefined()
    await expectPngSnapshot(
      page.content!,
      `example01-page-${String(page.pageNumber).padStart(2, "0")}.png`,
    )
  }
})

async function expectPngSnapshot(actual: Uint8Array, filename: string) {
  const snapshotPath = join(import.meta.dir, "__snapshots__", filename)
  const shouldUpdate = process.env.UPDATE_PDFGEN_SNAPSHOTS === "1"

  if (shouldUpdate) {
    await mkdir(dirname(snapshotPath), { recursive: true })
    await Bun.write(snapshotPath, actual)
    return
  }

  const snapshot = Bun.file(snapshotPath)
  expect(await snapshot.exists()).toBe(true)

  const expected = new Uint8Array(await snapshot.arrayBuffer())
  if (Buffer.from(actual).equals(Buffer.from(expected))) return

  const comparison = comparePngs(expected, actual)
  if (!comparison.matches) {
    const diffPath = snapshotPath.replace(/\.png$/, ".diff.png")
    await Bun.write(diffPath, PNG.sync.write(comparison.diff))
    throw new Error(
      `${filename} PNG snapshot mismatch: ${comparison.message}. Diff written to ${diffPath}`,
    )
  }
}

function comparePngs(expectedBytes: Uint8Array, actualBytes: Uint8Array) {
  const expected = PNG.sync.read(Buffer.from(expectedBytes))
  const actual = PNG.sync.read(Buffer.from(actualBytes))

  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      matches: false,
      diff: createDimensionDiff(expected, actual),
      message: `dimension mismatch expected ${expected.width}x${expected.height}, received ${actual.width}x${actual.height}`,
    }
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
  }
}

function createDimensionDiff(expected: PNG, actual: PNG) {
  const width = Math.max(expected.width, actual.width)
  const height = Math.max(expected.height, actual.height)
  const diff = new PNG({ width, height })
  diff.data.fill(255)
  return diff
}
