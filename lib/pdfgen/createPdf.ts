import { PDFDocument, StandardFonts } from "pdf-lib"
import { paginateBomPages } from "./bomPage"
import { PAGE_SIZES } from "./constants"
import { drawPdfPage } from "./pages"
import type {
  BomPageInput,
  CreatePdfParams,
  PdfFonts,
  PdfPageInput,
  PdfRenderContext,
  SchematicSheetPageInput,
} from "./types"

export type {
  BomPageInput,
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
  const pages = normalizePages(params, fonts)
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

function normalizePages(
  params: CreatePdfParams,
  fonts: PdfFonts,
): PdfPageInput[] {
  const rawPages = params.pages ?? [
    params.titlePage,
    params.projectDetailsPage,
    params.technicalSpecificationsPage,
    params.bomPage,
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
  ]

  return rawPages
    .filter((page): page is PdfPageInput => Boolean(page))
    .flatMap<PdfPageInput>((page): PdfPageInput[] =>
      page.type === "bom"
        ? paginateBomPages(page as BomPageInput, fonts)
        : [page],
    )
}

function getPageSize(pageInput: PdfPageInput) {
  return pageInput.type === "system_architecture" ||
    pageInput.type === "schematic_sheet" ||
    pageInput.type === "bom"
    ? PAGE_SIZES.landscape
    : PAGE_SIZES.portrait
}
