import { createSmartLockSystemJson } from "../app/SmartLock/createSmartLockSystemJson"
import { createPdf } from "../lib/pdfgen/createPdf"

// Runs the full PDF generator in a real browser (Playwright loads this page).
// This exercises the resvg-wasm rasterizer end to end — wasm init, the bundled
// font, and SVG -> PNG -> embedded image — then asserts a valid PDF came out.
async function generatePdf(): Promise<number> {
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
  return bytes.length
}

const output = document.getElementById("output")
generatePdf()
  .then((size) => {
    if (output) output.textContent = `Success: generated a ${size}-byte PDF`
  })
  .catch((error) => {
    if (output) {
      output.textContent = `Fail: ${error instanceof Error ? error.message : String(error)}`
    }
    console.error("Browser PDF generation failed:", error)
  })
