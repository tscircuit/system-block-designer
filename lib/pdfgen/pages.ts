import type { PDFDocument, PDFPage } from "pdf-lib"
import { drawBomPage } from "./bomPage"
import { COLORS, PAGE_MARGIN } from "./constants"
import {
  drawPdfText,
  drawKeyValueGrid,
  drawPageChrome,
  drawPageTitle,
  drawFooter,
  drawSections,
  drawSpecTable,
  drawText,
  measureTextWidth,
  wrapText,
} from "./layout"
import { drawSchematicSheetPage } from "./schematicSheet"
import { drawSystemDiagram } from "./systemDiagram"
import type {
  BomPageInput,
  PdfFonts,
  PdfRenderContext,
  ProjectDetailsPageInput,
  SystemArchitecturePageInput,
  TechnicalSpecificationsPageInput,
  TitlePageInput,
} from "./types"
import type { SchematicSheetPageInput } from "./types"

export function drawTitlePage(
  page: PDFPage,
  fonts: PdfFonts,
  input: TitlePageInput,
  pageNumber: number,
) {
  const { width, height } = page.getSize()
  drawCoverWatermark(page, fonts)

  drawCenteredPdfText(page, fonts, "tscircuit", {
    y: height - 90,
    size: 26,
    font: fonts.bold,
    color: COLORS.tscircuitBlue,
  })

  const titleLines = wrapText(
    input.projectName,
    fonts.bold,
    31,
    width - PAGE_MARGIN * 2,
  )
  const titleLineHeight = 38
  const titleBlockHeight = (titleLines.length - 1) * titleLineHeight
  const titleStartY = height * 0.49 + titleBlockHeight / 2
  titleLines.forEach((line, index) => {
    drawCenteredPdfText(page, fonts, line, {
      y: titleStartY - index * titleLineHeight,
      size: 31,
      font: fonts.bold,
      color: COLORS.ink,
    })
  })

  drawCenteredPdfText(page, fonts, input.subtitle ?? "Project document", {
    y: titleStartY - titleBlockHeight - 34,
    size: 15,
    font: fonts.regular,
    color: COLORS.ink,
    transform: (text) => text.toUpperCase(),
  })

  drawCoverMetadata(page, fonts, input)
  drawCoverFooter(page, fonts)
}

export function drawProjectDetailsPage(
  page: PDFPage,
  fonts: PdfFonts,
  input: ProjectDetailsPageInput,
  pageNumber: number,
) {
  drawPageChrome(page, fonts, pageNumber)
  let y = drawPageTitle(
    page,
    fonts,
    input.title ?? "Project Details",
    input.summary ?? input.projectName,
  )

  if (input.details) {
    y = drawKeyValueGrid(page, fonts, input.details, PAGE_MARGIN, y, 2)
  }

  drawSections(page, fonts, input.sections ?? [], y)
}

export function drawTechnicalSpecificationsPage(
  page: PDFPage,
  fonts: PdfFonts,
  input: TechnicalSpecificationsPageInput,
  pageNumber: number,
) {
  drawPageChrome(page, fonts, pageNumber)
  let y = drawPageTitle(
    page,
    fonts,
    input.title ?? "Technical Specifications",
    input.summary,
  )

  if (input.rows?.length) {
    y = drawSpecTable(page, fonts, input.rows, PAGE_MARGIN, y)
  } else if (input.specifications) {
    y = drawKeyValueGrid(page, fonts, input.specifications, PAGE_MARGIN, y, 2)
  }

  drawSections(page, fonts, input.sections ?? [], y)
}

export async function drawSystemArchitecturePage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  input: SystemArchitecturePageInput,
  pageNumber: number,
) {
  const { width, height } = page.getSize()
  drawSystemArchitectureHeader(page, fonts, input, pageNumber)
  await drawSystemDiagram(pdfDoc, page, input.systemJson, {
    x: PAGE_MARGIN,
    y: 72,
    width: width - PAGE_MARGIN * 2,
    height: height - 140,
  })
}

