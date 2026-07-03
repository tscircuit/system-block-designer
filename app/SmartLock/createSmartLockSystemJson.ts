import { LIBRARY } from "../../lib/system-block-library/library"
import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../../lib/system-json/system-json"

type SystemSide = SystemPort["side_of_block"]

const SIDE_DIR: Record<SystemSide, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
}

const TYPE_TO_CATEGORIES = new Map(
  LIBRARY.flatMap((category) =>
    category.items.map((item) => [item.type, [category.name, item.type]]),
  ),
)

export function createSmartLockSystemJson(): SystemJson[] {
  const system_diagram_id = "system_diagram_0"
  const blocks = [
    systemBlock(system_diagram_id, "b_1", "Radio Transceiver", 60, 60),
    systemBlock(system_diagram_id, "b_2", "Level Shifter", 560, 30),
    systemBlock(system_diagram_id, "b_3", "BLE Module", 940, 150, 176, 140),
    systemBlock(system_diagram_id, "b_4", "Flash", 1330, 150),
    systemBlock(system_diagram_id, "b_5", "NFC", 60, 330),
    systemBlock(system_diagram_id, "b_6", "Signal Level Shift", 560, 320),
    systemBlock(system_diagram_id, "b_7", "Authenticators", 320, 470),
    systemBlock(system_diagram_id, "b_8", "PMIC", 940, 690),
  ]

  const ports = [
    ...systemPorts(system_diagram_id, "b_1", {
      right: ["SPI", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_2", {
      left: ["GPIO", "GPIO"],
      right: ["SPI", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_3", {
      left: ["GPIO", "GPIO", "GPIO"],
      right: ["SPI", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_4", {
      left: ["SPI", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_5", {
      left: ["I2C"],
      right: ["GPIO", "GPIO", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_6", {
      left: ["GPIO", "GPIO"],
      right: ["SPI", "GPIO"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_7", {
      left: ["I2C"],
      right: ["I2C"],
      bottom: ["SUPPLY"],
    }),
    ...systemPorts(system_diagram_id, "b_8", {
      left: ["EN"],
      right: ["SUPPLY"],
    }),
  ]
  const blockMap = new Map(
    blocks.map((block) => [block.system_block_id, block]),
  )
  const portMap = new Map(ports.map((port) => [port.system_port_id, port]))
  const connection = (
    id: string,
    source: string,
    target: string,
    label: string,
  ) =>
    systemConnection(
      system_diagram_id,
      id,
      source,
      target,
      label,
      blockMap,
      portMap,
    )

  return [
    {
      type: "system_diagram",
      system_diagram_id,
      name: "Smart Lock (UWB Smart Lock)",
    },
    ...blocks,
    ...ports,
    connection("w_9", "b_1_right_0", "b_2_left_0", "SPI"),
    connection("w_10", "b_1_right_1", "b_2_left_1", "GPIO"),
    connection("w_11", "b_2_right_0", "b_3_left_0", "SPI"),
    connection("w_12", "b_2_right_1", "b_3_left_1", "GPIO"),
    connection("w_13", "b_3_right_0", "b_4_left_0", "SPI"),
    connection("w_14", "b_3_right_1", "b_4_left_1", "GPIO"),
    connection("w_15", "b_5_right_0", "b_6_left_0", "GPIO"),
    connection("w_16", "b_5_right_1", "b_6_left_1", "GPIO"),
    connection("w_17", "b_6_right_0", "b_3_left_2", "GPIO"),
    connection("w_18", "b_5_left_0", "b_7_left_0", "I2C"),
    connection("w_19", "b_7_right_0", "b_8_left_0", "I2C"),
    connection("w_20", "b_8_right_0", "b_3_bottom_0", "SUPPLY"),
  ]
}

function systemBlock(
  system_diagram_id: string,
  system_block_id: string,
  label: string,
  x: number,
  y: number,
  width = 128,
  height = 104,
): SystemBlock {
  const item = LIBRARY.flatMap((category) => category.items).find(
    (candidate) => candidate.type === label,
  )

  return {
    type: "system_block",
    system_diagram_id,
    system_block_id,
    center: {
      x: x + width / 2,
      y: y + height / 2,
    },
    size: { width, height },
    label,
    category: TYPE_TO_CATEGORIES.get(label) ?? [label],
    icon: item?.icon ?? "chip",
  }
}

function systemPorts(
  system_diagram_id: string,
  system_block_id: string,
  portsBySide: Partial<Record<SystemSide, string[]>>,
): SystemPort[] {
  return (["left", "right", "top", "bottom"] as const).flatMap((side) =>
    (portsBySide[side] ?? []).map((label, index) => ({
      type: "system_port",
      system_diagram_id,
      system_port_id: `${system_block_id}_${side}_${index}`,
      system_block_id,
      label,
      side_of_block: side,
    })),
  )
}

function systemConnection(
  system_diagram_id: string,
  system_connection_id: string,
  source_system_port_id: string,
  target_system_port_id: string,
  label: string,
  blockMap: Map<string, SystemBlock>,
  portMap: Map<string, SystemPort>,
): SystemConnection {
  const sourcePort = portMap.get(source_system_port_id)
  const targetPort = portMap.get(target_system_port_id)
  const sourceBlock = sourcePort
    ? blockMap.get(sourcePort.system_block_id)
    : undefined
  const targetBlock = targetPort
    ? blockMap.get(targetPort.system_block_id)
    : undefined

  if (!sourcePort || !targetPort || !sourceBlock || !targetBlock) {
    throw new Error(`Invalid smart lock connection ${system_connection_id}`)
  }

  return {
    type: "system_connection",
    system_diagram_id,
    system_connection_id,
    source_system_port_id,
    target_system_port_id,
    system_port_ids: [source_system_port_id, target_system_port_id],
    path: routeSystemPath(sourceBlock, sourcePort, targetBlock, targetPort, [
      ...portMap.values(),
    ]),
    label,
  }
}

function routeSystemPath(
  sourceBlock: SystemBlock,
  sourcePort: SystemPort,
  targetBlock: SystemBlock,
  targetPort: SystemPort,
  ports: SystemPort[],
) {
  const source = systemPortPosition(sourceBlock, sourcePort, ports)
  const target = systemPortPosition(targetBlock, targetPort, ports)
  const sourceDir = SIDE_DIR[sourcePort.side_of_block]
  const targetDir = SIDE_DIR[targetPort.side_of_block]
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

function systemPortPosition(
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
