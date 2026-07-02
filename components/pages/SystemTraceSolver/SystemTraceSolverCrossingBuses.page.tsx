import { useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { createSystemJsonTraceSolver } from "../../../lib/system-trace-solver"
import type { SystemJson } from "../../../lib/system-json/system-json"

const crossingBusSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Crossing Buses",
  },
  ...[
    ["controller", "Controller", 110, 220],
    ["imu", "IMU", 430, 80],
    ["display", "Display", 430, 220],
    ["charger", "Charger", 430, 360],
    ["battery", "Battery", 110, 360],
  ].map(
    ([id, label, x, y]) =>
      ({
        type: "system_block",
        system_diagram_id: "system_diagram_0",
        system_block_id: id,
        center: { x, y },
        size: { width: 132, height: 92 },
        label,
        category: ["demo"],
      }) as SystemJson,
  ),
  ...[
    ["controller_i2c", "controller", "right", "I2C"],
    ["controller_spi", "controller", "right", "SPI"],
    ["controller_pwr", "controller", "bottom", "VDD"],
    ["imu_i2c", "imu", "left", "I2C"],
    ["display_spi", "display", "left", "SPI"],
    ["charger_out", "charger", "left", "3V3"],
    ["battery_out", "battery", "top", "VBAT"],
  ].map(
    ([id, blockId, side, label]) =>
      ({
        type: "system_port",
        system_diagram_id: "system_diagram_0",
        system_port_id: id,
        system_block_id: blockId,
        side_of_block: side,
        label,
      }) as SystemJson,
  ),
  ...[
    ["i2c_trace", "controller_i2c", "imu_i2c", "i2c"],
    ["spi_trace", "controller_spi", "display_spi", "spi"],
    ["battery_trace", "battery_out", "controller_pwr", "VBAT"],
    ["supply_trace", "charger_out", "controller_pwr", "3V3"],
  ].map(
    ([id, source, target, label]) =>
      ({
        type: "system_connection",
        system_diagram_id: "system_diagram_0",
        system_connection_id: id,
        source_system_port_id: source,
        target_system_port_id: target,
        system_port_ids: [source, target],
        path: [],
        label,
      }) as SystemJson,
  ),
]

export default function SystemTraceSolverCrossingBusesPage() {
  const solver = useMemo(() => {
    const blocks = crossingBusSystem.filter(
      (item) => item.type === "system_block",
    )
    const ports = crossingBusSystem.filter(
      (item) => item.type === "system_port",
    )
    const connections = crossingBusSystem.filter(
      (item) => item.type === "system_connection",
    )
    return createSystemJsonTraceSolver({ blocks, ports, connections })
  }, [])

  return <GenericSolverDebugger solver={solver} animationSpeed={35} />
}
