import type { AnyCircuitElement, SchematicSheet } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import type { BomViewRow } from "../../lib/bom/types"
import { type CreatePdfParams, createPdf } from "../../lib/pdfgen/createPdf"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import type {
  SystemBlock,
  SystemConnection,
  SystemDiagram,
  SystemJson,
} from "../../lib/system-json/system-json"

const DEFAULT_PROJECT_NAME = "System Block Design"

// Render each schematic sheet SVG at an A4-landscape aspect ratio (297:210) so the
// sheet frame circuit-to-svg draws fills the page instead of being letterboxed.
const SHEET_SVG_WIDTH = 1400
const SHEET_SVG_HEIGHT = Math.round((SHEET_SVG_WIDTH * 210) / 297)

function getSchematicSheets(circuitJson: CircuitJson): SchematicSheet[] {
  return (circuitJson as unknown as AnyCircuitElement[])
    .filter(
      (element): element is SchematicSheet =>
        element.type === "schematic_sheet",
    )
    .slice()
    .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
}

function getProjectName(systemJson: SystemJson[]): string {
  const diagram = systemJson.find(
    (item): item is SystemDiagram => item.type === "system_diagram",
  )
  return diagram?.name?.trim() || DEFAULT_PROJECT_NAME
}

export function getProjectFileName(systemJson: SystemJson[]): string {
  const slug = getProjectName(systemJson)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug || "system-block-design"
}

/**
 * Maps the designer's system JSON (and optionally resolved circuit JSON) onto
 * the pdfgen page inputs. The schematic sheet is only included when circuit
 * JSON is available, so the PDF still generates from system JSON alone.
 */
export function buildProjectPdfParams(
  systemJson: SystemJson[],
  circuitJson: CircuitJson | null,
  bomRows: BomViewRow[] = [],
): CreatePdfParams {
  const diagram = systemJson.find(
    (item): item is SystemDiagram => item.type === "system_diagram",
  )
  const blocks = systemJson.filter(
    (item): item is SystemBlock => item.type === "system_block",
  )
  const connections = systemJson.filter(
    (item): item is SystemConnection => item.type === "system_connection",
  )
  const projectName = getProjectName(systemJson)

  const params: CreatePdfParams = {
    titlePage: {
      type: "title",
      projectName,
      subtitle: "System design package",
      description:
        diagram?.description ??
        "Generated from the system block designer, covering the project overview, system architecture, schematic sheets, and BOM.",
      preparedBy: "System Block Designer",
    },
    projectDetailsPage: {
      type: "project_details",
      summary: diagram?.description,
      details: {
        Project: projectName,
        Blocks: blocks.length,
        Connections: connections.length,
        "BOM Rows": bomRows.length,
      },
      sections: [
        {
          title: "Scope",
          body: "This package captures the project overview, the system architecture diagram, schematic sheet previews resolved from the design, and the resolved bill of materials.",
        },
      ],
    },
    technicalSpecificationsPage: {
      type: "technical_specifications",
      summary: "Functional blocks defined in the system design.",
      rows: blocks.map((block) => ({
        name: block.label ?? block.system_block_id,
        value: block.category.join(", ") || "—",
        notes: block.description,
      })),
    },
    systemArchitecturePage: {
      type: "system_architecture",
      subtitle: `${blocks.length} blocks, ${connections.length} connections`,
      systemJson,
    },
    bomPage: {
      type: "bom",
      rows: bomRows,
    },
  }

  if (circuitJson && circuitJson.length > 0) {
    const circuit = circuitJson as Parameters<
      typeof convertCircuitJsonToSchematicSvg
    >[0]
    const sheets = getSchematicSheets(circuitJson)

    if (sheets.length > 0) {
      // One PDF page per schematic sheet, rendered with circuit-to-svg's native
      // sheet frame (no hand-drawn frame). Cross-sheet connections appear as net
      // labels on each sheet.
      params.schematicSheetSvgs = sheets.map((sheet) => ({
        type: "schematic_sheet",
        // core sets display_name (from the block label) but it is missing from
        // circuit-json's exported SchematicSheet type, so read it the same way
        // circuit-to-svg's own stacked-sheet renderer does.
        title:
          (sheet as { display_name?: string }).display_name ??
          sheet.name ??
          `Schematics - ${projectName}`,
        svg: convertCircuitJsonToSchematicSvg(circuit, {
          schematicSheetId: sheet.schematic_sheet_id,
          width: SHEET_SVG_WIDTH,
          height: SHEET_SVG_HEIGHT,
        }),
      }))
    } else {
      // No explicit sheets: fall back to a single schematic page.
      params.schematicSheetSvgs = [
        {
          type: "schematic_sheet",
          title: `Schematics - ${projectName}`,
          svg: convertCircuitJsonToSchematicSvg(circuit),
        },
      ]
    }
  }

  return params
}

export async function createProjectPdf(
  systemJson: SystemJson[],
  circuitJson: CircuitJson | null,
  bomRows: BomViewRow[] = [],
): Promise<Uint8Array<ArrayBuffer>> {
  const bytes = await createPdf(
    buildProjectPdfParams(systemJson, circuitJson, bomRows),
  )
  // pdf-lib types its output as Uint8Array<ArrayBufferLike>; normalize to an
  // owned ArrayBuffer-backed view so the bytes are a valid Blob part.
  return new Uint8Array(bytes)
}
