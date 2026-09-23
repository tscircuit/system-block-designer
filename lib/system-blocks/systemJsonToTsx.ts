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
  SUBCIRCUIT_IMPORT_PATH_BY_COMPONENT_NAME,
  SubcircuitDefinitions,
  SystemBlockClasses,
  type SystemBlockName,
} from "./SubcircuitRegistry"

type SystemBlockConstructor = new (config: {
  systemBlockId?: string
  center?: SystemBlockJson["center"]
  size?: SystemBlockJson["size"]
  tsxInstanceName?: string
  subcircuitId?: string
  schSheetName?: string
}) => SystemBlockTsx

interface RuntimeBlock {
  json: SystemBlockJson
  componentName: SystemBlockName
  instanceName: string
  instance: SystemBlockTsx
}

interface RuntimeBlockInput {
  json: SystemBlockJson
  componentName: SystemBlockName
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

const COMPONENT_NAMES = new Set(Object.keys(SystemBlockClasses))

const SUBCIRCUIT_DEFINITIONS = Object.values(SubcircuitDefinitions)

export function systemJsonToTsx(systemJson: SystemJson[]) {
  const { runtimeBlocks, interfaceTraces } =
    createConnectedRuntimeBlocks(systemJson)
  const imports = createSubcircuitImports(runtimeBlocks)
  const board = createBoardTsx(runtimeBlocks, interfaceTraces)

  return `${imports.join("\n")}

export default () => (
${indent(board, 2)}
)`
}

function createSubcircuitImports(runtimeBlocks: RuntimeBlock[]) {
  const componentNamesByImportPath = new Map<string, Set<SystemBlockName>>()

  for (const runtimeBlock of runtimeBlocks) {
    const importPath =
      SUBCIRCUIT_IMPORT_PATH_BY_COMPONENT_NAME[runtimeBlock.componentName]
    const componentNames =
      componentNamesByImportPath.get(importPath) ?? new Set<SystemBlockName>()
    componentNames.add(runtimeBlock.componentName)
    componentNamesByImportPath.set(importPath, componentNames)
  }

  return Array.from(componentNamesByImportPath.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([importPath, componentNames]) =>
        `import { ${Array.from(componentNames).sort().join(", ")} } from ${JSON.stringify(importPath)}`,
    )
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
    .filter((block): block is RuntimeBlockInput => block !== null)
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
    throw new Error(
      "No supported subcircuit blocks were found in the system JSON",
    )
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
  runtimeBlocks: RuntimeBlock[],
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
): RuntimeBlockInput | null {
  const componentName = getComponentName(block)
  if (!componentName) return null

  return {
    json: block,
    componentName,
  }
}

function createRuntimeBlock(
  block: SystemBlockJson,
  componentName: SystemBlockName,
  instanceName: string,
): RuntimeBlock {
  const BlockClass = SystemBlockClasses[componentName] as SystemBlockConstructor
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

function createInstanceNameByBlockId(runtimeBlocks: RuntimeBlockInput[]) {
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
  componentName: SystemBlockName,
) {
  const definition = SUBCIRCUIT_DEFINITIONS.find(
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

function getComponentFamilyName(componentName: SystemBlockName) {
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
  runtimeBlockById: Map<string, RuntimeBlock>,
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
    sourcePort.label,
    targetPort.label,
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
  sourcePortLabel: string | undefined,
  targetPortLabel: string | undefined,
  connectionLabel: string | undefined,
): {
  sourceInterface: MatchedInterface
  targetInterface: MatchedInterface
  pinNames: string[]
} | null {
  const sourceInterfaces = sourceBlock.interfaces ?? []
  const targetInterfaces = targetBlock.interfaces ?? []
  const gpioPortMatch = matchGpioPortPair(
    sourceInterfaces,
    targetInterfaces,
    sourcePortLabel,
    targetPortLabel,
  )
  if (gpioPortMatch) return gpioPortMatch

  const normalizedSourcePortLabel = sourcePortLabel?.trim().toLowerCase()
  const normalizedTargetPortLabel = targetPortLabel?.trim().toLowerCase()
  const sourcePortInterface = normalizedSourcePortLabel
    ? sourceInterfaces.find(
        (candidate) =>
          candidate.name.toLowerCase() === normalizedSourcePortLabel,
      )
    : undefined
  const targetPortInterface = normalizedTargetPortLabel
    ? targetInterfaces.find(
        (candidate) =>
          candidate.name.toLowerCase() === normalizedTargetPortLabel,
      )
    : undefined
  const portInterfaceMatch = matchInterfacePair(
    sourcePortInterface,
    targetPortInterface,
  )
  if (portInterfaceMatch) return portInterfaceMatch

  const normalizedLabel = connectionLabel?.trim().toLowerCase()
  if (!normalizedLabel) return null

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

    const interfaceMatch = matchInterfacePair(sourceInterface, targetInterface)
    if (interfaceMatch) return interfaceMatch
  }

  return null
}

function matchGpioPortPair(
  sourceInterfaces: SystemBlockInterface[],
  targetInterfaces: SystemBlockInterface[],
  sourcePortLabel: string | undefined,
  targetPortLabel: string | undefined,
): {
  sourceInterface: MatchedInterface
  targetInterface: MatchedInterface
  pinNames: string[]
} | null {
  const sourcePin = findGpioPinForPort(sourceInterfaces, sourcePortLabel)
  const targetPin = findGpioPinForPort(targetInterfaces, targetPortLabel)
  if (!sourcePin || !targetPin) return null

  return {
    sourceInterface: {
      ...sourcePin.interfaceDefinition,
      subcircuitPinSelectorsByInterfacePinName: {
        GPIO: sourcePin.pinSelector,
      },
    },
    targetInterface: {
      ...targetPin.interfaceDefinition,
      subcircuitPinSelectorsByInterfacePinName: {
        GPIO: targetPin.pinSelector,
      },
    },
    pinNames: ["GPIO"],
  }
}

function findGpioPinForPort(
  interfaces: SystemBlockInterface[],
  portLabel: string | undefined,
): {
  interfaceDefinition: SystemBlockInterface
  pinSelector: string
} | null {
  const normalizedPortLabel = portLabel?.trim().toLowerCase()
  if (!normalizedPortLabel) return null

  for (const interfaceDefinition of interfaces) {
    if (interfaceDefinition.kind !== "gpio") continue
    const pinEntry = Object.entries(interfaceDefinition.gpioPins ?? {}).find(
      ([pinName]) => pinName.toLowerCase() === normalizedPortLabel,
    )
    if (pinEntry) {
      return {
        interfaceDefinition,
        pinSelector: pinEntry[1],
      }
    }
  }

  return null
}

function matchInterfacePair(
  sourceInterface: SystemBlockInterface | undefined,
  targetInterface: SystemBlockInterface | undefined,
): {
  sourceInterface: MatchedInterface
  targetInterface: MatchedInterface
  pinNames: string[]
} | null {
  if (!sourceInterface || !targetInterface) return null
  if (sourceInterface.kind !== targetInterface.kind) return null

  const sourceSubcircuitPinSelectors =
    getSubcircuitPinSelectorsByInterfacePinName(sourceInterface)
  const targetSubcircuitPinSelectors =
    getSubcircuitPinSelectorsByInterfacePinName(targetInterface)
  if (!sourceSubcircuitPinSelectors || !targetSubcircuitPinSelectors) {
    return null
  }

  const sourcePinNames = Object.keys(sourceSubcircuitPinSelectors)
  const pinNames = sourcePinNames.filter(
    (pinName) => pinName in targetSubcircuitPinSelectors,
  )
  const requiredPinNames = getRequiredPinNames(sourceInterface.kind)
  const hasRequiredPins =
    requiredPinNames.length > 0
      ? requiredPinNames.every((pinName) => pinNames.includes(pinName))
      : pinNames.length === sourcePinNames.length
  if (!hasRequiredPins) return null

  return {
    sourceInterface: {
      ...sourceInterface,
      subcircuitPinSelectorsByInterfacePinName: sourceSubcircuitPinSelectors,
    },
    targetInterface: {
      ...targetInterface,
      subcircuitPinSelectorsByInterfacePinName: targetSubcircuitPinSelectors,
    },
    pinNames,
  }
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

function getComponentName(block: SystemBlockJson): SystemBlockName | null {
  if (block.subcircuit_id && COMPONENT_NAMES.has(block.subcircuit_id)) {
    return block.subcircuit_id as SystemBlockName
  }

  if (block.label && COMPONENT_NAMES.has(block.label)) {
    return block.label as SystemBlockName
  }

  const partNumber = normalizePartNumber(block.part_number)
  const definition =
    SUBCIRCUIT_DEFINITIONS.find(
      (candidate) => normalizePartNumber(candidate.partNumber) === partNumber,
    ) ??
    SUBCIRCUIT_DEFINITIONS.find(
      (candidate) =>
        candidate.label === block.label &&
        candidate.category.every(
          (categoryPart, index) => block.category[index] === categoryPart,
        ),
    )

  return definition?.componentName as SystemBlockName | null
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
