import type {
  SystemBlock as SystemBlockJson,
  SystemBlockInterface,
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
  schSheetName?: string
}) => SystemBlockTsx

interface TiRuntimeBlock {
  json: SystemBlockJson
  componentName: TiSystemBlockName
  instanceName: string
  instance: SystemBlockTsx
}

interface InterfaceTrace {
  from: string
  to: string
}

export interface SystemJsonToTsxProject {
  files: Record<string, string>
}

const TI_COMPONENT_NAMES = new Set(Object.keys(TiSystemBlockClasses))

const TI_DEFINITIONS = Object.values(TiSubcircuitDefinitions)

export function systemJsonToTsx(systemJson: SystemJson[]) {
  const { runtimeBlocks, interfaceTraces } =
    createConnectedRuntimeBlocks(systemJson)
  const imports = Array.from(
    new Set(runtimeBlocks.map((runtimeBlock) => runtimeBlock.componentName)),
  ).sort()
  const board = createBoardTsx(runtimeBlocks, interfaceTraces)

  return `import { ${imports.join(", ")} } from "@tsci/tscircuit.ti"

export default () => (
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

  return {
    runtimeBlocks,
    interfaceTraces: connections.flatMap((connection) =>
      createInterfaceTraces(connection, portById, runtimeBlockById),
    ),
  }
}

function createBoardTsx(
  runtimeBlocks: TiRuntimeBlock[],
  interfaceTraces: InterfaceTrace[],
) {
  // One schematic sheet per block. Each block's subcircuit is pinned to its sheet
  // via schSheetName (see createRuntimeBlock), so the schematic renders one framed
  // sheet per block with cross-block connections shown as net labels.
  const sheetChildren = runtimeBlocks.map((runtimeBlock, index) => {
    const displayName = runtimeBlock.json.label ?? runtimeBlock.instanceName
    return `  <schematicsheet name=${JSON.stringify(runtimeBlock.instanceName)} displayName=${JSON.stringify(displayName)} sheetIndex={${index}} />`
  })
  const componentChildren = runtimeBlocks.map(
    (runtimeBlock) => `  ${runtimeBlock.instance.getTsxFile()}`,
  )
  const traceChildren = interfaceTraces.map(
    (trace) =>
      `  <trace from=${JSON.stringify(trace.from)} to=${JSON.stringify(trace.to)} />`,
  )
  const children = [
    ...sheetChildren,
    ...componentChildren,
    ...traceChildren,
  ].join("\n")

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
    // Each block renders on its own schematic sheet, keyed by its instance name.
    schSheetName: instanceName,
  })

  return {
    json: block,
    componentName,
    instanceName,
    instance,
  }
}

function createInterfaceTraces(
  connection: SystemConnection,
  portById: Map<string, SystemPort>,
  runtimeBlockById: Map<string, TiRuntimeBlock>,
): InterfaceTrace[] {
  if (!connection.source_system_port_id || !connection.target_system_port_id) {
    return []
  }

  const sourcePort = portById.get(connection.source_system_port_id)
  const targetPort = portById.get(connection.target_system_port_id)
  if (!sourcePort || !targetPort) return []

  const sourceBlock = runtimeBlockById.get(sourcePort.system_block_id)
  const targetBlock = runtimeBlockById.get(targetPort.system_block_id)
  if (!sourceBlock || !targetBlock) return []

  const match = findMatchingInterface(
    sourceBlock.json,
    targetBlock.json,
    connection.label,
  )
  if (!match) return []

  return match.pinNames.map((pinName) => ({
    from: createSubcircuitPinSelector(
      sourceBlock.instanceName,
      match.sourceInterface.i2cPins![pinName],
    ),
    to: createSubcircuitPinSelector(
      targetBlock.instanceName,
      match.targetInterface.i2cPins![pinName],
    ),
  }))
}

function findMatchingInterface(
  sourceBlock: SystemBlockJson,
  targetBlock: SystemBlockJson,
  connectionLabel: string | undefined,
): {
  sourceInterface: SystemBlockInterface & {
    i2cPins: Record<string, string>
  }
  targetInterface: SystemBlockInterface & {
    i2cPins: Record<string, string>
  }
  pinNames: string[]
} | null {
  const normalizedLabel = connectionLabel?.trim().toLowerCase()
  if (!normalizedLabel) return null

  const sourceInterfaces = sourceBlock.interfaces ?? []
  const targetInterfaces = targetBlock.interfaces ?? []

  for (const sourceInterface of sourceInterfaces) {
    if (!sourceInterface.i2cPins) continue
    if (
      sourceInterface.kind.toLowerCase() !== normalizedLabel &&
      sourceInterface.name.toLowerCase() !== normalizedLabel
    ) {
      continue
    }

    const targetInterface = targetInterfaces.find(
      (candidate) =>
        candidate.i2cPins &&
        candidate.kind.toLowerCase() === sourceInterface.kind.toLowerCase() &&
        (candidate.name.toLowerCase() === sourceInterface.name.toLowerCase() ||
          candidate.kind.toLowerCase() === normalizedLabel),
    )
    if (!targetInterface?.i2cPins) continue

    const sourcePinNames = Object.keys(sourceInterface.i2cPins)
    const pinNames = sourcePinNames.filter(
      (pinName) => pinName in targetInterface.i2cPins!,
    )
    const requiredPinNames =
      sourceInterface.kind.toLowerCase() === "i2c" ? ["SDA", "SCL"] : []
    const hasRequiredPins =
      requiredPinNames.length > 0
        ? requiredPinNames.every((pinName) => pinNames.includes(pinName))
        : pinNames.length === sourcePinNames.length

    if (hasRequiredPins) {
      return {
        sourceInterface: {
          ...sourceInterface,
          i2cPins: sourceInterface.i2cPins,
        },
        targetInterface: {
          ...targetInterface,
          i2cPins: targetInterface.i2cPins,
        },
        pinNames,
      }
    }
  }

  return null
}

function createSubcircuitPinSelector(
  instanceName: string,
  localPinPath: string,
) {
  const selectorParts = [instanceName, ...localPinPath.split(".")]
  return selectorParts
    .filter((part) => part.length > 0)
    .map((part) => `.${part}`)
    .join(" > ")
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
