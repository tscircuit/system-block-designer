import { midpointOfPath } from "../design-system/midpointOfPath"
import { pathPointsToSvgPath } from "../design-system/pathPointsToSvgPath"
import type {
  SystemBlock,
  SystemConnection,
  SystemDiagram,
  SystemJson,
  SystemPort,
} from "./system-json"

export type SystemJsonSnapshotInput = SystemJson[]

export interface SystemJsonToSvgSnapshotOptions {
  width?: number
  height?: number
  padding?: number
}

interface NormalizedSystemJson {
  diagram?: SystemDiagram
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
}

export function systemJsonToSvgSnapshot(
  input: SystemJsonSnapshotInput,
  options: SystemJsonToSvgSnapshotOptions = {},
) {
  const systemJson = normalizeSystemJson(input)
  const blockMap = new Map(
    systemJson.blocks.map((block) => [block.system_block_id, block]),
  )
  const portMap = new Map(
    systemJson.ports.map((port) => [port.system_port_id, port]),
  )
  const connectedBlockIds = new Set<string>()

  for (const connection of systemJson.connections) {
    const sourcePort = connection.source_system_port_id
      ? portMap.get(connection.source_system_port_id)
      : undefined
    const targetPort = connection.target_system_port_id
      ? portMap.get(connection.target_system_port_id)
      : undefined
    if (sourcePort) connectedBlockIds.add(sourcePort.system_block_id)
    if (targetPort) connectedBlockIds.add(targetPort.system_block_id)
  }

  const bounds = getBounds(systemJson, options.padding ?? 48)
  const width = options.width ?? systemJson.diagram?.width ?? bounds.width
  const height = options.height ?? systemJson.diagram?.height ?? bounds.height
  const translateX = -bounds.minX
  const translateY = -bounds.minY

  return [
    `<svg width="${round(width)}" height="${round(height)}" viewBox="0 0 ${round(width)} ${round(height)}" xmlns="http://www.w3.org/2000/svg">`,
    "<defs>",
    '<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">',
    '<circle cx="1.4" cy="1.4" r="1.4" fill="#e6eaef" />',
    "</pattern>",
    "</defs>",
    `<rect class="grid-bg" x="0" y="0" width="${round(width)}" height="${round(height)}" fill="url(#dots)" />`,
    `<g transform="translate(${round(translateX)},${round(translateY)})">`,
    ...systemJson.connections.map((connection) =>
      renderConnection(connection, portMap, blockMap),
    ),
    ...systemJson.blocks.map((block, index) =>
      renderBlock(
        block,
        index + 1,
        connectedBlockIds.has(block.system_block_id),
        systemJson.ports,
      ),
    ),
    "</g>",
    "</svg>",
  ].join("\n")
}

function normalizeSystemJson(
  input: SystemJsonSnapshotInput,
): NormalizedSystemJson {
  return {
    diagram: input.find(
      (item): item is SystemDiagram => item.type === "system_diagram",
    ),
    blocks: input.filter(
      (item): item is SystemBlock => item.type === "system_block",
    ),
    ports: input.filter(
      (item): item is SystemPort => item.type === "system_port",
    ),
    connections: input.filter(
      (item): item is SystemConnection => item.type === "system_connection",
    ),
  }
}

