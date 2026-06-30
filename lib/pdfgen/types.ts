import type { PDFFont, RGB } from "pdf-lib"
import type {
  SystemBlock,
  SystemConnection,
  SystemDiagram,
  SystemJson,
  SystemPort,
} from "../system-json/system-json"

export type PdfPageInput =
  | TitlePageInput
  | ProjectDetailsPageInput
  | TechnicalSpecificationsPageInput
  | SystemArchitecturePageInput
  | SchematicSheetPageInput

export interface CreatePdfParams {
  pages?: PdfPageInput[]
  titlePage?: TitlePageInput
  projectDetailsPage?: ProjectDetailsPageInput
  technicalSpecificationsPage?: TechnicalSpecificationsPageInput
  systemArchitecturePage?: SystemArchitecturePageInput
  schematicSheetSvgs?: Array<string | SchematicSheetPageInput>
}

export interface TitlePageInput {
  type: "title"
  projectName: string
  subtitle?: string
  description?: string
  preparedFor?: string
  preparedBy?: string
  date?: string
  revision?: string
}

export interface ProjectDetailsPageInput {
  type: "project_details"
  title?: string
  projectName?: string
  summary?: string
  details?: Record<string, string | number | undefined>
  sections?: PdfTextSection[]
}

export interface TechnicalSpecificationsPageInput {
  type: "technical_specifications"
  title?: string
  summary?: string
  specifications?: Record<string, string | number | undefined>
  rows?: Array<{ name: string; value: string | number; notes?: string }>
  sections?: PdfTextSection[]
}

export interface SystemArchitecturePageInput {
  type: "system_architecture"
  title?: string
  subtitle?: string
  systemJson: SystemJson[]
}

export interface SchematicSheetPageInput {
  type: "schematic_sheet"
  title?: string
  svg: string
}

export interface PdfTextSection {
  title: string
  body?: string
  items?: Array<string | { label: string; value: string | number }>
}

export interface PdfFonts {
  regular: PDFFont
  bold: PDFFont
  mono: PDFFont
}

export interface RasterizedImage {
  bytes: Uint8Array
  width: number
  height: number
}

/**
 * Converts an SVG string into PNG bytes at (roughly) the requested width.
 *
 * The implementation is environment-specific: Node/test code uses resvg, while
 * the browser uses a `<canvas>`. Keeping it injectable is what lets `createPdf`
 * run in the browser without pulling in the Node-only resvg native module.
 */
export type SvgRasterizer = (
  svg: string,
  targetWidth: number,
) => RasterizedImage | Promise<RasterizedImage>

export interface NormalizedSystemJson {
  diagram?: SystemDiagram
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
}

export interface PdfFrame {
  x: number
  y: number
  width: number
  height: number
}

export interface PdfTextOptions {
  x: number
  y: number
  size: number
  font: PDFFont
  color: RGB
  maxWidth: number
  lineHeight: number
}

export interface PdfRenderContext {
  pageNumber: number
  pageCount: number
  rasterizeSvg: SvgRasterizer
  schematicSheetNumber?: number
  schematicSheetCount?: number
}
