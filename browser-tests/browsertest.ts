import { createSmartLockSystemJson } from "../app/SmartLock/createSmartLockSystemJson"
import { createPdf } from "../lib/pdfgen/createPdf"
import { rasterizeSvgInBrowser } from "../lib/pdfgen/rasterizeSvgInBrowser"
import { systemJsonToSvgSnapshot } from "../lib/system-json/system-json-to-svg"

// PNG magic number: every PNG file begins with these 8 bytes.
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

function setOutput(text: string) {
  const output = document.getElementById("output")
  if (output) output.textContent = text
}

function assertPngSignature(bytes: Uint8Array) {
  const signature = Array.from(bytes.slice(0, 8))
  const matches =
    signature.length === PNG_SIGNATURE.length &&
    signature.every((byte, index) => byte === PNG_SIGNATURE[index])
  if (!matches) {
    throw new Error(`expected a PNG signature, got [${signature.join(", ")}]`)
  }
}

// Rasterizes a fixed 100x50 SVG and checks the canvas honors the requested
// width while preserving the 2:1 aspect ratio.
async function runRasterizeTest() {
  const svg =
    '<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" fill="#1f77b4" /></svg>'
  const raster = await rasterizeSvgInBrowser(svg, 200)

  assertPngSignature(raster.bytes)
  if (raster.width !== 200 || raster.height !== 100) {
    throw new Error(
      `expected a 200x100 raster, got ${raster.width}x${raster.height}`,
    )
  }

  setOutput(
    `Success: rasterizeSvgInBrowser produced a ${raster.width}x${raster.height} PNG`,
  )
}

// Rasterizes the real system-diagram SVG built from the smart-lock fixture.
async function runSystemDiagramTest() {
  const svg = systemJsonToSvgSnapshot(createSmartLockSystemJson())
  const raster = await rasterizeSvgInBrowser(svg, 800)

  assertPngSignature(raster.bytes)
  if (raster.width !== 800 || raster.height <= 0) {
    throw new Error(
      `expected an 800px-wide raster, got ${raster.width}x${raster.height}`,
    )
  }

  setOutput(`Success: system diagram rasterized to ${raster.width}px wide`)
}

// Builds a full PDF in the browser with NO rasterizer passed, exercising the
// auto-selected canvas rasterizer end to end.
async function runCreatePdfTest() {
  const bytes = await createPdf({
    titlePage: { type: "title", projectName: "Browser PDF Test" },
    systemArchitecturePage: {
      type: "system_architecture",
      systemJson: createSmartLockSystemJson(),
    },
  })

  const header = new TextDecoder().decode(bytes.slice(0, 5))
  if (header !== "%PDF-") {
    throw new Error(`expected a %PDF- header, got "${header}"`)
  }
  if (bytes.length < 1000) {
    throw new Error(`expected a non-trivial PDF, got ${bytes.length} bytes`)
  }

  setOutput(`Success: createPdf produced a ${bytes.length}-byte PDF`)
}

window.addEventListener("DOMContentLoaded", () => {
  const testToRun = new URLSearchParams(window.location.search).get(
    "test_to_run",
  )

  const test =
    testToRun === "system_diagram"
      ? runSystemDiagramTest
      : testToRun === "create_pdf"
        ? runCreatePdfTest
        : runRasterizeTest

  test().catch((error) => {
    setOutput(`Fail: ${error instanceof Error ? error.message : String(error)}`)
    console.error("Browser pdfgen test failed:", error)
  })
})
