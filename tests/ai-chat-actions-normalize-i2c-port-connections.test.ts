import { expect, test } from "bun:test"
import { applyAiDesignActions } from "../components/AiChat"
import type { AiDesignAction } from "../components/AiChat"
import type { SystemJson } from "../lib/system-json/system-json"

test("AI chat actions normalize GPIO-labeled SCL connections to I2C", () => {
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: "diagram_1",
      name: "Sensor system",
    },
    {
      type: "system_block",
      system_diagram_id: "diagram_1",
      system_block_id: "controller",
      center: { x: 100, y: 100 },
      size: { width: 140, height: 90 },
      label: "Microcontroller",
      category: ["Embedded Processing and Device Control"],
    },
    {
      type: "system_block",
      system_diagram_id: "diagram_1",
      system_block_id: "environment_sensor",
      center: { x: 360, y: 100 },
      size: { width: 170, height: 110 },
      label: "Environmental Sensor",
      category: ["Sensor", "Environmental Sensor"],
    },
    {
      type: "system_port",
      system_diagram_id: "diagram_1",
      system_port_id: "controller_pa0",
      system_block_id: "controller",
      label: "PA0",
      side_of_block: "right",
    },
    {
      type: "system_port",
      system_diagram_id: "diagram_1",
      system_port_id: "environment_sensor_scl",
      system_block_id: "environment_sensor",
      label: "SCL",
      side_of_block: "left",
    },
  ]
  const actions: AiDesignAction[] = [
    {
      type: "upsert_connection",
      connection: {
        type: "system_connection",
        system_diagram_id: "diagram_1",
        system_connection_id: "sensor_scl",
        source_system_port_id: "controller_pa0",
        target_system_port_id: "environment_sensor_scl",
        system_port_ids: ["controller_pa0", "environment_sensor_scl"],
        label: "GPIO",
      },
    },
  ]

  const nextSystemJson = applyAiDesignActions(systemJson, actions)
  const nextConnection = nextSystemJson.find(
    (item) =>
      item.type === "system_connection" &&
      item.system_connection_id === "sensor_scl",
  )

  expect(nextConnection).toMatchObject({
    type: "system_connection",
    label: "i2c",
  })
})
