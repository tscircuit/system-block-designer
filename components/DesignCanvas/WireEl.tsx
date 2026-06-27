import type {
  SystemBlock,
  SystemConnection,
  SystemPort,
} from "../../lib/system-json/system-json"
import { systemConnectionToSvgPath } from "./useDesignCanvasController"

interface WireElProps {
  connection: SystemConnection
  blocks: Map<string, SystemBlock>
  ports: SystemPort[]
  portMap: Map<string, SystemPort>
  selected: boolean
}

export function WireEl({
  connection,
  blocks,
  ports,
  portMap,
  selected,
}: WireElProps) {
  const { d, mid } = systemConnectionToSvgPath(
    connection,
    blocks,
    portMap,
    ports,
  )
  const label = connection.label ?? ""
  const labelWidth = label.length * 6.6 + 14

  return (
    <g>
      <path
        className="wire-hit"
        d={d}
        data-wid={connection.system_connection_id}
      />
      <path className={`wire${selected ? " sel" : ""}`} d={d} />
      {label && (
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
            {label}
          </text>
          <rect
            className="wlabel-hit"
            x={mid.x - labelWidth / 2}
            y={mid.y - 9}
            width={labelWidth}
            height={18}
            data-label-wid={connection.system_connection_id}
          />
        </>
      )}
    </g>
  )
}