function renderConnection(
  connection: SystemConnection,
  portMap: Map<string, SystemPort>,
  blockMap: Map<string, SystemBlock>,
) {
  const ports = [...portMap.values()]
  const points = getConnectionPath(connection, portMap, blockMap, ports)
  if (points.length < 2) return ""

  const path = pathPointsToSvgPath(points)
  const mid = midpointOfPath(points)
  const label = connection.label ?? ""
  const labelWidth = label.length * 6.6 + 14

  return [
    `<g data-system-connection-id="${escapeAttribute(connection.system_connection_id)}">`,
    `<path class="wire" d="${path}" fill="none" stroke="#9aa4b0" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" />`,
    label
      ? [
          `<rect class="wlabel-bg" x="${round(mid.x - labelWidth / 2)}" y="${round(mid.y - 9)}" width="${round(labelWidth)}" height="18" rx="5" fill="#fff" stroke="#e3e8ee" stroke-width="1" />`,
          `<text class="wlabel-t" x="${round(mid.x)}" y="${round(mid.y + 0.5)}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="600" fill="#5a6573" text-anchor="middle" dominant-baseline="middle">${escapeText(label)}</text>`,
        ].join("\n")
      : "",
    "</g>",
  ].join("\n")
}

function renderBlock(
  block: SystemBlock,
  blockNumber: number,
  connected: boolean,
  ports: SystemPort[],
) {
  const x = block.center.x - block.size.width / 2
  const y = block.center.y - block.size.height / 2
  const blockPorts = ports.filter(
    (port) => port.system_block_id === block.system_block_id,
  )
  const iconSize = Math.min(46, block.size.height * 0.4)
  const iconX = (block.size.width - iconSize) / 2
  const iconY = (block.size.height - iconSize) / 2 - 7

  return [
    `<g class="block" data-system-block-id="${escapeAttribute(block.system_block_id)}" transform="translate(${round(x)},${round(y)})">`,
    `<rect class="block-rect" width="${round(block.size.width)}" height="${round(block.size.height)}" rx="14" fill="#fff" stroke="#2b3543" stroke-width="1.6" />`,
    '<rect class="numbadge" x="9" y="9" width="22" height="18" rx="5" fill="#f1f4f8" stroke="#cfd6df" stroke-width="1" />',
    `<text class="numbadge-t" x="20" y="22" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#5a6573" text-anchor="middle">${blockNumber}</text>`,
    `<circle class="status-dot" cx="${round(block.size.width - 15)}" cy="18" r="7" fill="${connected ? "#22c55e" : "#cbd2db"}" stroke="#fff" stroke-width="1.5" />`,
    connected
      ? `<path d="M ${round(block.size.width - 18)} 18 l 2 2 l 3.5 -4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
      : "",
    renderBlockIcon(block.icon, iconX, iconY, iconSize),
    `<text class="block-label" x="${round(block.size.width / 2)}" y="${round(block.size.height - 13)}" font-family="Inter, sans-serif" font-size="12.5" font-weight="600" fill="#1f2733" text-anchor="middle">${escapeText(block.label ?? block.system_block_id)}</text>`,
    ...blockPorts.map((port) => renderPort(port, block, blockPorts, x, y)),
    "</g>",
  ].join("\n")
}

function renderBlockIcon(
  icon: string | undefined,
  x: number,
  y: number,
  size: number,
) {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const iconName = icon ?? "chip"

  if (iconName.includes("battery")) {
    return [
      `<rect x="${round(x + size * 0.18)}" y="${round(y + size * 0.3)}" width="${round(size * 0.58)}" height="${round(size * 0.4)}" rx="3" fill="none" stroke="#1f2733" stroke-width="2" />`,
      `<rect x="${round(x + size * 0.76)}" y="${round(y + size * 0.42)}" width="${round(size * 0.08)}" height="${round(size * 0.16)}" rx="1" fill="#1f2733" />`,
    ].join("\n")
  }

  if (iconName.includes("power")) {
    return [
      `<circle cx="${round(centerX)}" cy="${round(centerY)}" r="${round(size * 0.28)}" fill="none" stroke="#1f2733" stroke-width="2" />`,
      `<path d="M ${round(centerX)} ${round(y + size * 0.18)} v ${round(size * 0.28)}" stroke="#1f2733" stroke-width="2.4" stroke-linecap="round" />`,
    ].join("\n")
  }

  if (iconName.includes("antenna") || iconName.includes("uwb")) {
    return [
      `<path d="M ${round(centerX)} ${round(y + size * 0.7)} V ${round(y + size * 0.38)}" stroke="#1f2733" stroke-width="2" stroke-linecap="round" />`,
      `<path d="M ${round(centerX - size * 0.18)} ${round(y + size * 0.35)} Q ${round(centerX)} ${round(y + size * 0.18)} ${round(centerX + size * 0.18)} ${round(y + size * 0.35)}" fill="none" stroke="#1f2733" stroke-width="2" stroke-linecap="round" />`,
      `<path d="M ${round(centerX - size * 0.3)} ${round(y + size * 0.25)} Q ${round(centerX)} ${round(y + size * 0.02)} ${round(centerX + size * 0.3)} ${round(y + size * 0.25)}" fill="none" stroke="#1f2733" stroke-width="1.8" stroke-linecap="round" />`,
    ].join("\n")
  }

  return [
    `<rect x="${round(x + size * 0.18)}" y="${round(y + size * 0.18)}" width="${round(size * 0.64)}" height="${round(size * 0.64)}" rx="5" fill="none" stroke="#1f2733" stroke-width="2" />`,
    `<path d="M ${round(x + size * 0.34)} ${round(centerY)} h ${round(size * 0.32)} M ${round(centerX)} ${round(y + size * 0.34)} v ${round(size * 0.32)}" stroke="#1f2733" stroke-width="1.8" stroke-linecap="round" />`,
  ].join("\n")
}

function renderPort(
  port: SystemPort,
  block: SystemBlock,
  blockPorts: SystemPort[],
  blockX: number,
  blockY: number,
) {
  const position = getPortPosition(port, block, blockPorts)
  return `<circle class="port" data-system-port-id="${escapeAttribute(port.system_port_id)}" cx="${round(position.x - blockX)}" cy="${round(position.y - blockY)}" r="4.5" fill="#fff" stroke="#cfd6df" stroke-width="1.6" />`
}

function getBounds(systemJson: NormalizedSystemJson, padding: number) {
  const points = [
    ...systemJson.blocks.flatMap((block) => {
      const x = block.center.x - block.size.width / 2
      const y = block.center.y - block.size.height / 2
      return [
        { x, y },
        { x: x + block.size.width, y: y + block.size.height },
      ]
    }),
    ...systemJson.connections.flatMap((connection) => connection.path),
  ]

  if (points.length === 0) {
    return { minX: 0, minY: 0, width: 640, height: 360 }
  }

  const minX = Math.min(...points.map((point) => point.x)) - padding
  const minY = Math.min(...points.map((point) => point.y)) - padding
  const maxX = Math.max(...points.map((point) => point.x)) + padding
  const maxY = Math.max(...points.map((point) => point.y)) + padding

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function getConnectionPath(
  connection: SystemConnection,
  portMap: Map<string, SystemPort>,
  blockMap: Map<string, SystemBlock>,
  ports: SystemPort[],
) {
  if (connection.path.length > 0) return connection.path

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

  const sourceBlockPorts = ports.filter(
    (port) => port.system_block_id === sourceBlock.system_block_id,
  )
  const targetBlockPorts = ports.filter(
    (port) => port.system_block_id === targetBlock.system_block_id,
  )

  return [
    getPortPosition(sourcePort, sourceBlock, sourceBlockPorts),
    getPortPosition(targetPort, targetBlock, targetBlockPorts),
  ]
}

function getPortPosition(
  port: SystemPort,
  block: SystemBlock,
  blockPorts: SystemPort[],
) {
  const x = block.center.x - block.size.width / 2
  const y = block.center.y - block.size.height / 2
  const sidePorts = blockPorts.filter(
    (candidate) => candidate.side_of_block === port.side_of_block,
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

function round(value: number) {
  return Number(value.toFixed(3))
}

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeAttribute(value: string) {
  return escapeText(value).replace(/"/g, "&quot;")
}
