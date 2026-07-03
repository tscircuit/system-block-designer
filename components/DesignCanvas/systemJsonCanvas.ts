import { pathPointsToSvgPath } from "../../lib/design-system/pathPointsToSvgPath"
import { findLibraryItem } from "../../lib/design-system/library"
import { midpointOfLongestSegment } from "../../lib/system-trace-solver/geometry"
import { solveSystemJsonTraceLines } from "../../lib/system-trace-solver"
import {
  TiSystemBlockClasses,
  type TiSystemBlockName,
} from "../../lib/system-blocks/TiSubcircuits"
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

export const CONNECTION_INTERFACES = ["gpio", "supply", "spi", "i2c"] as const
export type ConnectionInterface = (typeof CONNECTION_INTERFACES)[number]

export function inferConnectionInterface(
  label: string | undefined,
): ConnectionInterface {
  const normalized = label?.trim().toLowerCase() ?? ""
  if (CONNECTION_INTERFACES.includes(normalized as ConnectionInterface)) {
    return normalized as ConnectionInterface
  }
  if (
    ["vcc", "vdd", "vin", "vout", "gnd", "ground", "power", "supply"].includes(
      normalized,
    )
  ) {
    return "supply"
  }
  if (["scl", "sda", "i2c"].includes(normalized)) return "i2c"
  if (["sclk", "miso", "mosi", "cs", "spi"].includes(normalized)) return "spi"
  return "gpio"
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
  const points = routeSystemPathPoints(
    sourceBlock,
    sourcePort,
    targetBlock,
    targetPort,
    ports,
  )

  return {
    d: pathPointsToSvgPath(points),
    mid: midpointOfLongestSegment(points),
  }
}

export function createSystemJsonForLibraryBlock({
  system_diagram_id,
  blockId,
  type,
  center,
}: {
  system_diagram_id: string
  blockId: string
  type: string
  center: Point
}): SystemJson[] | null {
  const item = findLibraryItem(type)
  if (!item || item.count === 0) return null

  if (item.subcircuitId && item.subcircuitId in TiSystemBlockClasses) {
    const BlockClass =
      TiSystemBlockClasses[item.subcircuitId as TiSystemBlockName]
    const block = new BlockClass({
      systemDiagramId: system_diagram_id,
      systemBlockId: blockId,
      center,
      size: item.w && item.h ? { width: item.w, height: item.h } : undefined,
      tsxInstanceName: blockId,
      subcircuitId: item.subcircuitId,
    })
    return block.getSystemBlockJson()
  }

  const width = item.w ?? 128
  const height = item.h ?? 104
  const block: SystemBlock = {
    type: "system_block",
    system_diagram_id,
    system_block_id: blockId,
    center,
    size: { width, height },
    label: type,
    category: item.category ?? [type],
    icon: item.icon ?? "chip",
  }

  return [block]
}

export function updateConnectionPaths(systemJson: SystemJson[]) {
  const normalized = normalizeSystemJson(systemJson)
  const solvedTraceLines = solveSystemJsonTraceLines({
    blocks: normalized.blocks,
    ports: normalized.ports,
    connections: normalized.connections,
  }).linesByConnectionId

  return systemJson.map((item) => {
    if (item.type !== "system_connection") return item
    const solvedLine = solvedTraceLines[item.system_connection_id]
    if (!solvedLine) return item
    return {
      ...item,
      path: solvedLine.points,
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
  return createConnectionPathPoints(
    source,
    SYSTEM_DIR[sourcePort.side_of_block],
    target,
    SYSTEM_DIR[targetPort.side_of_block],
  )
}

export function routeTemporaryConnectionPath(
  source: Point,
  sourceDirection: Point,
  target: Point,
) {
  return pathPointsToSvgPath(
    createConnectionPathPoints(source, sourceDirection, target, {
      x: -sourceDirection.x || 1,
      y: 0,
    }),
  )
}

function createConnectionPathPoints(
  source: Point,
  sourceDir: Point,
  target: Point,
  targetDir: Point,
) {
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
