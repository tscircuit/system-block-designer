import { expect, test } from "bun:test"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { measureTextWidth, wrapText } from "../../lib/pdfgen/layout"

test("wrapText breaks long words to fit the available width", async () => {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const maxWidth = 84
  const word =
    "pinrow2_p2.54_female_locking_header_variant_with_extended_alignment_guide"

  const lines = wrapText(word, font, 7.8, maxWidth)

  expect(lines.length).toBeGreaterThan(1)
  for (const line of lines) {
    expect(measureTextWidth(font, line, 7.8)).toBeLessThanOrEqual(maxWidth)
  }
})
