import { useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { createSystemJsonTraceSolver } from "../../../lib/system-trace-solver"
import type { SystemJson } from "../../../lib/system-json/system-json"

const fanoutSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Compact Fanout",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "pmic",
    center: { x: 120, y: 220 },
    size: { width: 124, height: 112 },
    label: "PMIC",
    category: ["power"],
  },
  ...["sensor", "radio", "memory", "led_driver"].map((id, index) => ({
    type: "system_block" as const,
    system_diagram_id: "system_diagram_0",
    system_block_id: id,
    center: { x: 420, y: 80 + index * 92 },
    size: { width: 126, height: 72 },
    label: id.replace("_", " ").toUpperCase(),
    category: ["load"],
  })),
  ...["vout_a", "vout_b", "vout_c", "vout_d"].map((id) => ({
    type: "system_port" as const,
    system_diagram_id: "system_diagram_0",
    system_port_id: id,
    system_block_id: "pmic",
    side_of_block: "right" as const,
    label: "3V3",
  })),
  ...["sensor", "radio", "memory", "led_driver"].map((id) => ({
    type: "system_port" as const,
    system_diagram_id: "system_diagram_0",
    system_port_id: `${id}_vin`,
    system_block_id: id,
    side_of_block: "left" as const,
    label: "VIN",
  })),
  ...["sensor", "radio", "memory", "led_driver"].map((id, index) => ({
    type: "system_connection" as const,
    system_diagram_id: "system_diagram_0",
    system_connection_id: `${id}_supply`,
    source_system_port_id: ["vout_a", "vout_b", "vout_c", "vout_d"][index],
    target_system_port_id: `${id}_vin`,
    system_port_ids: [
      ["vout_a", "vout_b", "vout_c", "vout_d"][index],
      `${id}_vin`,
    ],
    path: [],
    label: "3V3",
  })),
]

export default function SystemTraceSolverFanoutPage() {
  const solver = useMemo(() => {
    const blocks = fanoutSystem.filter((item) => item.type === "system_block")
    const ports = fanoutSystem.filter((item) => item.type === "system_port")
    const connections = fanoutSystem.filter(
      (item) => item.type === "system_connection",
    )
    return createSystemJsonTraceSolver({ blocks, ports, connections })
  }, [])

  return <GenericSolverDebugger solver={solver} animationSpeed={35} />
}
