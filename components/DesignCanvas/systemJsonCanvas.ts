import {
  pathPointsToSvgPath,
  routePath,
} from "../../lib/design-system/geometry"
import { defaultPorts } from "../../lib/design-system/library"
import type { Side } from "../../lib/design-system/types"
import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../../lib/system-json/system-json"

export const SYSTEM_DIR: Record<SystemPort["side_of_block"], Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
}

const SIDE_TO_SYSTEM_SIDE: Record<Side, SystemPort["side_of_block"]> = {
  L: "left",
  R: "right",
  T: "top",
  B: "bottom",
}

export interface NormalizedSystemJson {
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
}

export function createEmptySystemJson(): SystemJson[] {
  return [
    {
      type: "system_diagram",
      system_diagram_id: "system_diagram_0",
      name: "Untitled System",
    },
  ]
}

export function normalizeSystemJson(
  systemJson: SystemJson[],
): NormalizedSystemJson {
  return {
    blocks: systemJson.filter(
      (item): item is SystemBlock => item.type === "system_block",
    ),
    ports: systemJson.filter(
      (item): item is SystemPort => item.type === "system_port",
    ),
    connections: systemJson.filter(
      (item): item is SystemConnection => item.type === "system_connection",
    ),
  }
}

export function getNextUid(systemJson: SystemJson[]) {
  const maxId = systemJson.reduce((max, item) => {
    const ids =
      item.type === "system_block"
        ? [item.system_block_id]
        : item.type === "system_port"
          ? [item.system_port_id]
          : item.type === "system_connection"
            ? [item.system_connection_id]
            : [item.system_diagram_id]

    return ids.reduce((innerMax, id) => {
      const match = id.match(/_(\d+)$/)
      return match ? Math.max(innerMax, Number(match[1])) : innerMax
    }, max)
  }, 0)

  return maxId + 1
}

export function getBlockTopLeft(block: SystemBlock) {
  return {
    x: block.center.x - block.size.width / 2,
    y: block.center.y - block.size.height / 2,
  }
}

export function getSystemPortPosition(
  block: SystemBlock,
  port: SystemPort,
  ports: SystemPort[],
) {
  const topLeft = getBlockTopLeft(block)
  const sidePorts = ports.filter(
    (candidate) =>
      candidate.system_block_id === block.system_block_id &&
      candidate.side_of_block === port.side_of_block,
  )
  const count = Math.max(sidePorts.length, 1)
  const index = Math.max(
    sidePorts.findIndex(
      (candidate) => candidate.system_port_id === port.system_port_id,
    ),
    0,
  )

  if (port.side_of_block === "left") {
    return {
      x: topLeft.x,
      y: topLeft.y + (block.size.height * (index + 1)) / (count + 1),
    }
  }
  if (port.side_of_block === "right") {
    return {
      x: topLeft.x + block.size.width,
      y: topLeft.y + (block.size.height * (index + 1)) / (count + 1),
    }
  }
  if (port.side_of_block === "top") {
    return {
      x: topLeft.x + (block.size.width * (index + 1)) / (count + 1),
      y: topLeft.y,
    }
  }
  return {
    x: topLeft.x + (block.size.width * (index + 1)) / (count + 1),
    y: topLeft.y + block.size.height,
  }
}

export function routeSystemConnection(
  sourceBlock: SystemBlock,
  sourcePort: SystemPort,
  targetBlock: SystemBlock,
  targetPort: SystemPort,
  ports: SystemPort[],
) {
  const source = getSystemPortPosition(sourceBlock, sourcePort, ports)
  const target = getSystemPortPosition(targetBlock, targetPort, ports)
  return routePath(
    source,
    SYSTEM_DIR[sourcePort.side_of_block],
    target,
    SYSTEM_DIR[targetPort.side_of_block],
  )
}

export function getSystemPortId(
  blockId: string,
  side: SystemPort["side_of_block"],
  index: number,
) {
  return `${blockId}_${side}_${index}`
}

export function createSystemPortsForBlock(
  system_diagram_id: string,
  blockId: string,
  type: string,
) {
  const defaultBlockPorts = defaultPorts(type)

  return (Object.keys(defaultBlockPorts) as Side[]).flatMap((side) => {
    const systemSide = SIDE_TO_SYSTEM_SIDE[side]
    return defaultBlockPorts[side].map(
      (label, index): SystemPort => ({
        type: "system_port",
        system_diagram_id,
        system_port_id: getSystemPortId(blockId, systemSide, index),
        system_block_id: blockId,
        label,
        side_of_block: systemSide,
      }),
    )
  })
}

