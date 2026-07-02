import { useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { createSystemJsonTraceSolver } from "../../../lib/system-trace-solver"
import type { SystemJson } from "../../../lib/system-json/system-json"

const obstacleSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Obstacle Routing",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "mcu",
    center: { x: 100, y: 160 },
    size: { width: 130, height: 96 },
    label: "MCU",
    category: ["controller"],
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "radio",
    center: { x: 540, y: 160 },
    size: { width: 140, height: 104 },
    label: "Radio",
    category: ["wireless"],
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "secure_element",
    center: { x: 320, y: 160 },
    size: { width: 142, height: 112 },
    label: "Secure Element",
    category: ["security"],
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "mcu_spi",
    system_block_id: "mcu",
    side_of_block: "right",
    label: "SPI",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "radio_spi",
    system_block_id: "radio",
    side_of_block: "left",
    label: "SPI",
  },
  {
    type: "system_connection",
    system_diagram_id: "system_diagram_0",
    system_connection_id: "spi_trace",
    source_system_port_id: "mcu_spi",
    target_system_port_id: "radio_spi",
    system_port_ids: ["mcu_spi", "radio_spi"],
    path: [],
    label: "spi",
  },
]

export default function SystemTraceSolverObstaclePage() {
  const solver = useMemo(() => {
    const blocks = obstacleSystem.filter((item) => item.type === "system_block")
    const ports = obstacleSystem.filter((item) => item.type === "system_port")
    const connections = obstacleSystem.filter(
      (item) => item.type === "system_connection",
    )
    return createSystemJsonTraceSolver({ blocks, ports, connections })
  }, [])

  return <GenericSolverDebugger solver={solver} animationSpeed={50} />
}
