import type {
  Point,
  Size,
  SystemBlock as SystemBlockJson,
  SystemBlockInterface,
  SystemJson,
  SystemPort,
} from "../system-json/system-json"
import type { IconColor } from "../utils/icon-colors"

export type SystemBlockConnectionValue = string | string[]

export type SystemBlockDefinition =
  | string
  | {
      /** Raw tscircuit connection target, e.g. "net.VCC" or "U1.SDA". */
      connection: string
    }
  | {
      /** Net name. Values without the "net." prefix are emitted with one. */
      netName: string
    }
  | {
      /** Connect to a port on another generated system block instance. */
      systemBlock: SystemBlock
      portName: string
    }

export interface SystemBlockPortDefinition {
  name: string
  sideOfBlock: SystemPort["side_of_block"]
}

export interface SystemBlockConfig {
  systemDiagramId?: string
  systemBlockId?: string
  center?: Point
  size?: Size
  label: string
  category: string[]
  componentName: string
  tsxInstanceName?: string
  icon?: string
  iconColor?: IconColor
  partNumber?: string
  description?: string
  subcircuitId?: string
  /** Name of the `<schematicsheet>` this block's subcircuit is rendered on. */
  schSheetName?: string
  interfaces?: SystemBlockInterface[]
  ports?: SystemBlockPortDefinition[]
  connectionPortExpansions?: Record<string, string[]>
}

export abstract class SystemBlock {
  protected readonly systemDiagramId: string
  protected readonly systemBlockId: string
  protected readonly center: Point
  protected readonly size: Size
  protected readonly label: string
  protected readonly category: string[]
  protected readonly componentName: string
  protected readonly tsxInstanceName: string
  protected readonly hasExplicitTsxInstanceName: boolean
  protected readonly icon?: string
  protected readonly iconColor?: IconColor
  protected readonly partNumber?: string
  protected readonly description?: string
  protected readonly subcircuitId?: string
  protected readonly schSheetName?: string
  protected readonly interfaces: SystemBlockInterface[]
  protected readonly ports: SystemBlockPortDefinition[]
  protected readonly connectionPortExpansions: Record<string, string[]>
  protected readonly connections: Record<string, SystemBlockConnectionValue> =
    {}

  constructor(config: SystemBlockConfig) {
    this.systemDiagramId = config.systemDiagramId ?? "system_diagram_0"
    this.systemBlockId = config.systemBlockId ?? this.createId(config.label)
    this.center = config.center ?? { x: 0, y: 0 }
    this.size = config.size ?? { width: 160, height: 96 }
    this.label = config.label
    this.category = config.category
    this.componentName = config.componentName
    this.tsxInstanceName = config.tsxInstanceName ?? this.systemBlockId
    this.hasExplicitTsxInstanceName = config.tsxInstanceName !== undefined
    this.icon = config.icon
    this.iconColor = config.iconColor
    this.partNumber = config.partNumber
    this.description = config.description
    this.subcircuitId = config.subcircuitId
    this.schSheetName = config.schSheetName
    this.interfaces = config.interfaces ?? []
    this.ports = config.ports ?? []
    this.connectionPortExpansions = config.connectionPortExpansions ?? {}
  }

  getSystemBlockJson(): SystemJson[] {
    const block: SystemBlockJson = {
      type: "system_block",
      system_diagram_id: this.systemDiagramId,
      system_block_id: this.systemBlockId,
      center: this.center,
      size: this.size,
      label: this.label,
      category: [...this.category],
      ...(this.icon ? { icon: this.icon } : {}),
      ...(this.iconColor ? { icon_color: this.iconColor } : {}),
      ...(this.partNumber ? { part_number: this.partNumber } : {}),
      ...(this.description ? { description: this.description } : {}),
      ...(this.subcircuitId ? { subcircuit_id: this.subcircuitId } : {}),
      ...(this.interfaces.length > 0
        ? {
            interfaces: this.interfaces.map((interfaceDefinition) => ({
              ...interfaceDefinition,
            })),
          }
        : {}),
    }

    return [block]
  }

