import type { PDFDocument, PDFPage } from "pdf-lib"
import { systemJsonToSvgSnapshot } from "../system-json/system-json-to-svg"
import type { SystemJson } from "../system-json/system-json"
import { COLORS } from "./constants"
import { contain } from "./layout"
import { rasterizeSvg } from "./svgRaster"
import type { PdfFrame } from "./types"

export async function drawSystemDiagram(
  pdfDoc: PDFDocument,
  page: PDFPage,
  systemJson: SystemJson[],
  frame: PdfFrame,
) {
  page.drawRectangle({
    ...frame,
    color: COLORS.white,
    borderColor: COLORS.line,
    borderWidth: 1,
  })

  const svg = systemJsonToSvgSnapshot(systemJson)
  const raster = await rasterizeSvg(svg, frame.width * 2)
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
