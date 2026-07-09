import { expect, test } from "bun:test"
import { applyAiDesignActions } from "../components/AiChat"
import type { AiDesignAction } from "../components/AiChat"
import type { SystemJson } from "../lib/system-json/system-json"

test("AI chat actions reject blocks that are not in the design library", () => {
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: "diagram_1",
      name: "Test diagram",
    },
  ]
  const actions: AiDesignAction[] = [
    {
      type: "upsert_block",
      block: {
        type: "system_block",
        system_diagram_id: "diagram_1",
        system_block_id: "invented_sensor",
        center: { x: 100, y: 100 },
        size: { width: 140, height: 90 },
        label: "Invented Quantum Sensor",
        category: ["Sensor", "Invented Quantum Sensor"],
      },
    },
  ]

  expect(() => applyAiDesignActions(systemJson, actions)).toThrow(
    "not in the design library",
  )
})
