import { DIR, portPos } from "../design-system/geometry"
import { LIBRARY } from "../design-system/library"
import type {
  DesignBlock,
  DesignDocument,
  DesignWire,
  PortRef,
  Side,
} from "../design-system/types"
import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemDiagram,
  SystemJson,
  SystemPort,
} from "../system-json/system-json"
import { SystemJsonArray } from "../system-json/system-json"

export interface SystemBlockToSystemJsonOptions {
  system_diagram_id?: string
  name?: string
  description?: string
  width?: number
  height?: number
}

const SIDE_TO_SYSTEM_SIDE: Record<Side, SystemPort["side_of_block"]> = {
  L: "left",
  R: "right",
  T: "top",
  B: "bottom",
}

const TYPE_TO_CATEGORIES = new Map(
  LIBRARY.flatMap((category) =>
    category.items.map((item) => [item.type, [category.name, item.type]]),
  ),
)

export function SystemBlockToSystemJson(
  doc: DesignDocument,
  options: SystemBlockToSystemJsonOptions = {},
): SystemJson[] {
  const system_diagram_id = options.system_diagram_id ?? "system_diagram_1"
  const diagram = createSystemDiagram(system_diagram_id, options)
  const blocks = doc.blocks.map((block) =>
    createSystemBlock(block, system_diagram_id),
  )
  const ports = doc.blocks.flatMap((block) =>
    createSystemPorts(block, system_diagram_id),
  )
  const blockMap = new Map(doc.blocks.map((block) => [block.id, block]))
  const connections = doc.wires.flatMap((wire) => {
    const connection = createSystemConnection(wire, blockMap, system_diagram_id)
    return connection ? [connection] : []
  })

  return SystemJsonArray.parse([diagram, ...blocks, ...ports, ...connections])
}

function createSystemDiagram(
  system_diagram_id: string,
  options: SystemBlockToSystemJsonOptions,
): SystemDiagram {
  const diagram: SystemDiagram = {
    type: "system_diagram",
    system_diagram_id,
  }

  if (options.name !== undefined) diagram.name = options.name
  if (options.description !== undefined)
    diagram.description = options.description
  if (options.width !== undefined) diagram.width = options.width
  if (options.height !== undefined) diagram.height = options.height

  return diagram
}

function createSystemBlock(
  block: DesignBlock,
  system_diagram_id: string,
): SystemBlock {
  return {
    type: "system_block",
    system_diagram_id,
    system_block_id: block.id,
    center: {
      x: block.x + block.w / 2,
      y: block.y + block.h / 2,
    },
    size: {
      width: block.w,
      height: block.h,
    },
    label: block.type,
    category: TYPE_TO_CATEGORIES.get(block.type) ?? [block.type],
    icon: block.icon,
  }
}

function createSystemPorts(
  block: DesignBlock,
  system_diagram_id: string,
): SystemPort[] {
  return (Object.keys(block.ports) as Side[]).flatMap((side) =>
    block.ports[side].map((label, idx) => ({
      type: "system_port",
      system_diagram_id,
      system_port_id: getSystemPortId({ blockId: block.id, side, idx }),
      system_block_id: block.id,
      label,
      side_of_block: SIDE_TO_SYSTEM_SIDE[side],
    })),
  )
}

function createSystemConnection(
  wire: DesignWire,
  blockMap: Map<string, DesignBlock>,
  system_diagram_id: string,
): SystemConnection | null {
  const sourceBlock = blockMap.get(wire.from.blockId)
  const targetBlock = blockMap.get(wire.to.blockId)
  if (!sourceBlock || !targetBlock) return null

  const sourcePortId = getSystemPortId(wire.from)
  const targetPortId = getSystemPortId(wire.to)

  return {
    type: "system_connection",
    system_diagram_id,
    system_connection_id: wire.id,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: routeSystemConnectionPath(
      sourceBlock,
      wire.from,
      targetBlock,
      wire.to,
    ),
    label: wire.label,
  }
}

function getSystemPortId(port: PortRef) {
  return `${port.blockId}_${port.side.toLowerCase()}_${port.idx}`
}

function routeSystemConnectionPath(
  sourceBlock: DesignBlock,
  sourcePort: PortRef,
  targetBlock: DesignBlock,
  targetPort: PortRef,
): Point[] {
  const source = portPos(sourceBlock, sourcePort.side, sourcePort.idx)
  const target = portPos(targetBlock, targetPort.side, targetPort.idx)
  const sourceDir = DIR[sourcePort.side]
  const targetDir = DIR[targetPort.side]
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
  return removeDuplicatePoints(path)
}

function removeDuplicatePoints(points: Point[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1]
    return !previous || previous.x !== point.x || previous.y !== point.y
  })
}

export default SystemBlockToSystemJson
