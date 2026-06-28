import type {
  SystemBlock,
  SystemPort,
} from "../../../lib/system-json/system-json"
import type { NormalizedSystemJson } from "../systemJsonCanvas"

export function getConnectedBlockIds(
  normalized: NormalizedSystemJson,
  portMap: Map<string, SystemPort>,
) {
  const connected = new Set<string>()
  for (const connection of normalized.connections) {
    const sourcePort = connection.source_system_port_id
      ? portMap.get(connection.source_system_port_id)
      : undefined
    const targetPort = connection.target_system_port_id
      ? portMap.get(connection.target_system_port_id)
      : undefined
    if (sourcePort) connected.add(sourcePort.system_block_id)
    if (targetPort) connected.add(targetPort.system_block_id)
  }
  return connected
}

export function countDisconnectedBlocks(
  blocks: SystemBlock[],
  connected: Set<string>,
) {
  return blocks.filter((block) => !connected.has(block.system_block_id)).length
}

export function countMissingSupplyConnections(
  normalized: NormalizedSystemJson,
) {
  let count = 0
  for (const block of normalized.blocks) {
    const supplyPorts = normalized.ports.filter(
      (port) =>
        port.system_block_id === block.system_block_id &&
        port.side_of_block === "bottom" &&
        port.label === "SUPPLY",
    )
    for (const port of supplyPorts) {
      const hasSupply = normalized.connections.some(
        (connection) =>
          connection.source_system_port_id === port.system_port_id ||
          connection.target_system_port_id === port.system_port_id,
      )
      if (!hasSupply) count += 1
    }
  }
  return count
}
