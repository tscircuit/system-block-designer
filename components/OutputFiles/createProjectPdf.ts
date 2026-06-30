import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { type CreatePdfParams, createPdf } from "../../lib/pdfgen/createPdf"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import type {
  SystemBlock,
  SystemConnection,
  SystemDiagram,
  SystemJson,
} from "../../lib/system-json/system-json"

const DEFAULT_PROJECT_NAME = "System Block Design"

export function getProjectName(systemJson: SystemJson[]): string {
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
        "Generated from the system block designer, covering the project overview, system architecture, and schematic sheets.",
      preparedBy: "System Block Designer",
    },
    projectDetailsPage: {
      type: "project_details",
      summary: diagram?.description,
      details: {
        Project: projectName,
        Blocks: blocks.length,
        Connections: connections.length,
      },
      sections: [
        {
          title: "Scope",
          body: "This package captures the project overview, the system architecture diagram, and schematic sheet previews resolved from the design.",
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
  }

  if (circuitJson && circuitJson.length > 0) {
    const schematicSvg = convertCircuitJsonToSchematicSvg(
      circuitJson as Parameters<typeof convertCircuitJsonToSchematicSvg>[0],
    )
    params.schematicSheetSvgs = [
      {
        type: "schematic_sheet",
        title: `Schematics - ${projectName}`,
        svg: schematicSvg,
      },
    ]
  }

  return params
}

export async function createProjectPdf(
  systemJson: SystemJson[],
  circuitJson: CircuitJson | null,
): Promise<Uint8Array<ArrayBuffer>> {
  const bytes = await createPdf(buildProjectPdfParams(systemJson, circuitJson))
  // pdf-lib types its output as Uint8Array<ArrayBufferLike>; normalize to an
  // owned ArrayBuffer-backed view so the bytes are a valid Blob part.
  return new Uint8Array(bytes)
}
