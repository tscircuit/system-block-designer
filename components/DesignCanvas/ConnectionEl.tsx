import type {
  SystemBlock,
  SystemConnection,
  SystemPort,
} from "../../lib/system-json/system-json"
import {
  inferConnectionInterface,
  systemConnectionToSvgPath,
} from "./systemJsonCanvas"

interface ConnectionElProps {
  connection: SystemConnection
  blocks: Map<string, SystemBlock>
  ports: SystemPort[]
  portMap: Map<string, SystemPort>
  selected: boolean
}

export function ConnectionEl({
  connection,
  blocks,
  ports,
  portMap,
  selected,
}: ConnectionElProps) {
  const { d, mid } = systemConnectionToSvgPath(
    connection,
    blocks,
    portMap,
    ports,
  )
  const label = inferConnectionInterface(connection.label)
  const labelWidth = label.length * 6.6 + 14

  return (
    <g>
      <path
        className="connection-hit"
        d={d}
        data-connection-id={connection.system_connection_id}
      />
      <path className={`connection${selected ? " sel" : ""}`} d={d} />
      {label && (
        <>
          <rect
            className="connection-label-bg"
            x={mid.x - labelWidth / 2}
            y={mid.y - 9}
            width={labelWidth}
            height={18}
            rx={5}
          />
          <text className="connection-label-text" x={mid.x} y={mid.y + 0.5}>
            {label.toUpperCase()}
          </text>
          <rect
            className="connection-label-hit"
            x={mid.x - labelWidth / 2}
            y={mid.y - 9}
            width={labelWidth}
            height={18}
            data-label-connection-id={connection.system_connection_id}
          />
        </>
      )}
    </g>
  )
}
