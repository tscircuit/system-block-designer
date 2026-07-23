import { expect, test } from "bun:test"
import {
  EnvironmentalSensor_HDC2080,
  EnvironmentalSensor_HDC3020,
} from "../../lib/system-blocks/TiSubcircuits"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createTiInterfaceSnapshot } from "./fixtures/create-ti-interface-snapshot"

test("TI I2C connection renders block diagram and schematic snapshots", async () => {
  const systemDiagramId = "system_diagram_0"
  const source = new EnvironmentalSensor_HDC2080({
    systemDiagramId,
    systemBlockId: "sensor_a",
    center: { x: 180, y: 180 },
  })
  const target = new EnvironmentalSensor_HDC3020({
    systemDiagramId,
    systemBlockId: "sensor_b",
    center: { x: 580, y: 180 },
  })
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "I2C interface test",
      width: 760,
      height: 360,
    },
    ...source.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "sensor_a_i2c",
      system_block_id: "sensor_a",
      label: "I2C",
      side_of_block: "right",
    },
    ...target.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "sensor_b_i2c",
      system_block_id: "sensor_b",
      label: "I2C",
      side_of_block: "left",
    },
    {
      type: "system_connection",
      system_diagram_id: systemDiagramId,
      system_connection_id: "i2c_connection",
      source_system_port_id: "sensor_a_i2c",
      target_system_port_id: "sensor_b_i2c",
      system_port_ids: ["sensor_a_i2c", "sensor_b_i2c"],
      path: [
        { x: 270, y: 180 },
        { x: 306, y: 180 },
        { x: 454, y: 180 },
        { x: 490, y: 180 },
      ],
      label: "I2C",
    },
  ]

  const { blockDiagramSvg, schematicSvg, tsx } =
    await createTiInterfaceSnapshot(systemJson)

  expect(tsx).toContain(
    '<trace from=".sensor_a > .U1 > .I2C_SDA" to=".sensor_b > .U1 > .I2C_SDA" />',
  )
  expect(tsx).toContain(
    '<trace from=".sensor_a > .U1 > .I2C_SCL" to=".sensor_b > .U1 > .I2C_SCL" />',
  )
  await expect(blockDiagramSvg).toMatchSvgSnapshot(
    import.meta.path,
    "block-diagram",
  )
  await expect(schematicSvg).toMatchSvgSnapshot(import.meta.path, "schematic")
}, 60_000)
