import { z } from "zod"
import {
  Point,
  SystemBlock,
  SystemConnection,
  SystemJsonArray,
  SystemPort,
  type SystemJson,
} from "../../lib/system-json/system-json"
import { LIBRARY } from "../../lib/system-block-library/library"
import type { LibraryItem } from "../../lib/system-block-library/types"
import {
  inferConnectionInterface,
  normalizeSystemJson,
  updateConnectionPaths,
} from "../DesignCanvas/systemJsonCanvas"
import type { AiDesignAction } from "./aiChatTypes"

const AiSystemConnectionInput = SystemConnection.extend({
  path: z.array(Point).optional(),
})

const AiDesignActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("upsert_block"),
    block: SystemBlock,
  }),
  z.object({
    type: z.literal("upsert_port"),
    port: SystemPort,
  }),
  z.object({
    type: z.literal("upsert_connection"),
    connection: AiSystemConnectionInput,
  }),
  z.object({
    type: z.literal("update_block"),
    blockId: z.string(),
    patch: SystemBlock.pick({
      center: true,
      size: true,
      label: true,
      category: true,
      icon: true,
      icon_color: true,
      part_number: true,
      description: true,
      subcircuit_id: true,
      interfaces: true,
    }).partial(),
  }),
  z.object({
    type: z.literal("update_port"),
    portId: z.string(),
    patch: SystemPort.pick({
      label: true,
      side_of_block: true,
    }).partial(),
  }),
  z.object({
    type: z.literal("update_connection"),
    connectionId: z.string(),
    patch: AiSystemConnectionInput.pick({
      source_system_port_id: true,
      target_system_port_id: true,
      system_port_ids: true,
      path: true,
      label: true,
    }).partial(),
  }),
])

const AiDesignActionsSchema = z.array(AiDesignActionSchema)

type AiLibraryItem = LibraryItem & { category: string[] }

const AI_LIBRARY_ITEMS: AiLibraryItem[] = LIBRARY.flatMap((category) =>
  category.items
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      category: [...(item.category ?? [category.name])],
    })),
)

function removeNullFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeNullFields)
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null)
      .map(([entryKey, entryValue]) => [
        entryKey,
        removeNullFields(entryValue),
      ]),
  )
}

