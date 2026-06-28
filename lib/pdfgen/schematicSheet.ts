import type { PDFDocument, PDFPage } from "pdf-lib"
import { degrees, rgb } from "pdf-lib"
import { contain } from "./layout"
import { rasterizeSvg } from "./svgRaster"
import type {
  PdfFonts,
  PdfRenderContext,
  SchematicSheetPageInput,
} from "./types"

const SCHEMATIC_BACKGROUND = rgb(245 / 255, 241 / 255, 237 / 255)
const TSCIRCUIT_BLUE = rgb(75 / 255, 138 / 255, 244 / 255)

export async function drawSchematicSheetPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  input: SchematicSheetPageInput,
  context: PdfRenderContext,
) {
  const { width, height } = page.getSize()
  const sheetNumber = context.schematicSheetNumber ?? 1
  const sheetCount = context.schematicSheetCount ?? 1
  const headerY = height - 32
  const footerY = 24
  const frame = {
    x: 76,
    y: 66,
    width: width - 144,
    height: height - 126,
  }
  const drawingFrame = {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  }

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: SCHEMATIC_BACKGROUND,
  })

  drawSheetHeader(page, fonts, {
    pageNumber: context.pageNumber,
    title: input.title ?? "Schematics",
    sheetNumber,
    sheetCount,
    width,
    y: headerY,
  })
  drawDrawingBackground(page, frame)
  drawSideNotice(page, fonts, width, frame)
  drawSheetFooter(page, fonts, width, footerY)

  const raster = rasterizeSvg(input.svg, drawingFrame.width * 2.2)
  const image = await pdfDoc.embedPng(raster.bytes)
  const fit = contain(
    raster.width,
    raster.height,
    drawingFrame.width,
    drawingFrame.height,
  )

  page.drawImage(image, {
    x: drawingFrame.x + (drawingFrame.width - fit.width) / 2,
    y: drawingFrame.y + (drawingFrame.height - fit.height) / 2,
    width: fit.width,
    height: fit.height,
  })
}

function drawSheetHeader(
  page: PDFPage,
  fonts: PdfFonts,
  options: {
    pageNumber: number
    title: string
    sheetNumber: number
    sheetCount: number
    width: number
    y: number
  },
) {
  const titleWidth = fonts.regular.widthOfTextAtSize(options.title, 10)
  page.drawText(`${options.pageNumber} | tscircuit`, {
    x: 34,
    y: options.y,
    size: 9,
    font: fonts.regular,
    color: rgb(0.39, 0.47, 0.56),
  })
  page.drawText(options.title, {
    x: (options.width - titleWidth) / 2,
    y: options.y,
    size: 10,
    font: fonts.regular,
    color: rgb(0.39, 0.47, 0.56),
  })
  page.drawText(`Sheet ${options.sheetNumber}/${options.sheetCount}`, {
    x: options.width - 88,
    y: options.y,
    size: 9,
    font: fonts.regular,
    color: rgb(0.39, 0.47, 0.56),
  })
}

function drawDrawingBackground(
  page: PDFPage,
  frame: { x: number; y: number; width: number; height: number },
) {
  page.drawRectangle({
    ...frame,
    color: SCHEMATIC_BACKGROUND,
  })
}

function drawSideNotice(
  page: PDFPage,
  fonts: PdfFonts,
  pageWidth: number,
  frame: { y: number; height: number },
) {
  page.drawText(
    "TSCIRCUIT ELECTRONIC DESIGNS ARE MACHINE-GENERATED DRAFTS AND REQUIRE VERIFICATION BY QUALIFIED SPECIALISTS.",
    {
      x: pageWidth - 46,
      y: frame.y + 78,
      size: 5.8,
      font: fonts.regular,
      color: rgb(0.45, 0.52, 0.6),
      rotate: degrees(90),
    },
  )
}

function drawSheetFooter(
  page: PDFPage,
  fonts: PdfFonts,
  width: number,
  y: number,
) {
  page.drawText("T", {
    x: 8,
    y: y + 4,
    size: 76,
    font: fonts.bold,
    color: TSCIRCUIT_BLUE,
    opacity: 0.14,
  })
  page.drawText("S", {
    x: 58,
    y: y + 4,
    size: 76,
    font: fonts.bold,
    color: TSCIRCUIT_BLUE,
    opacity: 0.14,
  })
  page.drawText("tscircuit Inc. (c) 2026", {
    x: 34,
    y,
    size: 9,
    font: fonts.regular,
    color: rgb(0.45, 0.52, 0.6),
  })
  page.drawText("tscircuit", {
    x: width / 2 - 42,
    y: y - 6,
    size: 24,
    font: fonts.bold,
    color: TSCIRCUIT_BLUE,
  })
  page.drawText("Powered by", {
    x: width - 96,
    y: y + 10,
    size: 8,
    font: fonts.regular,
    color: rgb(0.58, 0.62, 0.68),
  })
  page.drawText("tscircuit", {
    x: width - 96,
    y: y - 5,
    size: 15,
    font: fonts.bold,
    color: TSCIRCUIT_BLUE,
  })
}
