import { expect, test } from "bun:test"
import "bun-match-svg"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

const branchingSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Branching Power",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_0",
    center: { x: 90, y: 150 },
    size: { width: 128, height: 104 },
    label: "Battery",
    category: ["Battery Management", "Batteries"],
    icon: "battery",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_1",
    center: { x: 320, y: 150 },
    size: { width: 128, height: 104 },
    label: "PMIC",
    category: ["Power", "PMIC"],
    icon: "power",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_2",
    center: { x: 565, y: 70 },
    size: { width: 176, height: 140 },
    label: "BLE Module",
    category: ["Communication", "BLE Module"],
    icon: "chip",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_0",
    system_block_id: "system_block_0",
    label: "V+",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_1",
    system_block_id: "system_block_1",
    label: "VIN",
    side_of_block: "left",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_2",
    system_block_id: "system_block_1",
    label: "3V3",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_3",
    system_block_id: "system_block_2",
    label: "SUPPLY",
    side_of_block: "bottom",
  },
  {
    type: "system_connection",
    system_diagram_id: "system_diagram_0",
    system_connection_id: "system_connection_0",
    source_system_port_id: "system_port_0",
    target_system_port_id: "system_port_1",
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
    system_diagram_id: "system_diagram_0",
    system_connection_id: "system_connection_1",
    source_system_port_id: "system_port_2",
    target_system_port_id: "system_port_3",
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
