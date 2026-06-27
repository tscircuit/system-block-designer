import { expect, test } from "bun:test"
import "bun-match-svg"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

const twoBlockSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Small Pair",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_0",
    center: { x: 120, y: 90 },
    size: { width: 128, height: 104 },
    label: "MCU",
    category: ["Processing & Security", "MCU"],
    icon: "chip",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_1",
    center: { x: 370, y: 90 },
    size: { width: 128, height: 104 },
    label: "Radio",
    category: ["Communication", "Radio Transceiver"],
    icon: "antenna",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_0",
    system_block_id: "system_block_0",
    label: "SPI",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "system_diagram_0",
    system_port_id: "system_port_1",
    system_block_id: "system_block_1",
    label: "SPI",
    side_of_block: "left",
  },
  {
    type: "system_connection",
    system_diagram_id: "system_diagram_0",
    system_connection_id: "system_connection_0",
    source_system_port_id: "system_port_0",
    target_system_port_id: "system_port_1",
    system_port_ids: ["system_port_0", "system_port_1"],
    path: [
      { x: 184, y: 90 },
      { x: 208, y: 90 },
      { x: 282, y: 90 },
      { x: 306, y: 90 },
    ],
    label: "SPI",
  },
]

test("renders two block system json snapshots", async () => {
  const snapshot = systemJsonToSvgSnapshot(twoBlockSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
