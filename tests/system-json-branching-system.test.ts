import { expect, test } from "bun:test"
import "bun-match-svg"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

const branchingSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "diagram_branching",
    name: "Branching Power",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_branching",
    system_block_id: "battery",
    center: { x: 90, y: 150 },
    size: { width: 128, height: 104 },
    label: "Battery",
    category: ["Battery Management", "Batteries"],
    icon: "battery",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_branching",
    system_block_id: "pmic",
    center: { x: 320, y: 150 },
    size: { width: 128, height: 104 },
    label: "PMIC",
    category: ["Power", "PMIC"],
    icon: "power",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_branching",
    system_block_id: "ble",
    center: { x: 565, y: 70 },
    size: { width: 176, height: 140 },
    label: "BLE Module",
    category: ["Communication", "BLE Module"],
    icon: "chip",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_branching",
    system_port_id: "battery_r_0",
    system_block_id: "battery",
    label: "V+",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_branching",
    system_port_id: "pmic_l_0",
    system_block_id: "pmic",
    label: "VIN",
    side_of_block: "left",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_branching",
    system_port_id: "pmic_r_0",
    system_block_id: "pmic",
    label: "3V3",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_branching",
    system_port_id: "ble_b_0",
    system_block_id: "ble",
    label: "SUPPLY",
    side_of_block: "bottom",
  },
  {
    type: "system_connection",
    system_diagram_id: "diagram_branching",
    system_connection_id: "battery_to_pmic",
    source_system_port_id: "battery_r_0",
    target_system_port_id: "pmic_l_0",
    path: [
      { x: 154, y: 150 },
      { x: 178, y: 150 },
      { x: 232, y: 150 },
      { x: 256, y: 150 },
    ],
    label: "VIN",
  },
  {
    type: "system_connection",
    system_diagram_id: "diagram_branching",
    system_connection_id: "pmic_to_ble",
    source_system_port_id: "pmic_r_0",
    target_system_port_id: "ble_b_0",
    path: [
      { x: 384, y: 150 },
      { x: 408, y: 150 },
      { x: 565, y: 150 },
      { x: 565, y: 140 },
    ],
    label: "3V3",
  },
]

test("renders branching system json snapshots", async () => {
  const snapshot = systemJsonToSvgSnapshot(branchingSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
