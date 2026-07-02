import type { PDFPage } from "pdf-lib"
import { formatPackageDisplayName } from "../bom/formatPackageDisplayName"
import type { BomViewRow } from "../bom/types"
import { COLORS, PAGE_SIZES } from "./constants"
import { drawPdfText, drawText, measureTextWidth, wrapText } from "./layout"
import type { BomPageInput, PdfFonts, PdfRenderContext } from "./types"

type BomColumn = {
  key: keyof BomViewRow
  label: string
  width: number
}

const BOM_COLUMNS: BomColumn[] = [
  { key: "referenceDesignators", label: "Ref.\nDes.", width: 40 },
  { key: "value", label: "Value", width: 78 },
  { key: "manufacturer", label: "Manufacturer", width: 118 },
  { key: "mpn", label: "MPN", width: 148 },
  { key: "packageName", label: "Package", width: 96 },
  { key: "description", label: "Description", width: 305.89 },
]

const BOM_HEADER_HEIGHT = 30
const BOM_BODY_FONT_SIZE = 7.8
const BOM_HEADER_FONT_SIZE = 8.8
const BOM_HEADER_LINE_HEIGHT = 9
const BOM_LINE_HEIGHT = 10
const BOM_CELL_PADDING_X = 6
const BOM_CELL_PADDING_Y = 5
const BOM_MIN_ROW_HEIGHT = 28
const BOM_TABLE_X = 22
const BOM_TABLE_TOP = PAGE_SIZES.landscape.height - 60
const BOM_FOOTER_Y = 14

export function paginateBomPages(
  input: BomPageInput,
  fonts: PdfFonts,
): BomPageInput[] {
  const rows = expandReferenceDesignatorRows(input.rows)
  const chunks: Array<{ rows: BomViewRow[]; rowStart: number }> = []
  let nextRowIndex = 0

  if (rows.length === 0) {
    return [
      {
        ...input,
        rowStart: 0,
        totalRows: 0,
      },
    ]
  }

  while (nextRowIndex < rows.length) {
    const chunkRowStart = nextRowIndex
    let remainingHeight = getAvailableTableHeight()
    const chunkRows: BomViewRow[] = []

    while (nextRowIndex < rows.length) {
      const row = rows[nextRowIndex]
      const rowHeight = measureBomRowHeight(row, fonts)
      if (chunkRows.length > 0 && rowHeight > remainingHeight) break

      chunkRows.push(row)
      remainingHeight -= rowHeight
      nextRowIndex += 1
    }

    if (chunkRows.length === 0) {
      chunkRows.push(rows[nextRowIndex])
      nextRowIndex += 1
    }

    chunks.push({ rows: chunkRows, rowStart: chunkRowStart })
  }

  return chunks.map((chunk) => ({
    ...input,
    rows: chunk.rows,
    rowStart: chunk.rowStart,
    totalRows: rows.length,
  }))
}

export function drawBomPage(
  page: PDFPage,
  fonts: PdfFonts,
  input: BomPageInput,
  context: PdfRenderContext,
) {
  drawBomHeader(page, fonts, input, context)

  if (input.rows.length === 0) {
    drawEmptyBomState(page, fonts, BOM_TABLE_TOP)
    return
  }

  drawBomTable(page, fonts, input.rows, BOM_TABLE_X, BOM_TABLE_TOP)
}

function drawBomTable(
  page: PDFPage,
  fonts: PdfFonts,
  rows: BomViewRow[],
  x: number,
  y: number,
) {
  const tableWidth = BOM_COLUMNS.reduce(
    (total, column) => total + column.width,
    0,
  )

  page.drawRectangle({
    x,
    y: y - BOM_HEADER_HEIGHT,
    width: tableWidth,
    height: BOM_HEADER_HEIGHT,
    color: COLORS.panel,
    borderColor: COLORS.line,
    borderWidth: 0.8,
  })

  let columnX = x
  for (const column of BOM_COLUMNS) {
    drawCenteredHeaderLabel(page, fonts, column.label, columnX, y, column.width)
    columnX += column.width
  }

  let cursor = y - BOM_HEADER_HEIGHT
  for (const [index, row] of rows.entries()) {
    const rowLines = BOM_COLUMNS.map((column) =>
      wrapCellValue(
        getColumnValue(row, column.key),
        fonts.regular,
        column.width - BOM_CELL_PADDING_X * 2,
      ),
    )
    const rowHeight = getRowHeightFromLines(rowLines)
    cursor -= rowHeight

    page.drawRectangle({
      x,
      y: cursor,
      width: tableWidth,
      height: rowHeight,
      color: index % 2 === 0 ? COLORS.white : COLORS.panel,
      borderColor: COLORS.line,
      borderWidth: 0.5,
    })

    let cellX = x
    for (const [columnIndex, column] of BOM_COLUMNS.entries()) {
      if (columnIndex > 0) {
        page.drawLine({
          start: { x: cellX, y: cursor },
          end: { x: cellX, y: cursor + rowHeight },
          thickness: 0.4,
          color: COLORS.line,
        })
      }

      let textY = cursor + rowHeight - BOM_CELL_PADDING_Y - BOM_BODY_FONT_SIZE
      for (const line of rowLines[columnIndex]) {
        drawPdfText(page, line, {
          x: cellX + BOM_CELL_PADDING_X,
          y: textY,
          size: BOM_BODY_FONT_SIZE,
          font: fonts.regular,
          color: COLORS.ink,
        })
        textY -= BOM_LINE_HEIGHT
      }

      cellX += column.width
    }
  }
}

