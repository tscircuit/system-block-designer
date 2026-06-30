import type { PDFPage, PDFFont } from "pdf-lib"
import { COLORS, PAGE_MARGIN } from "./constants"
import type { PdfFonts, PdfTextOptions, PdfTextSection } from "./types"

const PDF_TEXT_FALLBACKS: Record<string, string> = {
  "\u00A0": " ",
  "\u2010": "-",
  "\u2011": "-",
  "\u2012": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2015": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201B": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2022": "-",
  "\u2026": "...",
  "\u2212": "-",
}

const combiningMarkPattern = /\p{Mark}+/gu
const fontCharacterSetCache = new WeakMap<PDFFont, Set<number>>()

export function drawPageChrome(page: PDFPage, fonts: PdfFonts, label: string) {
  const { width, height } = page.getSize()
  drawPdfText(page, label.toUpperCase(), {
    x: PAGE_MARGIN,
    y: height - 32,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.soft,
  })
  page.drawLine({
    start: { x: PAGE_MARGIN, y: height - 42 },
    end: { x: width - PAGE_MARGIN, y: height - 42 },
    thickness: 0.8,
    color: COLORS.line,
  })
}

export function drawPageTitle(
  page: PDFPage,
  fonts: PdfFonts,
  title: string,
  subtitle?: string,
) {
  const { width, height } = page.getSize()
  drawPdfText(page, title, {
    x: PAGE_MARGIN,
    y: height - 84,
    size: 24,
    font: fonts.bold,
    color: COLORS.ink,
  })

  if (!subtitle) return height - 120

  drawText(page, subtitle, {
    x: PAGE_MARGIN,
    y: height - 108,
    size: 10.5,
    font: fonts.regular,
    color: COLORS.muted,
    maxWidth: width - PAGE_MARGIN * 2,
    lineHeight: 15,
  })
  return height - 146
}

export function drawKeyValueGrid(
  page: PDFPage,
  fonts: PdfFonts,
  values: Record<string, string | number | undefined>,
  x: number,
  y: number,
  columns: number,
) {
  const { width } = page.getSize()
  const entries = Object.entries(values).filter((entry) => entry[1] != null)
  const gap = 14
  const cellWidth = (width - PAGE_MARGIN * 2 - gap * (columns - 1)) / columns
  const cellHeight = 58

  for (const [index, [label, value]] of entries.entries()) {
    const col = index % columns
    const row = Math.floor(index / columns)
    const cellX = x + col * (cellWidth + gap)
    const cellY = y - row * (cellHeight + 12) - cellHeight

    page.drawRectangle({
      x: cellX,
      y: cellY,
      width: cellWidth,
      height: cellHeight,
      color: COLORS.panel,
      borderColor: COLORS.line,
      borderWidth: 1,
    })
    drawPdfText(page, label.toUpperCase(), {
      x: cellX + 14,
      y: cellY + cellHeight - 20,
      size: 7.2,
      font: fonts.bold,
      color: COLORS.soft,
    })
    drawText(page, String(value), {
      x: cellX + 14,
      y: cellY + 18,
      size: 11,
      font: fonts.regular,
      color: COLORS.ink,
      maxWidth: cellWidth - 28,
      lineHeight: 14,
    })
  }

  return y - Math.ceil(entries.length / columns) * (cellHeight + 12) - 10
}

export function drawSpecTable(
  page: PDFPage,
  fonts: PdfFonts,
  rows: Array<{ name: string; value: string | number; notes?: string }>,
  x: number,
  y: number,
) {
  const { width: pageWidth } = page.getSize()
  const width = pageWidth - PAGE_MARGIN * 2
  const rowHeight = 34
  const headerHeight = 26

  page.drawRectangle({
    x,
    y: y - headerHeight,
    width,
    height: headerHeight,
    color: COLORS.accent,
  })
  drawPdfText(page, "Parameter", {
    x: x + 14,
    y: y - 17,
    size: 9,
    font: fonts.bold,
    color: COLORS.white,
  })
  drawPdfText(page, "Value", {
    x: x + 248,
    y: y - 17,
    size: 9,
    font: fonts.bold,
    color: COLORS.white,
  })
  drawPdfText(page, "Notes", {
    x: x + 414,
    y: y - 17,
    size: 9,
    font: fonts.bold,
    color: COLORS.white,
  })

  let cursor = y - headerHeight
  for (const [index, row] of rows.entries()) {
    cursor -= rowHeight
    page.drawRectangle({
      x,
      y: cursor,
      width,
      height: rowHeight,
      color: index % 2 === 0 ? COLORS.white : COLORS.panel,
      borderColor: COLORS.line,
      borderWidth: 0.5,
    })
    drawPdfText(page, row.name, {
      x: x + 14,
      y: cursor + 13,
      size: 9.5,
      font: fonts.bold,
      color: COLORS.ink,
    })
    drawPdfText(page, String(row.value), {
      x: x + 248,
      y: cursor + 13,
      size: 9.5,
      font: fonts.regular,
      color: COLORS.ink,
    })
    if (row.notes) {
      drawText(page, row.notes, {
        x: x + 414,
        y: cursor + 13,
        size: 8.5,
        font: fonts.regular,
        color: COLORS.muted,
        maxWidth: width - 428,
        lineHeight: 11,
      })
    }
  }

  return cursor - 18
}

