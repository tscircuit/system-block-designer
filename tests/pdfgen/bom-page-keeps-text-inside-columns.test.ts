import { expect, test } from "bun:test"
import { PDFDocument, StandardFonts } from "pdf-lib"
import type { BomViewRow } from "../../lib/bom/types"
import {
  BOM_BODY_FONT_SIZE,
  getBomColumnContentWidth,
  getBomColumns,
  getBomRowLines,
  getBomTableWidth,
} from "../../lib/pdfgen/bomPage"
import { measureTextWidth } from "../../lib/pdfgen/layout"

test("bom page keeps wrapped text inside every column", async () => {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const row: BomViewRow = {
    referenceDesignators: "TP1234567890_LONG_NODE",
    manufacturer: "Texas Instruments Ultra Reliability Components Division",
    mpn: "SN74LVC1G3157DBVR_LONG_REVISION_IDENTIFIER",
    packageName:
      "pinrow2_p2.54_female_locking_header_variant_with_extended_alignment_guide",
    value: "precision_feedback_network_100_kOhm_0.1_percent",
    quantity: "128",
    functionalBlock: "Power Regulation and Supervisory Control",
    partName: "Precision analog switch for supervisory feedback path",
    description:
      "Precision analog switch with reinforced packaging and extended validation traceability for harsh-environment assemblies.",
    lifecycle: "Active",
    unitPrice: "0.019875 USD",
    stock: "2,450,120",
  }

  const columns = getBomColumns()
  const referenceColumn = columns.find(
    (column) => column.key === "referenceDesignators",
  )
  const valueColumn = columns.find((column) => column.key === "value")

  expect(referenceColumn?.width).toBe(valueColumn?.width)

  const totalWidth = columns.reduce((total, column) => total + column.width, 0)
  expect(Math.abs(totalWidth - getBomTableWidth())).toBeLessThan(0.001)

  const rowLines = getBomRowLines(row, font, columns)

  for (const [index, column] of columns.entries()) {
    const maxWidth = getBomColumnContentWidth(column.width)
    for (const line of rowLines[index]) {
      expect(
        measureTextWidth(font, line, BOM_BODY_FONT_SIZE),
      ).toBeLessThanOrEqual(maxWidth)
    }
  }
})
