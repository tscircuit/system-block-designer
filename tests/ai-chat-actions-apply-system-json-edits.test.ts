import { expect, test } from "bun:test"
import { applyAiDesignActions } from "../components/AiChat"
import type { AiDesignAction } from "../components/AiChat"
import type { SystemJson } from "../lib/system-json/system-json"

test("AI chat actions apply SystemJson edits and route new connections", () => {
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
      label: "Controller",
      category: ["Embedded Processing and Device Control"],
    },
    {
      type: "system_port",
      system_diagram_id: "diagram_1",
      system_port_id: "controller_pa0",
      system_block_id: "controller",
      label: "PA0",
      side_of_block: "right",
    },
  ]
  const actions: AiDesignAction[] = [
    {
      type: "upsert_block",
      block: {
        type: "system_block",
        system_diagram_id: "diagram_1",
        system_block_id: "environment_sensor",
        center: { x: 360, y: 100 },
        size: { width: 170, height: 110 },
        label: "Environmental Sensor",
        category: ["Sensor", "Environmental Sensor"],
        part_number: "HDC3020",
        icon: "sensor",
      },
    },
    {
      type: "upsert_port",
      port: {
        type: "system_port",
        system_diagram_id: "diagram_1",
        system_port_id: "environment_sensor_scl",
        system_block_id: "environment_sensor",
        label: "SCL",
        side_of_block: "left",
      },
    },
    {
      type: "upsert_connection",
      connection: {
        type: "system_connection",
        system_diagram_id: "diagram_1",
        system_connection_id: "i2c_scl",
        source_system_port_id: "controller_pa0",
        target_system_port_id: "environment_sensor_scl",
        system_port_ids: ["controller_pa0", "environment_sensor_scl"],
        label: "I2C SCL",
      },
    },
  ]

  const nextSystemJson = applyAiDesignActions(systemJson, actions)
  const nextBlock = nextSystemJson.find(
    (item) =>
      item.type === "system_block" &&
      item.system_block_id === "environment_sensor",
  )
  const nextConnection = nextSystemJson.find(
    (item) =>
      item.type === "system_connection" &&
      item.system_connection_id === "i2c_scl",
  )

  expect(nextBlock).toMatchObject({
    type: "system_block",
    label: "Environmental Sensor",
    part_number: "HDC3020",
  })
  expect(nextConnection?.type).toBe("system_connection")
  if (nextConnection?.type === "system_connection") {
    expect(nextConnection.path.length).toBeGreaterThan(0)
  }
})
