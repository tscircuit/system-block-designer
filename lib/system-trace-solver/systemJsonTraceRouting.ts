import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemPort,
} from "../system-json/system-json"
import { solveSystemTraceLines, SystemTraceSolver } from "./SystemTraceSolver"
import type {
  SolvedSystemTraceLines,
  SystemTraceRouteEndpoint,
  SystemTraceSolverInput,
  SystemTraceSolverOptions,
} from "./types"

export const SYSTEM_TRACE_PORT_DIRECTIONS: Record<
  SystemPort["side_of_block"],
  Point
> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
}

export interface SystemJsonTraceSolverParams {
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
  options?: SystemTraceSolverOptions
}

export function createSystemTraceSolverInput({
  blocks,
  ports,
  connections,
  options,
}: SystemJsonTraceSolverParams): SystemTraceSolverInput {
  const blockMap = new Map(
    blocks.map((block) => [block.system_block_id, block]),
  )
  const portMap = new Map(ports.map((port) => [port.system_port_id, port]))

  return {
    obstacles: blocks.map((block) => ({
      id: block.system_block_id,
      label: block.label,
      center: block.center,
      width: block.size.width,
      height: block.size.height,
    })),
    routes: connections.flatMap((connection): SystemTraceRouteEndpoint[] => {
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

      if (!sourcePort || !targetPort || !sourceBlock || !targetBlock) return []

      return [
        {
          connectionId: connection.system_connection_id,
          label: connection.label,
          source: {
            portId: sourcePort.system_port_id,
            blockId: sourceBlock.system_block_id,
            point: getSystemTracePortPosition(sourceBlock, sourcePort, ports),
            direction: SYSTEM_TRACE_PORT_DIRECTIONS[sourcePort.side_of_block],
          },
          target: {
            portId: targetPort.system_port_id,
            blockId: targetBlock.system_block_id,
            point: getSystemTracePortPosition(targetBlock, targetPort, ports),
            direction: SYSTEM_TRACE_PORT_DIRECTIONS[targetPort.side_of_block],
          },
        },
      ]
    }),
    options,
  }
}

export function solveSystemJsonTraceLines(
  params: SystemJsonTraceSolverParams,
): SolvedSystemTraceLines {
  return solveSystemTraceLines(createSystemTraceSolverInput(params))
}

export function createSystemJsonTraceSolver(
  params: SystemJsonTraceSolverParams,
) {
  return new SystemTraceSolver(createSystemTraceSolverInput(params))
}

export function getSystemTracePortPosition(
  block: SystemBlock,
  port: SystemPort,
  ports: SystemPort[],
) {
  const x = block.center.x - block.size.width / 2
  const y = block.center.y - block.size.height / 2
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
    return { x, y: y + (block.size.height * (index + 1)) / (count + 1) }
  }
  if (port.side_of_block === "right") {
    return {
      x: x + block.size.width,
      y: y + (block.size.height * (index + 1)) / (count + 1),
    }
  }
  if (port.side_of_block === "top") {
    return { x: x + (block.size.width * (index + 1)) / (count + 1), y }
  }
  return {
    x: x + (block.size.width * (index + 1)) / (count + 1),
    y: y + block.size.height,
  }
}
