import type {
  SystemBlock as SystemBlockJson,
  SystemBlockInterface,
  SystemBlockInterfaceKind,
  SystemBlockInterfacePinMap,
  SystemBlockInterfacePinName,
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

interface TiRuntimeBlockInput {
  json: SystemBlockJson
  componentName: TiSystemBlockName
}

interface InterfaceTrace {
  from: string
  to: string
}

type MatchedInterface = SystemBlockInterface & {
  subcircuitPinSelectorsByInterfacePinName: SystemBlockInterfacePinMap
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
  const runtimeBlockInputs = blocks
    .map(createRuntimeBlockInput)
    .filter((block): block is TiRuntimeBlockInput => block !== null)
  const instanceNameByBlockId = createInstanceNameByBlockId(runtimeBlockInputs)
  const runtimeBlocks = runtimeBlockInputs.map((runtimeBlockInput) =>
    createRuntimeBlock(
      runtimeBlockInput.json,
      runtimeBlockInput.componentName,
      instanceNameByBlockId.get(runtimeBlockInput.json.system_block_id) ??
        toTsxIdentifier(runtimeBlockInput.json.system_block_id),
    ),
  )

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

function createRuntimeBlockInput(
  block: SystemBlockJson,
): TiRuntimeBlockInput | null {
  const componentName = getTiComponentName(block)
  if (!componentName) return null

  return {
    json: block,
    componentName,
  }
}

function createRuntimeBlock(
  block: SystemBlockJson,
  componentName: TiSystemBlockName,
  instanceName: string,
): TiRuntimeBlock {
  const BlockClass = TiSystemBlockClasses[componentName] as TiBlockConstructor
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

function createInstanceNameByBlockId(runtimeBlocks: TiRuntimeBlockInput[]) {
  const instanceNameByBlockId = new Map<string, string>()
  const usedNames = new Set<string>()

  for (const runtimeBlock of runtimeBlocks) {
    if (isCanvasGeneratedBlockId(runtimeBlock.json.system_block_id)) continue
    const instanceName = getUniqueIdentifier(
      toTsxIdentifier(runtimeBlock.json.system_block_id),
      usedNames,
    )
    instanceNameByBlockId.set(runtimeBlock.json.system_block_id, instanceName)
    usedNames.add(instanceName)
  }

  for (const runtimeBlock of runtimeBlocks) {
    if (!isCanvasGeneratedBlockId(runtimeBlock.json.system_block_id)) continue
    const [candidate] = getSemanticInstanceNameCandidates(
      runtimeBlock.json,
      runtimeBlock.componentName,
    )
    const instanceName = getUniqueIdentifier(
      candidate ?? toTsxIdentifier(runtimeBlock.json.system_block_id),
      usedNames,
    )
    instanceNameByBlockId.set(runtimeBlock.json.system_block_id, instanceName)
    usedNames.add(instanceName)
  }

  return instanceNameByBlockId
}

const BROAD_CATEGORY_NAMES = new Set([
  "Communication",
  "Memory",
  "Power",
  "Processing & Security",
])

function getSemanticInstanceNameCandidates(
  block: SystemBlockJson,
  componentName: TiSystemBlockName,
) {
  const definition = TI_DEFINITIONS.find(
    (candidate) => candidate.componentName === componentName,
  )
  const candidates = [
    block.label && block.label !== definition?.label ? block.label : undefined,
    block.category[0] && !BROAD_CATEGORY_NAMES.has(block.category[0])
      ? block.category[0]
      : undefined,
    getComponentFamilyName(componentName),
    block.label,
    block.category[block.category.length - 1],
    block.system_block_id,
  ]

  return uniqueStrings(
    candidates
      .filter((candidate): candidate is string => Boolean(candidate))
      .map(toSnakeCaseIdentifier)
      .map(toTsxIdentifier)
      .filter((candidate) => candidate.length > 0),
  )
}

function getComponentFamilyName(componentName: TiSystemBlockName) {
  return componentName.replace(/_[^_]+$/, "")
}

function isCanvasGeneratedBlockId(value: string) {
  return /^b_\d+$/.test(value)
}

function getUniqueIdentifier(base: string, usedNames: Set<string>) {
  const normalizedBase = toTsxIdentifier(base) || "block"
  if (!usedNames.has(normalizedBase)) return normalizedBase

  let index = 2
  while (usedNames.has(`${normalizedBase}_${index}`)) {
    index++
  }
  return `${normalizedBase}_${index}`
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
      match.sourceInterface.subcircuitPinSelectorsByInterfacePinName[pinName],
    ),
    to: createSubcircuitPinSelector(
      targetBlock.instanceName,
      match.targetInterface.subcircuitPinSelectorsByInterfacePinName[pinName],
    ),
  }))
}

