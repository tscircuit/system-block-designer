import type { PDFDocument, PDFPage } from "pdf-lib"
import { COLORS, PAGE } from "./constants"
import { contain, drawPageChrome, drawPageTitle } from "./layout"
import { rasterizeSvg } from "./svgRaster"
import type { PdfFonts, SchematicSheetPageInput } from "./types"

export async function drawSchematicSheetPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  input: SchematicSheetPageInput,
) {
  drawPageChrome(page, fonts, input.title ?? "Schematic Sheet")
  const y = drawPageTitle(page, fonts, input.title ?? "Schematic Sheet")
  const frame = {
    x: PAGE.margin,
    y: 54,
    width: PAGE.width - PAGE.margin * 2,
    height: y - 76,
  }

  page.drawRectangle({
    ...frame,
    color: COLORS.white,
    borderColor: COLORS.line,
    borderWidth: 1,
  })

  const raster = rasterizeSvg(input.svg, frame.width * 2)
  const image = await pdfDoc.embedPng(raster.bytes)
  const fit = contain(
    raster.width,
    raster.height,
    frame.width - 24,
    frame.height - 24,
  )

  page.drawImage(image, {
    x: frame.x + (frame.width - fit.width) / 2,
    y: frame.y + (frame.height - fit.height) / 2,
    width: fit.width,
    height: fit.height,
  })
}
