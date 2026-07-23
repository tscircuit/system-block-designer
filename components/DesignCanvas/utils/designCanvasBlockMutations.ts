import {
  SubcircuitDefinitions,
  SystemBlockClasses,
  type SystemBlockName,
} from "../../../lib/system-blocks/SubcircuitRegistry"
import type {
  SystemBlock,
  SystemJson,
  SystemPort,
} from "../../../lib/system-json/system-json"
import { normalizeSystemJson } from "../systemJsonCanvas"

const DEFINITION_BY_COMPONENT_NAME = new Map(
  Object.values(SubcircuitDefinitions).map((definition) => [
    definition.componentName,
    definition,
  ]),
)

export function removeBlockFromSystemJson(
  systemJson: SystemJson[],
  blockId: string,
) {
  const current = normalizeSystemJson(systemJson)
  const selectedPortIds = new Set(
    current.ports
      .filter((port) => port.system_block_id === blockId)
      .map((port) => port.system_port_id),
  )

  return systemJson.filter((item) => {
    if (item.type === "system_block" && item.system_block_id === blockId) {
      return false
    }
    if (item.type === "system_port" && item.system_block_id === blockId) {
      return false
    }
    if (item.type === "system_connection") {
      const connectedPortIds = [
        item.source_system_port_id,
        item.target_system_port_id,
        ...(item.system_port_ids ?? []),
      ].filter((portId): portId is string => Boolean(portId))
      return !connectedPortIds.some((portId) => selectedPortIds.has(portId))
    }
    return true
  })
}

export function replaceBlockSubcircuitInSystemJson(
  systemJson: SystemJson[],
  blockId: string,
  subcircuitId: string,
) {
  const definition = DEFINITION_BY_COMPONENT_NAME.get(subcircuitId)
  if (!definition || !(subcircuitId in SystemBlockClasses)) return null

  const current = normalizeSystemJson(systemJson)
  const block = current.blocks.find(
    (candidate) => candidate.system_block_id === blockId,
  )
  if (!block) return null

  const BlockClass = SystemBlockClasses[subcircuitId as SystemBlockName]
  const replacementBlock = new BlockClass({
    systemDiagramId: block.system_diagram_id,
    systemBlockId: block.system_block_id,
    center: block.center,
    size: block.size,
    tsxInstanceName: block.system_block_id,
    subcircuitId,
  })
    .getSystemBlockJson()
    .find((item): item is SystemBlock => item.type === "system_block")

  if (!replacementBlock) return null

  const nextBlock: SystemBlock = {
    ...replacementBlock,
    center: block.center,
    size: block.size,
    ...(block.icon_color ? { icon_color: block.icon_color } : {}),
  }

  return systemJson.map((item) =>
    item.type === "system_block" && item.system_block_id === blockId
      ? nextBlock
      : item,
  )
}

export function duplicateBlockInSystemJson(
  systemJson: SystemJson[],
  block: SystemBlock,
  newBlockId: string,
) {
  const current = normalizeSystemJson(systemJson)
  const duplicate: SystemBlock = {
    ...block,
    system_block_id: newBlockId,
    center: {
      x: block.center.x + 36,
      y: block.center.y + 36,
    },
  }
  const sideCounts: Record<SystemPort["side_of_block"], number> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
  const duplicatePorts: SystemPort[] = current.ports
    .filter((port) => port.system_block_id === block.system_block_id)
    .map((port) => {
      const index = sideCounts[port.side_of_block]++
      return {
        ...port,
        system_block_id: newBlockId,
        system_port_id: `${newBlockId}_${port.side_of_block}_${index}`,
      }
    })

  return [...systemJson, duplicate, ...duplicatePorts]
}
