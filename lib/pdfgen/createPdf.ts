import { PDFDocument, StandardFonts } from "pdf-lib"
import { PAGE_SIZES } from "./constants"
import { drawPdfPage } from "./pages"
import type {
  CreatePdfParams,
  PdfFonts,
  PdfPageInput,
  PdfRenderContext,
  SchematicSheetPageInput,
} from "./types"

export type {
  CreatePdfParams,
  PdfPageInput,
  PdfTextSection,
  ProjectDetailsPageInput,
  SchematicSheetPageInput,
  SystemArchitecturePageInput,
  TechnicalSpecificationsPageInput,
  TitlePageInput,
} from "./types"

export async function createPdf(params: CreatePdfParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    mono: await pdfDoc.embedFont(StandardFonts.Courier),
  }
  const pages = normalizePages(params)
  const schematicSheetCount = pages.filter(
    (page) => page.type === "schematic_sheet",
  ).length
  let schematicSheetNumber = 0

  for (const [index, pageInput] of pages.entries()) {
    const size = getPageSize(pageInput)
    const context: PdfRenderContext = {
      pageNumber: index + 1,
      pageCount: pages.length,
    }
    if (pageInput.type === "schematic_sheet") {
      schematicSheetNumber += 1
      context.schematicSheetNumber = schematicSheetNumber
      context.schematicSheetCount = schematicSheetCount
    }
    await drawPdfPage(
      pdfDoc,
      pdfDoc.addPage([size.width, size.height]),
      fonts,
      pageInput,
      context,
    )
  }

  return pdfDoc.save()
}

function normalizePages(params: CreatePdfParams): PdfPageInput[] {
  if (params.pages) return params.pages

  return [
    params.titlePage,
    params.projectDetailsPage,
    params.technicalSpecificationsPage,
    params.systemArchitecturePage,
    ...(params.schematicSheetSvgs ?? []).map((sheet, index) =>
      typeof sheet === "string"
        ? ({
            type: "schematic_sheet",
            title: `Schematic Sheet ${index + 1}`,
            svg: sheet,
          } satisfies SchematicSheetPageInput)
        : sheet,
    ),
  ].filter((page): page is PdfPageInput => Boolean(page))
}

function getPageSize(pageInput: PdfPageInput) {
  return pageInput.type === "system_architecture" ||
    pageInput.type === "schematic_sheet"
    ? PAGE_SIZES.landscape
    : PAGE_SIZES.portrait
}