export function drawSections(
  page: PDFPage,
  fonts: PdfFonts,
  sections: PdfTextSection[],
  startY: number,
) {
  const { width } = page.getSize()
  let y = startY
  for (const section of sections) {
    if (y < 90) return
    drawPdfText(page, section.title, {
      x: PAGE_MARGIN,
      y,
      size: 13,
      font: fonts.bold,
      color: COLORS.ink,
    })
    y -= 20
    if (section.body) {
      y =
        drawText(page, section.body, {
          x: PAGE_MARGIN,
          y,
          size: 9.5,
          font: fonts.regular,
          color: COLORS.muted,
          maxWidth: width - PAGE_MARGIN * 2,
          lineHeight: 13,
        }) - 8
    }
    for (const item of section.items ?? []) {
      const line =
        typeof item === "string" ? item : `${item.label}: ${String(item.value)}`
      drawPdfText(page, "-", {
        x: PAGE_MARGIN,
        y,
        size: 9,
        font: fonts.regular,
        color: COLORS.accent,
      })
      y =
        drawText(page, line, {
          x: PAGE_MARGIN + 15,
          y,
          size: 9.5,
          font: fonts.regular,
          color: COLORS.muted,
          maxWidth: width - PAGE_MARGIN * 2 - 15,
          lineHeight: 13,
        }) - 5
    }
    y -= 10
  }
}

export function drawText(page: PDFPage, text: string, options: PdfTextOptions) {
  let y = options.y
  for (const line of wrapText(
    text,
    options.font,
    options.size,
    options.maxWidth,
  )) {
    drawPdfText(page, line, {
      x: options.x,
      y,
      size: options.size,
      font: options.font,
      color: options.color,
    })
    y -= options.lineHeight
  }
  return y
}

export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const safeText = sanitizePdfText(text, font)
  const lines: string[] = []
  for (const paragraph of safeText.split(/\n+/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (measureTextWidth(font, candidate, size) <= maxWidth || !line) {
        line = candidate
      } else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

export function drawPdfText(
  page: PDFPage,
  text: string,
  options: Omit<NonNullable<Parameters<PDFPage["drawText"]>[1]>, "font"> & {
    font: PDFFont
  },
) {
  const safeText = sanitizePdfText(text, options.font)
  page.drawText(safeText, options)
}

export function measureTextWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(sanitizePdfText(text, font), size)
}

export function sanitizePdfText(text: string, font: PDFFont) {
  const normalizedText = text.replace(/\r\n?/g, "\n")
  const supportedCharacters = getSupportedCharacters(font)
  let result = ""

  for (const character of normalizedText) {
    if (character === "\n") {
      result += "\n"
      continue
    }

    if (character === "\t") {
      result += "  "
      continue
    }

    if (supportedCharacters.has(character.codePointAt(0)!)) {
      result += character
      continue
    }

    const fallback = PDF_TEXT_FALLBACKS[character]
    if (fallback) {
      result += sanitizePdfText(fallback, font)
      continue
    }

    const decomposed = character.normalize("NFKD").replace(combiningMarkPattern, "")
    if (decomposed && decomposed !== character) {
      result += sanitizePdfText(decomposed, font)
      continue
    }

    result += "?"
  }

  return result
}

function getSupportedCharacters(font: PDFFont) {
  let characters = fontCharacterSetCache.get(font)
  if (!characters) {
    characters = new Set(font.getCharacterSet())
    fontCharacterSetCache.set(font, characters)
  }
  return characters
}

export function contain(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  }
}