function sameStringList(
  a: readonly string[] | undefined,
  b: readonly string[],
) {
  if (!a || a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function findLibraryItemForBlock(block: SystemBlock) {
  return AI_LIBRARY_ITEMS.find(
    (item) =>
      (Boolean(item.subcircuitId) &&
        Boolean(block.subcircuit_id) &&
        item.subcircuitId === block.subcircuit_id) ||
      sameStringList(block.category, item.category) ||
      block.label === item.type,
  )
}

function normalizeBlockWithLibraryItem(
  block: SystemBlock,
  libraryItem: AiLibraryItem,
): SystemBlock {
  return {
    ...block,
    category: [...libraryItem.category],
    icon: libraryItem.icon,
    size: {
      width: libraryItem.w ?? block.size.width,
      height: libraryItem.h ?? block.size.height,
    },
    ...(libraryItem.subcircuitId
      ? { subcircuit_id: libraryItem.subcircuitId }
      : {}),
  }
}

function upsertSystemJsonItem(
  systemJson: SystemJson[],
  nextItem: SystemJson,
): SystemJson[] {
  const getItemId = (item: SystemJson) => {
    if (item.type === "system_diagram") return item.system_diagram_id
    if (item.type === "system_block") return item.system_block_id
    if (item.type === "system_port") return item.system_port_id
    return item.system_connection_id
  }

  const nextId = getItemId(nextItem)
  const index = systemJson.findIndex(
    (item) => item.type === nextItem.type && getItemId(item) === nextId,
  )
  if (index === -1) return [...systemJson, nextItem]

  return systemJson.map((item, itemIndex) =>
    itemIndex === index ? nextItem : item,
  )
}

function assertValidReferences(systemJson: SystemJson[]) {
  const current = normalizeSystemJson(systemJson)
  const blockIds = new Set(current.blocks.map((block) => block.system_block_id))
  const portIds = new Set(current.ports.map((port) => port.system_port_id))

  for (const port of current.ports) {
    if (!blockIds.has(port.system_block_id)) {
      throw new Error(
        `AI action references missing block "${port.system_block_id}" from port "${port.system_port_id}".`,
      )
    }
  }

  for (const connection of current.connections) {
    const connectedPortIds = [
      connection.source_system_port_id,
      connection.target_system_port_id,
      ...(connection.system_port_ids ?? []),
    ].filter((portId): portId is string => Boolean(portId))

    for (const portId of connectedPortIds) {
      if (!portIds.has(portId)) {
        throw new Error(
          `AI action references missing port "${portId}" from connection "${connection.system_connection_id}".`,
        )
      }
    }
  }
}

function normalizeConnectionInterfaceLabels(systemJson: SystemJson[]) {
  const current = normalizeSystemJson(systemJson)
  const portMap = new Map(
    current.ports.map((port) => [port.system_port_id, port]),
  )

  return systemJson.map((item) => {
    if (item.type !== "system_connection") return item

    const currentInterface = inferConnectionInterface(item.label)
    if (currentInterface !== "gpio") return item

    const connectedPortIds = [
      item.source_system_port_id,
      item.target_system_port_id,
      ...(item.system_port_ids ?? []),
    ].filter((portId): portId is string => Boolean(portId))
    const connectedInterfaces = connectedPortIds.map((portId) =>
      inferConnectionInterface(portMap.get(portId)?.label),
    )

    if (connectedInterfaces.includes("i2c")) {
      return { ...item, label: "i2c" }
    }
    if (connectedInterfaces.includes("spi")) {
      return { ...item, label: "spi" }
    }
    if (connectedInterfaces.includes("supply")) {
      return { ...item, label: "supply" }
    }

    return item
  })
}

function getConnectionBlockPairKey(
  connection: SystemConnection,
  portMap: Map<string, SystemPort>,
) {
  const sourcePort = connection.source_system_port_id
    ? portMap.get(connection.source_system_port_id)
    : undefined
  const targetPort = connection.target_system_port_id
    ? portMap.get(connection.target_system_port_id)
    : undefined

  if (!sourcePort || !targetPort) return null
  const blockIds = [
    sourcePort.system_block_id,
    targetPort.system_block_id,
  ].sort()
  return `${blockIds[0]}::${blockIds[1]}`
}

function coalesceBusConnections(systemJson: SystemJson[]) {
  const current = normalizeSystemJson(systemJson)
  const portMap = new Map(
    current.ports.map((port) => [port.system_port_id, port]),
  )
  const busConnectionByKey = new Map<string, SystemConnection>()
  const removedConnectionIds = new Set<string>()

  for (const connection of current.connections) {
    const connectionInterface = inferConnectionInterface(connection.label)
    if (connectionInterface !== "i2c" && connectionInterface !== "spi") {
      continue
    }

    const blockPairKey = getConnectionBlockPairKey(connection, portMap)
    if (!blockPairKey) continue

    const busKey = `${connectionInterface}::${blockPairKey}`
    const existingConnection = busConnectionByKey.get(busKey)
    if (!existingConnection) {
      busConnectionByKey.set(busKey, connection)
      continue
    }

    const mergedPortIds = new Set([
      existingConnection.source_system_port_id,
      existingConnection.target_system_port_id,
      ...(existingConnection.system_port_ids ?? []),
      connection.source_system_port_id,
      connection.target_system_port_id,
      ...(connection.system_port_ids ?? []),
    ])

    existingConnection.system_port_ids = [...mergedPortIds].filter(
      (portId): portId is string => Boolean(portId),
    )
    existingConnection.label = connectionInterface
    removedConnectionIds.add(connection.system_connection_id)
  }

  if (!removedConnectionIds.size) return systemJson

  return systemJson.filter(
    (item) =>
      item.type !== "system_connection" ||
      !removedConnectionIds.has(item.system_connection_id),
  )
}

export function applyAiDesignActions(
  systemJson: SystemJson[],
  actions: AiDesignAction[],
): SystemJson[] {
  const parsedActions = AiDesignActionsSchema.parse(
    removeNullFields(actions),
  ) as AiDesignAction[]
  let nextSystemJson = SystemJsonArray.parse(systemJson)

  for (const action of parsedActions) {
    if (action.type === "upsert_block") {
      const libraryItem = findLibraryItemForBlock(action.block)
      if (!libraryItem) {
        throw new Error(
          `AI action tried to add block "${action.block.label ?? action.block.system_block_id}" that is not in the design library.`,
        )
      }
      nextSystemJson = upsertSystemJsonItem(
        nextSystemJson,
        normalizeBlockWithLibraryItem(action.block, libraryItem),
      )
    } else if (action.type === "upsert_port") {
      nextSystemJson = upsertSystemJsonItem(nextSystemJson, action.port)
    } else if (action.type === "upsert_connection") {
      nextSystemJson = upsertSystemJsonItem(nextSystemJson, {
        ...action.connection,
        path: action.connection.path ?? [],
      })
    } else if (action.type === "update_block") {
      let updated = false
      nextSystemJson = nextSystemJson.map((item) => {
        if (
          item.type !== "system_block" ||
          item.system_block_id !== action.blockId
        ) {
          return item
        }
        updated = true
        return { ...item, ...action.patch }
      })
      if (!updated) {
        throw new Error(
          `AI action tried to update missing block "${action.blockId}".`,
        )
      }
    } else if (action.type === "update_port") {
      let updated = false
      nextSystemJson = nextSystemJson.map((item) => {
        if (
          item.type !== "system_port" ||
          item.system_port_id !== action.portId
        ) {
          return item
        }
        updated = true
        return { ...item, ...action.patch }
      })
      if (!updated) {
        throw new Error(
          `AI action tried to update missing port "${action.portId}".`,
        )
      }
    } else if (action.type === "update_connection") {
      let updated = false
      nextSystemJson = nextSystemJson.map((item) => {
        if (
          item.type !== "system_connection" ||
          item.system_connection_id !== action.connectionId
        ) {
          return item
        }
        updated = true
        return { ...item, ...action.patch }
      })
      if (!updated) {
        throw new Error(
          `AI action tried to update missing connection "${action.connectionId}".`,
        )
      }
    }
  }

  const parsedSystemJson = SystemJsonArray.parse(nextSystemJson)
  assertValidReferences(parsedSystemJson)
  return updateConnectionPaths(
    coalesceBusConnections(
      normalizeConnectionInterfaceLabels(parsedSystemJson),
    ),
  )
}
