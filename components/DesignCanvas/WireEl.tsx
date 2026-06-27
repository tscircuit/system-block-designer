import { DIR, portPos, routePath } from "../../lib/design-system/geometry"
import type { DesignBlock, DesignWire } from "../../lib/design-system/types"

interface WireElProps {
  wire: DesignWire
  blocks: Map<string, DesignBlock>
  selected: boolean
}

export function WireEl({ wire, blocks, selected }: WireElProps) {
  const source = blocks.get(wire.from.blockId)
  const target = blocks.get(wire.to.blockId)
  if (!source || !target) return null

  const p1 = portPos(source, wire.from.side, wire.from.idx)
  const p2 = portPos(target, wire.to.side, wire.to.idx)
  const { d, mid } = routePath(p1, DIR[wire.from.side], p2, DIR[wire.to.side])
  const labelWidth = wire.label.length * 6.6 + 14

  return (
    <g>
      <path className="wire-hit" d={d} data-wid={wire.id} />
      <path className={`wire${selected ? " sel" : ""}`} d={d} />
      {wire.label && (
        <>
          <rect
            className="wlabel-bg"
            x={mid.x - labelWidth / 2}
            y={mid.y - 9}
            width={labelWidth}
            height={18}
            rx={5}
          />
          <text className="wlabel-t" x={mid.x} y={mid.y + 0.5}>
            {wire.label}
          </text>
          <rect
            className="wlabel-hit"
            x={mid.x - labelWidth / 2}
            y={mid.y - 9}
            width={labelWidth}
            height={18}
            data-label-wid={wire.id}
          />
        </>
      )}
    </g>
  )
}