export function updateConnectionPaths(systemJson: SystemJson[]) {
  const normalized = normalizeSystemJson(systemJson)
  const blockMap = new Map(
    normalized.blocks.map((block) => [block.system_block_id, block]),
  )
  const portMap = new Map(
    normalized.ports.map((port) => [port.system_port_id, port]),
  )

  return systemJson.map((item) => {
    if (item.type !== "system_connection") return item
    const sourcePort = item.source_system_port_id
      ? portMap.get(item.source_system_port_id)
      : undefined
    const targetPort = item.target_system_port_id
      ? portMap.get(item.target_system_port_id)
      : undefined
    const sourceBlock = sourcePort
      ? blockMap.get(sourcePort.system_block_id)
      : undefined
    const targetBlock = targetPort
      ? blockMap.get(targetPort.system_block_id)
      : undefined

    if (!sourcePort || !targetPort || !sourceBlock || !targetBlock) {
      return item
    }

    return {
      ...item,
      path: routeSystemConnection(
        sourceBlock,
        sourcePort,
        targetBlock,
        targetPort,
        normalized.ports,
      ).d
        ? routeSystemPathPoints(
            sourceBlock,
            sourcePort,
            targetBlock,
            targetPort,
            normalized.ports,
          )
        : item.path,
    }
  })
}

export function routeSystemPathPoints(
  sourceBlock: SystemBlock,
  sourcePort: SystemPort,
  targetBlock: SystemBlock,
  targetPort: SystemPort,
  ports: SystemPort[],
) {
  const source = getSystemPortPosition(sourceBlock, sourcePort, ports)
  const target = getSystemPortPosition(targetBlock, targetPort, ports)
  const sourceDir = SYSTEM_DIR[sourcePort.side_of_block]
  const targetDir = SYSTEM_DIR[targetPort.side_of_block]
  const step = 24
  const sourceLead = {
    x: source.x + sourceDir.x * step,
    y: source.y + sourceDir.y * step,
  }
  const targetLead = {
    x: target.x + targetDir.x * step,
    y: target.y + targetDir.y * step,
  }
  const sourceHorizontal = sourceDir.x !== 0
  const targetHorizontal = targetDir.x !== 0
  const path = [source, sourceLead]

  if (sourceHorizontal && targetHorizontal) {
    const midX = (sourceLead.x + targetLead.x) / 2
    path.push({ x: midX, y: sourceLead.y }, { x: midX, y: targetLead.y })
  } else if (!sourceHorizontal && !targetHorizontal) {
    const midY = (sourceLead.y + targetLead.y) / 2
    path.push({ x: sourceLead.x, y: midY }, { x: targetLead.x, y: midY })
  } else if (sourceHorizontal && !targetHorizontal) {
    path.push({ x: targetLead.x, y: sourceLead.y })
  } else {
    path.push({ x: sourceLead.x, y: targetLead.y })
  }

  path.push(targetLead, target)
  return path.filter((point, index) => {
    const previous = path[index - 1]
    return !previous || previous.x !== point.x || previous.y !== point.y
  })
}

export function systemConnectionToSvgPath(
  connection: SystemConnection,
  blockMap: Map<string, SystemBlock>,
  portMap: Map<string, SystemPort>,
  ports: SystemPort[],
) {
  const sourcePort = connection.source_system_port_id
    ? portMap.get(connection.source_system_port_id)
    : undefined
  const targetPort = connection.target_system_port_id
    ? portMap.get(connection.target_system_port_id)
    : undefined
  const sourceBlock = sourcePort
    ? blockMap.get(sourcePort.system_block_id)
    : undefined
  const targetBlock = targetPort
    ? blockMap.get(targetPort.system_block_id)
    : undefined

  if (!sourcePort || !targetPort || !sourceBlock || !targetBlock) {
    if (connection.path.length < 2) {
      return { d: "", mid: { x: 0, y: 0 } }
    }
    return { d: pathPointsToSvgPath(connection.path), mid: connection.path[0] }
  }

  return routeSystemConnection(
    sourceBlock,
    sourcePort,
    targetBlock,
    targetPort,
    ports,
  )
}
