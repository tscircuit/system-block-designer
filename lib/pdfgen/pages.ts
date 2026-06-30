import type { PDFDocument, PDFPage } from "pdf-lib"
import { COLORS, PAGE_MARGIN } from "./constants"
import {
  drawKeyValueGrid,
  drawPageChrome,
  drawPageTitle,
  drawSections,
  drawSpecTable,
  drawText,
} from "./layout"
import { drawSchematicSheetPage } from "./schematicSheet"
import { drawSystemDiagram } from "./systemDiagram"
import type {
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
) {
  const { width, height } = page.getSize()
  drawPageChrome(page, fonts, "Project Report")

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: 96,
    width: width - PAGE_MARGIN * 2,
    height: height - 180,
    color: COLORS.panel,
    borderColor: COLORS.line,
    borderWidth: 1,
  })
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: height - 154,
    width: 160,
    height: 6,
    color: COLORS.accent,
  })

  drawText(page, input.projectName, {
    x: PAGE_MARGIN + 36,
    y: height - 218,
    size: 34,
    font: fonts.bold,
    color: COLORS.ink,
    maxWidth: width - PAGE_MARGIN * 2 - 72,
    lineHeight: 40,
  })

  if (input.subtitle) {
    drawText(page, input.subtitle, {
      x: PAGE_MARGIN + 36,
      y: height - 306,
      size: 15,
      font: fonts.regular,
      color: COLORS.muted,
      maxWidth: 500,
      lineHeight: 20,
    })
  }

  if (input.description) {
    drawText(page, input.description, {
      x: PAGE_MARGIN + 36,
      y: height - 372,
      size: 11.5,
      font: fonts.regular,
      color: COLORS.muted,
      maxWidth: 560,
      lineHeight: 16,
    })
  }

  const meta = [
    ["Prepared for", input.preparedFor],
    ["Prepared by", input.preparedBy],
    ["Date", input.date],
    ["Revision", input.revision],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  let y = 148
  for (const [label, value] of meta) {
    page.drawText(label.toUpperCase(), {
      x: PAGE_MARGIN + 36,
      y: y + 16,
      size: 7.5,
      font: fonts.bold,
      color: COLORS.soft,
    })
    page.drawText(value, {
      x: PAGE_MARGIN + 36,
      y,
      size: 11,
      font: fonts.regular,
      color: COLORS.ink,
    })
    y -= 42
  }
}

export function drawProjectDetailsPage(
  page: PDFPage,
  fonts: PdfFonts,
  input: ProjectDetailsPageInput,
) {
  drawPageChrome(page, fonts, input.title ?? "Project Details")
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
) {
  drawPageChrome(page, fonts, input.title ?? "Technical Specifications")
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
  context: PdfRenderContext,
) {
  const { width } = page.getSize()
  drawPageChrome(page, fonts, input.title ?? "System Architecture")
  const y = drawPageTitle(
    page,
    fonts,
    input.title ?? "System Architecture",
    input.subtitle,
  )
  await drawSystemDiagram(
    pdfDoc,
    page,
    input.systemJson,
    {
      x: PAGE_MARGIN,
      y: 64,
      width: width - PAGE_MARGIN * 2,
      height: y - 92,
    },
    context.rasterizeSvg,
  )
}

export async function drawPdfPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  pageInput:
    | TitlePageInput
    | ProjectDetailsPageInput
    | TechnicalSpecificationsPageInput
    | SystemArchitecturePageInput
    | SchematicSheetPageInput,
  context: PdfRenderContext,
) {
  if (pageInput.type === "title") {
    drawTitlePage(page, fonts, pageInput)
  } else if (pageInput.type === "project_details") {
    drawProjectDetailsPage(page, fonts, pageInput)
  } else if (pageInput.type === "technical_specifications") {
    drawTechnicalSpecificationsPage(page, fonts, pageInput)
  } else if (pageInput.type === "system_architecture") {
    await drawSystemArchitecturePage(pdfDoc, page, fonts, pageInput, context)
  } else {
    await drawSchematicSheetPage(pdfDoc, page, fonts, pageInput, context)
  }
}
