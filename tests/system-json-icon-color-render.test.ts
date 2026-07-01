import { expect, test } from "bun:test"
import type { SystemJson } from "../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "../lib/system-json/system-json-to-svg"

const coloredIconSystemJson: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "Colored Icon",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "system_block_0",
    center: { x: 100, y: 100 },
    size: { width: 128, height: 104 },
    label: "Sensor",
    category: ["Sensor"],
    icon: "sensor",
    icon_color: "#00A4A4",
  },
]

test("renders system json block icons with configured icon color", () => {
  const svg = systemJsonToSvgSnapshot(coloredIconSystemJson)

  expect(svg).toContain('stroke="#00A4A4"')
  expect(svg).toContain('d="M9 3v3M15 3v3')
})
