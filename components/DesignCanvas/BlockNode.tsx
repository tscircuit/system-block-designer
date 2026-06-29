import { BlockIcon } from "../../lib/design-system/icons"
import type { SystemBlock, SystemPort } from "../../lib/system-json/system-json"
import { getSystemPortPosition } from "./systemJsonCanvas"

interface BlockNodeProps {
  block: SystemBlock
  blockNumber: number
  ports: SystemPort[]
  selected: boolean
  connected: boolean
}

export function BlockNode({
  block,
  blockNumber,
  ports,
  selected,
  connected,
}: BlockNodeProps) {
  const x = block.center.x - block.size.width / 2
  const y = block.center.y - block.size.height / 2
  const iconSize = Math.min(46, block.size.height * 0.4)
  const blockPorts = ports.filter(
    (port) => port.system_block_id === block.system_block_id,
  )
  const portAddControls: Array<{
    side: SystemPort["side_of_block"]
    x: number
    y: number
  }> = [
    { side: "top", x: block.size.width / 2, y: -26 },
    { side: "right", x: block.size.width + 26, y: block.size.height / 2 },
    { side: "bottom", x: block.size.width / 2, y: block.size.height + 26 },
    { side: "left", x: -26, y: block.size.height / 2 },
  ]

  return (
    <g
      className={`block${selected ? " sel" : ""}`}
      data-id={block.system_block_id}
      transform={`translate(${x},${y})`}
    >
      <rect
        className="block-rect"
        width={block.size.width}
        height={block.size.height}
        rx={14}
      />
      <rect className="numbadge" x={9} y={9} width={22} height={18} rx={5} />
      <text className="numbadge-t" x={20} y={22}>
        {blockNumber}
      </text>
      <circle
        className="status-dot"
        cx={block.size.width - 15}
        cy={18}
        r={7}
        fill={connected ? "var(--ok)" : "#cbd2db"}
      />
      {connected && (
        <path
          d={`M ${block.size.width - 18} 18 l 2 2 l 3.5 -4`}
          stroke="#fff"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <BlockIcon
        name={block.icon ?? "chip"}
        x={(block.size.width - iconSize) / 2}
        y={(block.size.height - iconSize) / 2 - 7}
        size={iconSize}
        style={{ color: "var(--ink)" }}
      />
      <text
        className="block-label"
        x={block.size.width / 2}
        y={block.size.height - 13}
      >
        {block.label ?? block.system_block_id}
      </text>
      {blockPorts.map((port) => {
        const position = getSystemPortPosition(block, port, ports)
        const localX = position.x - x
        const localY = position.y - y
        return (
          <g key={port.system_port_id}>
            <circle
              className="port-hit"
              cx={localX}
              cy={localY}
              r={11}
              data-port={port.system_port_id}
            />
            <circle
              className="port"
              cx={localX}
              cy={localY}
              r={4.5}
              data-port={port.system_port_id}
            />
          </g>
        )
      })}
      {selected &&
        portAddControls.map((control) => (
          <g
            key={control.side}
            className="port-add"
            data-add-port-side={control.side}
            data-block-id={block.system_block_id}
            transform={`translate(${control.x},${control.y})`}
          >
            <circle r={12} />
            <path d="M -6 0 H 6 M 0 -6 V 6" />
          </g>
        ))}
    </g>
  )
}
