import type {
  SystemBlock as SystemBlockJson,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../system-json/system-json"
import { SystemBlock as SystemBlockTsx } from "./SystemBlock"
import {
  TiSubcircuitDefinitions,
  TiSystemBlockClasses,
  type TiSystemBlockName,
} from "./TiSubcircuits"

type TiBlockConstructor = new (config: {
  systemBlockId?: string
  center?: SystemBlockJson["center"]
  size?: SystemBlockJson["size"]
  tsxInstanceName?: string
  subcircuitId?: string
}) => SystemBlockTsx

interface TiRuntimeBlock {
  json: SystemBlockJson
  componentName: TiSystemBlockName
  instanceName: string
  instance: SystemBlockTsx
}

export interface SystemJsonToTsxProject {
  files: Record<string, string>
}

const TI_COMPONENT_NAMES = new Set(Object.keys(TiSystemBlockClasses))

const TI_DEFINITIONS = Object.values(TiSubcircuitDefinitions)

export function systemJsonToTsx(systemJson: SystemJson[]) {
  const runtimeBlocks = createConnectedRuntimeBlocks(systemJson)
  const imports = Array.from(
    new Set(runtimeBlocks.map((runtimeBlock) => runtimeBlock.componentName)),
  ).sort()
  const board = createBoardTsx(runtimeBlocks)

  return `import { ${imports.join(", ")} } from "@tsci/tscircuit.ti"

circuit.add(
${indent(board, 2)}
)`
}

export function systemJsonToTsxProject(
  systemJson: SystemJson[],
): SystemJsonToTsxProject {
  return {
    files: {
      "index.circuit.tsx": systemJsonToTsx(systemJson),
    },
  }
}

function createConnectedRuntimeBlocks(systemJson: SystemJson[]) {
  const blocks = systemJson.filter(
    (item): item is SystemBlockJson => item.type === "system_block",
  )
  const ports = systemJson.filter(
    (item): item is SystemPort => item.type === "system_port",
  )
  const connections = systemJson.filter(
    (item): item is SystemConnection => item.type === "system_connection",
  )
  const runtimeBlocks = blocks
    .map(createRuntimeBlock)
    .filter((block): block is TiRuntimeBlock => block !== null)

  if (runtimeBlocks.length === 0) {
    throw new Error("No TI subcircuit blocks were found in the system JSON")
  }

  const runtimeBlockById = new Map(
    runtimeBlocks.map((runtimeBlock) => [
      runtimeBlock.json.system_block_id,
      runtimeBlock,
    ]),
  )
  const portById = new Map(ports.map((port) => [port.system_port_id, port]))

  for (const connection of connections) {
    connectRuntimeBlocks(connection, portById, runtimeBlockById)
  }

  return runtimeBlocks
}

function createBoardTsx(runtimeBlocks: TiRuntimeBlock[]) {
  const children = runtimeBlocks
    .map((runtimeBlock) => `  ${runtimeBlock.instance.getTsxFile()}`)
    .join("\n")

  return `<board routingDisabled>
${children}
  </board>`
}

function createRuntimeBlock(block: SystemBlockJson): TiRuntimeBlock | null {
  const componentName = getTiComponentName(block)
  if (!componentName) return null

  const BlockClass = TiSystemBlockClasses[componentName] as TiBlockConstructor
  const instanceName = toTsxIdentifier(block.system_block_id)
  const instance = new BlockClass({
    systemBlockId: block.system_block_id,
    center: block.center,
    size: block.size,
    tsxInstanceName: instanceName,
    subcircuitId: componentName,
  })

  return {
    json: block,
    componentName,
    instanceName,
    instance,
  }
}

function connectRuntimeBlocks(
  connection: SystemConnection,
  portById: Map<string, SystemPort>,
  runtimeBlockById: Map<string, TiRuntimeBlock>,
) {
  if (!connection.source_system_port_id || !connection.target_system_port_id) {
    return
  }

  const sourcePort = portById.get(connection.source_system_port_id)
  const targetPort = portById.get(connection.target_system_port_id)
  if (!sourcePort || !targetPort) return

  const sourceBlock = runtimeBlockById.get(sourcePort.system_block_id)
  const targetBlock = runtimeBlockById.get(targetPort.system_block_id)
  if (!sourceBlock || !targetBlock) return
  if (!sourcePort.label || !targetPort.label) {
    throw new Error(
      `Cannot convert ${connection.system_connection_id}: connected TI ports must have labels`,
    )
  }

  sourceBlock.instance.setConnection(sourcePort.label, [
    {
      systemBlock: targetBlock.instance,
      portName: targetPort.label,
    },
  ])
}

function getTiComponentName(block: SystemBlockJson): TiSystemBlockName | null {
  if (block.subcircuit_id && TI_COMPONENT_NAMES.has(block.subcircuit_id)) {
    return block.subcircuit_id as TiSystemBlockName
  }

  if (block.label && TI_COMPONENT_NAMES.has(block.label)) {
    return block.label as TiSystemBlockName
  }

  const partNumber = normalizePartNumber(block.part_number)
  const definition =
    TI_DEFINITIONS.find(
      (candidate) => normalizePartNumber(candidate.partNumber) === partNumber,
    ) ??
    TI_DEFINITIONS.find(
      (candidate) =>
        candidate.label === block.label &&
        candidate.category.every(
          (categoryPart, index) => block.category[index] === categoryPart,
        ),
    )

  return definition?.componentName as TiSystemBlockName | null
}

function normalizePartNumber(partNumber: string | undefined) {
  return partNumber?.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ?? ""
}

function toTsxIdentifier(value: string) {
  const identifier = value
    .replace(/[^A-Za-z0-9_$]+/g, "_")
    .replace(/^[^A-Za-z_$]+/, "")

  return identifier || "block"
}

function indent(value: string, spaces: number) {
  const padding = " ".repeat(spaces)
  return value
    .split("\n")
    .map((line) => (line.length > 0 ? `${padding}${line}` : line))
    .join("\n")
}
