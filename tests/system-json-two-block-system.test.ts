import { expect, test } from "bun:test"
import "bun-match-svg"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

const twoBlockSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "diagram_small_pair",
    name: "Small Pair",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_small_pair",
    system_block_id: "mcu",
    center: { x: 120, y: 90 },
    size: { width: 128, height: 104 },
    label: "MCU",
    category: ["Processing & Security", "MCU"],
    icon: "chip",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_small_pair",
    system_block_id: "radio",
    center: { x: 370, y: 90 },
    size: { width: 128, height: 104 },
    label: "Radio",
    category: ["Communication", "Radio Transceiver"],
    icon: "antenna",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_small_pair",
    system_port_id: "mcu_r_0",
    system_block_id: "mcu",
    label: "SPI",
    side_of_block: "right",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_small_pair",
    system_port_id: "radio_l_0",
    system_block_id: "radio",
    label: "SPI",
    side_of_block: "left",
  },
  {
    type: "system_connection",
    system_diagram_id: "diagram_small_pair",
    system_connection_id: "spi",
    source_system_port_id: "mcu_r_0",
    target_system_port_id: "radio_l_0",
    system_port_ids: ["mcu_r_0", "radio_l_0"],
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
