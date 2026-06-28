import { PDFDocument, StandardFonts } from "pdf-lib"
import { PAGE } from "./constants"
import { drawPdfPage } from "./pages"
import type {
  CreatePdfParams,
  PdfFonts,
  PdfPageInput,
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

  for (const pageInput of pages) {
    await drawPdfPage(
      pdfDoc,
      pdfDoc.addPage([PAGE.width, PAGE.height]),
      fonts,
      pageInput,
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
