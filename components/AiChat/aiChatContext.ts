import type {
  AiChatDesignContext,
  CreateAiChatDesignContextParams,
} from "./aiChatTypes"
import { LIBRARY } from "../../lib/system-block-library/library"

const AI_DESIGN_LIBRARY = LIBRARY.flatMap((category) =>
  category.items
    .filter((item) => item.count > 0)
    .map((item) => ({
      type: item.type,
      category: [...(item.category ?? [category.name])],
      icon: item.icon,
      count: item.count,
      subcircuitId: item.subcircuitId ?? null,
      defaultSize: {
        width: item.w ?? null,
        height: item.h ?? null,
      },
    })),
)

export function createAiChatDesignContext({
  projectTitle,
  activeTab,
  systemJson,
  blocks,
  ports,
  connections,
  warnings,
  errors,
  selection,
}: CreateAiChatDesignContextParams): AiChatDesignContext {
  const portsByBlockId = new Map<string, string[]>()
  for (const port of ports) {
    const current = portsByBlockId.get(port.system_block_id) ?? []
    current.push(port.system_port_id)
    portsByBlockId.set(port.system_block_id, current)
  }

  const portToBlockId = new Map(
    ports.map((port) => [port.system_port_id, port.system_block_id]),
  )

  const connectionsByBlockId = new Map<string, string[]>()
  for (const connection of connections) {
    const blockIds = new Set(
      (
        connection.system_port_ids ?? [
          connection.source_system_port_id,
          connection.target_system_port_id,
        ]
      )
        .filter((portId): portId is string => Boolean(portId))
        .map((portId) => portToBlockId.get(portId))
        .filter((blockId): blockId is string => Boolean(blockId)),
    )

    for (const blockId of blockIds) {
      const current = connectionsByBlockId.get(blockId) ?? []
      current.push(connection.system_connection_id)
      connectionsByBlockId.set(blockId, current)
    }
  }

  return {
    schemaVersion: "system-block-designer.ai-chat.v1",
    project: {
      title: projectTitle,
      activeTab,
    },
    designLibrary: AI_DESIGN_LIBRARY,
    design: {
      systemJson,
    },
    summary: {
      blockCount: blocks.length,
      portCount: ports.length,
      connectionCount: connections.length,
      warningCount: warnings,
      errorCount: errors,
      selected: selection,
      blocks: blocks.map((block) => ({
        id: block.system_block_id,
        label: block.label ?? null,
        category: block.category,
        partNumber: block.part_number ?? null,
        subcircuitId: block.subcircuit_id ?? null,
        portIds: portsByBlockId.get(block.system_block_id) ?? [],
        connectionIds: connectionsByBlockId.get(block.system_block_id) ?? [],
      })),
      connections: connections.map((connection) => {
        const sourcePortId = connection.source_system_port_id ?? null
        const targetPortId = connection.target_system_port_id ?? null

        return {
          id: connection.system_connection_id,
          label: connection.label ?? null,
          sourcePortId,
          targetPortId,
          sourceBlockId: sourcePortId
            ? (portToBlockId.get(sourcePortId) ?? null)
            : null,
          targetBlockId: targetPortId
            ? (portToBlockId.get(targetPortId) ?? null)
            : null,
        }
      }),
    },
  }
}