export async function drawPdfPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  pageInput:
    | TitlePageInput
    | ProjectDetailsPageInput
    | TechnicalSpecificationsPageInput
    | BomPageInput
    | SystemArchitecturePageInput
    | SchematicSheetPageInput,
  context: PdfRenderContext,
) {
  if (pageInput.type === "title") {
    drawTitlePage(page, fonts, pageInput, context.pageNumber)
  } else if (pageInput.type === "project_details") {
    drawProjectDetailsPage(page, fonts, pageInput, context.pageNumber)
  } else if (pageInput.type === "technical_specifications") {
    drawTechnicalSpecificationsPage(page, fonts, pageInput, context.pageNumber)
  } else if (pageInput.type === "bom") {
    drawBomPage(page, fonts, pageInput, context)
  } else if (pageInput.type === "system_architecture") {
    await drawSystemArchitecturePage(
      pdfDoc,
      page,
      fonts,
      pageInput,
      context.pageNumber,
    )
  } else {
    await drawSchematicSheetPage(pdfDoc, page, fonts, pageInput, context)
  }

  if (pageInput.type !== "title") {
    drawFooter(page, fonts)
  }
}

function drawCoverWatermark(page: PDFPage, fonts: PdfFonts) {
  drawPdfText(page, "TSC", {
    x: 0,
    y: 0,
    size: 158,
    font: fonts.bold,
    color: COLORS.tscircuitBlue,
    opacity: 0.09,
  })
}

function drawSystemArchitectureHeader(
  page: PDFPage,
  fonts: PdfFonts,
  input: SystemArchitecturePageInput,
  pageNumber: number,
) {
  const { width, height } = page.getSize()
  const y = height - 32
  const headerTitle = input.title
    ? input.title.startsWith("Schematics - ")
      ? input.title
      : `Schematics - ${input.title}`
    : "Schematics - System Architecture"
  const headerSize = 9
  const titleWidth = measureTextWidth(fonts.regular, headerTitle, headerSize)

  drawPdfText(page, `${pageNumber} | tscircuit`, {
    x: PAGE_MARGIN,
    y,
    size: headerSize,
    font: fonts.regular,
    color: COLORS.muted,
  })
  drawPdfText(page, headerTitle, {
    x: (width - titleWidth) / 2,
    y,
    size: headerSize,
    font: fonts.regular,
    color: COLORS.muted,
  })
}

function drawCoverMetadata(
  page: PDFPage,
  fonts: PdfFonts,
  input: TitlePageInput,
) {
  const { width } = page.getSize()
  const lines = [
    input.preparedBy && {
      label: "Generated by:",
      value: input.preparedBy,
    },
    input.preparedFor && {
      label: "Prepared for:",
      value: input.preparedFor,
    },
    input.date && {
      label: "Exported on:",
      value: input.date,
    },
    input.revision && {
      label: "Revision:",
      value: input.revision,
    },
  ].filter((line): line is { label: string; value: string } => Boolean(line))

  const startY = 126 + Math.max(0, lines.length - 2) * 10
  lines.forEach((line, index) => {
    const y = startY - index * 20
    const gap = 4
    const labelWidth = measureTextWidth(fonts.bold, line.label, 10.5)
    const valueWidth = measureTextWidth(fonts.regular, line.value, 10.5)
    const x = (width - labelWidth - gap - valueWidth) / 2

    drawPdfText(page, line.label, {
      x,
      y,
      size: 10.5,
      font: fonts.bold,
      color: COLORS.ink,
    })
    drawPdfText(page, line.value, {
      x: x + labelWidth + gap,
      y,
      size: 10.5,
      font: fonts.regular,
      color: COLORS.ink,
    })
  })
}

function drawCoverFooter(page: PDFPage, fonts: PdfFonts) {
  const { width } = page.getSize()

  drawCenteredPdfText(page, fonts, "tscircuit Inc. (c) 2026", {
    y: 38,
    size: 8.5,
    font: fonts.regular,
    color: COLORS.muted,
  })

  drawPdfText(page, "Powered by", {
    x: width - 114,
    y: 52,
    size: 8,
    font: fonts.regular,
    color: COLORS.soft,
  })
  drawPdfText(page, "tscircuit", {
    x: width - 114,
    y: 35,
    size: 17,
    font: fonts.bold,
    color: COLORS.tscircuitBlue,
  })
}

function drawCenteredPdfText(
  page: PDFPage,
  fonts: PdfFonts,
  text: string,
  options: {
    y: number
    size: number
    font: PdfFonts["regular"]
    color: Parameters<typeof drawPdfText>[2]["color"]
    transform?: (text: string) => string
  },
) {
  const { width } = page.getSize()
  const safeText = options.transform?.(text) ?? text
  drawPdfText(page, safeText, {
    x: (width - measureTextWidth(options.font, safeText, options.size)) / 2,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
  })
}
