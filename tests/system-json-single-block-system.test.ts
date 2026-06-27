import { expect, test } from "bun:test"
import "bun-match-svg"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

const singleBlockSystem: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "diagram_single_block",
    name: "Single Block",
  },
  {
    type: "system_block",
    system_diagram_id: "diagram_single_block",
    system_block_id: "sensor",
    center: { x: 100, y: 100 },
    size: { width: 128, height: 104 },
    label: "Sensor",
    category: ["Sensor"],
    icon: "chip",
  },
  {
    type: "system_port",
    system_diagram_id: "diagram_single_block",
    system_port_id: "sensor_r_0",
    system_block_id: "sensor",
    label: "OUT",
    side_of_block: "right",
  },
]

test("renders single block system json snapshots", async () => {
  const snapshot = systemJsonToSvgSnapshot(singleBlockSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
