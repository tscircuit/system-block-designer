import { SIDES, portPos } from "../../lib/design-system/geometry"
import { BlockIcon } from "../../lib/design-system/icons"
import type { DesignBlock } from "../../lib/design-system/types"

interface BlockNodeProps {
  block: DesignBlock
  selected: boolean
  connected: boolean
}

export function BlockNode({ block, selected, connected }: BlockNodeProps) {
  const iconSize = Math.min(46, block.h * 0.4)

  return (
    <g
      className={`block${selected ? " sel" : ""}`}
      data-id={block.id}
      transform={`translate(${block.x},${block.y})`}
    >
      <rect className="block-rect" width={block.w} height={block.h} rx={14} />
      <rect className="numbadge" x={9} y={9} width={22} height={18} rx={5} />
      <text className="numbadge-t" x={20} y={22}>
        {block.num}
      </text>
      <circle
        className="status-dot"
        cx={block.w - 15}
        cy={18}
        r={7}
        fill={connected ? "var(--ok)" : "#cbd2db"}
      />
      {connected && (
        <path
          d={`M ${block.w - 18} 18 l 2 2 l 3.5 -4`}
          stroke="#fff"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <BlockIcon
        name={block.icon}
        x={(block.w - iconSize) / 2}
        y={(block.h - iconSize) / 2 - 7}
        size={iconSize}
        style={{ color: "var(--ink)" }}
      />
      <text className="block-label" x={block.w / 2} y={block.h - 13}>
        {block.type}
      </text>
      {SIDES.flatMap((side) =>
        block.ports[side].map((_, index) => {
          const position = portPos(block, side, index)
          const localX = position.x - block.x
          const localY = position.y - block.y
          const ref = JSON.stringify({ blockId: block.id, side, idx: index })
          return (
            <g key={`${side}-${index}`}>
              <circle
                className="port-hit"
                cx={localX}
                cy={localY}
                r={11}
                data-port={ref}
              />
              <circle
                className="port"
                cx={localX}
                cy={localY}
                r={4.5}
                data-port={ref}
              />
            </g>
          )
        }),
      )}
    </g>
  )
}