function drawEmptyBomState(page: PDFPage, fonts: PdfFonts, y: number) {
  const { width } = page.getSize()

  page.drawRectangle({
    x: BOM_TABLE_X,
    y: y - 96,
    width: width - BOM_TABLE_X * 2,
    height: 84,
    color: COLORS.panel,
    borderColor: COLORS.line,
    borderWidth: 1,
  })

  drawPdfText(page, "No BOM rows available", {
    x: BOM_TABLE_X + 18,
    y: y - 46,
    size: 14,
    font: fonts.bold,
    color: COLORS.ink,
  })
  drawText(page, "Resolve the design and generate BOM data before exporting.", {
    x: BOM_TABLE_X + 18,
    y: y - 66,
    size: 10,
    font: fonts.regular,
    color: COLORS.muted,
    maxWidth: width - BOM_TABLE_X * 2 - 36,
    lineHeight: 14,
  })
}

function getAvailableTableHeight() {
  return BOM_TABLE_TOP - (BOM_FOOTER_Y + 14) - BOM_HEADER_HEIGHT
}

function measureBomRowHeight(row: BomViewRow, fonts: PdfFonts) {
  const rowLines = BOM_COLUMNS.map((column) =>
    wrapCellValue(
      getColumnValue(row, column.key),
      fonts.regular,
      column.width - BOM_CELL_PADDING_X * 2,
    ),
  )

  return getRowHeightFromLines(rowLines)
}

function getRowHeightFromLines(rowLines: string[][]) {
  const maxLines = Math.max(
    ...rowLines.map((lines) => Math.max(lines.length, 1)),
  )
  return Math.max(
    BOM_MIN_ROW_HEIGHT,
    maxLines * BOM_LINE_HEIGHT + BOM_CELL_PADDING_Y * 2,
  )
}

function wrapCellValue(
  value: string,
  font: PdfFonts["regular"],
  maxWidth: number,
) {
  const lines = wrapText(value || "—", font, BOM_BODY_FONT_SIZE, maxWidth)
  return lines.length > 0 ? lines : ["—"]
}

function expandReferenceDesignatorRows(rows: BomViewRow[]) {
  // The reference PDF renders one BOM line per reference designator, even
  // when the BOM source groups equivalent parts into a single row.
  return rows.flatMap((row) => {
    const referenceDesignators = row.referenceDesignators
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    if (!referenceDesignators?.length || referenceDesignators.length === 1) {
      return [row]
    }

    return referenceDesignators.map((referenceDesignator) => ({
      ...row,
      referenceDesignators: referenceDesignator,
    }))
  })
}

function getColumnValue(row: BomViewRow, key: BomColumn["key"]) {
  if (key === "description") return row.description || row.partName || "—"
  if (key === "packageName") {
    return formatPackageDisplayName(row.packageName || "—")
  }
  if (key === "referenceDesignators") {
    return row.referenceDesignators || "—"
  }
  return row[key] || "—"
}

function drawCenteredHeaderLabel(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  x: number,
  y: number,
  width: number,
) {
  const lines = wrapText(
    label,
    fonts.bold,
    BOM_HEADER_FONT_SIZE,
    width - BOM_CELL_PADDING_X * 2,
  )
  const blockHeight = lines.length * BOM_HEADER_LINE_HEIGHT
  let textY =
    y - (BOM_HEADER_HEIGHT - blockHeight) / 2 - BOM_HEADER_FONT_SIZE + 2

  for (const line of lines) {
    const lineWidth = measureTextWidth(fonts.bold, line, BOM_HEADER_FONT_SIZE)
    drawPdfText(page, line, {
      x: x + (width - lineWidth) / 2,
      y: textY,
      size: BOM_HEADER_FONT_SIZE,
      font: fonts.bold,
      color: COLORS.ink,
    })
    textY -= BOM_HEADER_LINE_HEIGHT
  }
}

function drawBomHeader(
  page: PDFPage,
  fonts: PdfFonts,
  input: BomPageInput,
  context: PdfRenderContext,
) {
  const { width, height } = page.getSize()
  const topY = height - 30
  const title = input.title ?? "Bill of Materials (BOM)"
  const pageLabel = `${context.pageNumber} | tscircuit`
  const showingLabel = createShowingLabel(input)
  const titleWidth = measureTextWidth(fonts.regular, title, 9)
  const showingWidth = measureTextWidth(fonts.regular, showingLabel, 8.5)

  drawPdfText(page, pageLabel, {
    x: BOM_TABLE_X,
    y: topY,
    size: 8.5,
    font: fonts.regular,
    color: COLORS.muted,
  })
  drawPdfText(page, title, {
    x: (width - titleWidth) / 2,
    y: topY,
    size: 9,
    font: fonts.bold,
    color: COLORS.muted,
  })
  drawPdfText(page, showingLabel, {
    x: width - BOM_TABLE_X - showingWidth,
    y: topY,
    size: 8.5,
    font: fonts.regular,
    color: COLORS.muted,
  })
  page.drawLine({
    start: { x: BOM_TABLE_X, y: height - 42 },
    end: { x: width - BOM_TABLE_X, y: height - 42 },
    thickness: 0.8,
    color: COLORS.line,
  })
}

function createShowingLabel(input: BomPageInput) {
  const totalRows = input.totalRows ?? input.rows.length
  if (totalRows === 0) return "Showing 0 of 0"

  const start = (input.rowStart ?? 0) + 1
  const end = (input.rowStart ?? 0) + input.rows.length
  return `Showing ${start} - ${end} of ${totalRows}`
}
