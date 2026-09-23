import { LibraryCategoryName } from "../system-block-library/types"
import type { SystemBlockInterface } from "../system-json/system-json"
import { SystemBlock, type SystemBlockConfig } from "./SystemBlock"

export type SubcircuitSystemBlockConfig = Partial<
  Pick<
    SystemBlockConfig,
    | "systemDiagramId"
    | "systemBlockId"
    | "center"
    | "size"
    | "tsxInstanceName"
    | "subcircuitId"
    | "schSheetName"
  >
>

type PortSide = "top" | "bottom" | "left" | "right"

export interface SubcircuitDefinition {
  componentName: string
  importPath?: string
  sourceDirectory?: string
  label: string
  category: readonly [LibraryCategoryName, string]
  partNumber: string
  description: string
  icon: string
  size?: SystemBlockConfig["size"]
  interfaces?: SystemBlockInterface[]
  ports: Partial<Record<PortSide, string[]>>
  connectionPortExpansions?: Record<string, string[]>
}

export type SubcircuitSystemBlockConstructor = new (
  config?: SubcircuitSystemBlockConfig,
) => SystemBlock

export function createSubcircuitConfig(
  definition: SubcircuitDefinition,
  config: SubcircuitSystemBlockConfig,
): SystemBlockConfig {
  return {
    systemDiagramId: config.systemDiagramId,
    systemBlockId:
      config.systemBlockId ?? toSnakeCase(definition.componentName),
    center: config.center,
    size: config.size ?? definition.size ?? { width: 200, height: 128 },
    tsxInstanceName: config.tsxInstanceName,
    subcircuitId: config.subcircuitId,
    schSheetName: config.schSheetName,
    label: definition.label,
    category: [...definition.category],
    componentName: definition.componentName,
    icon: definition.icon,
    partNumber: definition.partNumber,
    description: definition.description,
    interfaces: definition.interfaces,
    ports: Object.entries(definition.ports).flatMap(([sideOfBlock, names]) =>
      (names ?? []).map((name) => ({
        name,
        sideOfBlock: sideOfBlock as PortSide,
      })),
    ),
    connectionPortExpansions: definition.connectionPortExpansions,
  }
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
}