function findMatchingInterface(
  sourceBlock: SystemBlockJson,
  targetBlock: SystemBlockJson,
  connectionLabel: string | undefined,
): {
  sourceInterface: MatchedInterface
  targetInterface: MatchedInterface
  pinNames: string[]
} | null {
  const normalizedLabel = connectionLabel?.trim().toLowerCase()
  if (!normalizedLabel) return null

  const sourceInterfaces = sourceBlock.interfaces ?? []
  const targetInterfaces = targetBlock.interfaces ?? []

  for (const sourceInterface of sourceInterfaces) {
    const sourceSubcircuitPinSelectors =
      getSubcircuitPinSelectorsByInterfacePinName(sourceInterface)
    if (!sourceSubcircuitPinSelectors) continue

    if (
      sourceInterface.kind !== normalizedLabel &&
      sourceInterface.name.toLowerCase() !== normalizedLabel
    ) {
      continue
    }

    const targetInterface = targetInterfaces.find((candidate) => {
      if (!getSubcircuitPinSelectorsByInterfacePinName(candidate)) return false
      return (
        candidate.kind === sourceInterface.kind &&
        (candidate.name.toLowerCase() === sourceInterface.name.toLowerCase() ||
          candidate.kind === normalizedLabel)
      )
    })
    if (!targetInterface) continue

    const targetSubcircuitPinSelectors =
      getSubcircuitPinSelectorsByInterfacePinName(targetInterface)
    if (!targetSubcircuitPinSelectors) continue

    const sourcePinNames = Object.keys(sourceSubcircuitPinSelectors)
    const pinNames = sourcePinNames.filter(
      (pinName) => pinName in targetSubcircuitPinSelectors,
    )
    const requiredPinNames = getRequiredPinNames(sourceInterface.kind)
    const hasRequiredPins =
      requiredPinNames.length > 0
        ? requiredPinNames.every((pinName) => pinNames.includes(pinName))
        : pinNames.length === sourcePinNames.length

    if (hasRequiredPins) {
      return {
        sourceInterface: {
          ...sourceInterface,
          subcircuitPinSelectorsByInterfacePinName:
            sourceSubcircuitPinSelectors,
        },
        targetInterface: {
          ...targetInterface,
          subcircuitPinSelectorsByInterfacePinName:
            targetSubcircuitPinSelectors,
        },
        pinNames,
      }
    }
  }

  return null
}

function getSubcircuitPinSelectorsByInterfacePinName(
  interfaceDefinition: SystemBlockInterface,
): SystemBlockInterfacePinMap | undefined {
  if (interfaceDefinition.kind === "gpio") return interfaceDefinition.gpioPins
  if (interfaceDefinition.kind === "i2c") return interfaceDefinition.i2cPins
  if (interfaceDefinition.kind === "spi") return interfaceDefinition.spiPins
  return undefined
}

function getRequiredPinNames(
  interfaceKind: SystemBlockInterfaceKind,
): SystemBlockInterfacePinName[] {
  if (interfaceKind === "i2c") return ["SDA", "SCL"]
  if (interfaceKind === "spi") return ["CS", "SCLK", "MOSI", "MISO"]
  return []
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

function toSnakeCaseIdentifier(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function indent(value: string, spaces: number) {
  const padding = " ".repeat(spaces)
  return value
    .split("\n")
    .map((line) => (line.length > 0 ? `${padding}${line}` : line))
    .join("\n")
}