  getSystemPortJson(systemPortIds: string[] = []): SystemPort[] {
    const portIdSet = new Set(systemPortIds)

    return this.ports
      .map<SystemPort>((port) => ({
        type: "system_port",
        system_diagram_id: this.systemDiagramId,
        system_block_id: this.systemBlockId,
        system_port_id: `${this.systemBlockId}_${this.createId(port.name)}`,
        label: port.name,
        side_of_block: port.sideOfBlock,
      }))
      .filter((port) => portIdSet.has(port.system_port_id))
  }

  setConnection(
    portName: string,
    connectionDefinitions: Array<SystemBlockDefinition>,
  ): this {
    const resolvedConnections = connectionDefinitions.flatMap((connection) =>
      this.resolveConnectionDefinition(portName, connection),
    )
    const connectionsByPort = new Map<string, string[]>()

    for (const { sourcePortName, targetConnection } of resolvedConnections) {
      connectionsByPort.set(sourcePortName, [
        ...(connectionsByPort.get(sourcePortName) ?? []),
        targetConnection,
      ])
    }

    for (const [sourcePortName, targetConnections] of connectionsByPort) {
      this.connections[sourcePortName] =
        targetConnections.length === 1
          ? targetConnections[0]
          : targetConnections
    }

    return this
  }

  getTsxPinsForPort(portName: string): string[] {
    return this.connectionPortExpansions[portName] ?? [portName]
  }

  getTsxFile(): string {
    const props = this.getTsxProps()

    if (!props) {
      return `<${this.componentName} />`
    }

    return `<${this.componentName} ${props} />`
  }

  protected getTsxProps(): string {
    const props: string[] = []

    if (this.hasExplicitTsxInstanceName) {
      props.push(`name=${JSON.stringify(this.tsxInstanceName)}`)
    }

    if (this.schSheetName) {
      props.push(`schSheetName=${JSON.stringify(this.schSheetName)}`)
    }

    if (Object.keys(this.connections).length > 0) {
      props.push(`connections={${this.stringifyJsObject(this.connections)}}`)
    }

    return props.join(" ")
  }

  protected resolveConnectionDefinition(
    portName: string,
    connectionDefinition: SystemBlockDefinition,
  ): Array<{ sourcePortName: string; targetConnection: string }> {
    if (
      typeof connectionDefinition === "object" &&
      "systemBlock" in connectionDefinition
    ) {
      const sourcePortNames = this.getTsxPinsForPort(portName)
      const targetPortNames =
        connectionDefinition.systemBlock.getTsxPinsForPort(
          connectionDefinition.portName,
        )

      if (sourcePortNames.length !== targetPortNames.length) {
        throw new Error(
          `Cannot connect ${this.componentName}.${portName} to ${connectionDefinition.systemBlock.componentName}.${connectionDefinition.portName}: port expansions have different lengths`,
        )
      }

      return sourcePortNames.map((sourcePortName, index) => ({
        sourcePortName,
        targetConnection: `${connectionDefinition.systemBlock.tsxInstanceName}.${targetPortNames[index]}`,
      }))
    }

    const sourcePortNames = this.getTsxPinsForPort(portName)

    if (sourcePortNames.length > 1) {
      throw new Error(
        `Cannot connect expanded port ${this.componentName}.${portName} to a non-block target; connect each expanded pin directly instead`,
      )
    }

    if (typeof connectionDefinition === "string") {
      return [
        { sourcePortName: portName, targetConnection: connectionDefinition },
      ]
    }

    if ("connection" in connectionDefinition) {
      return [
        {
          sourcePortName: portName,
          targetConnection: connectionDefinition.connection,
        },
      ]
    }

    const targetConnection = connectionDefinition.netName.startsWith("net.")
      ? connectionDefinition.netName
      : `net.${connectionDefinition.netName}`

    return [{ sourcePortName: portName, targetConnection }]
  }

  protected stringifyJsObject(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stringifyJsObject(item)).join(", ")}]`
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value).map(([key, entryValue]) => {
        const propertyName = /^[A-Za-z_$][\w$]*$/.test(key)
          ? key
          : JSON.stringify(key)

        return `${propertyName}: ${this.stringifyJsObject(entryValue)}`
      })

      return `{ ${entries.join(", ")} }`
    }

    return JSON.stringify(value)
  }

  private createId(value: string): string {
    return value
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase()
  }
}
