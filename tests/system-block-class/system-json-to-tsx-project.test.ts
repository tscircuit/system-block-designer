import { expect, test } from "bun:test"
import { createTiBlocksCircuitJsonSystemJson } from "../../components/pages/DesignCanvas/DesignCanvas01/createTiBlocksCircuitJsonSystemJson"
import type { SystemJson } from "../../lib/system-json/system-json"
import { systemJsonToTsxProject } from "../../lib/system-blocks/systemJsonToTsx"

test("systemJsonToTsxProject emits one index file importing TI subcircuits", () => {
  const { files } = systemJsonToTsxProject(
    createTiBlocksCircuitJsonSystemJson(),
  )

  expect(Object.keys(files)).toEqual(["index.circuit.tsx"])
  expect(files["index.circuit.tsx"]).toContain(
    'import { EnvironmentalSensor_HDC3020, Microcontroller_MSPM0G3507 } from "@tsci/tscircuit.ti"',
  )
  expect(files["index.circuit.tsx"]).toContain("export default () => (")
  expect(files["index.circuit.tsx"]).not.toContain("circuit.add(")
  expect(files["index.circuit.tsx"]).toContain("<board routingDisabled>")
  // Each block declares its own schematic sheet and is pinned to it.
  expect(files["index.circuit.tsx"]).toContain(
    '<schematicsheet name="controller" displayName="Microcontroller" sheetIndex={0} />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<Microcontroller_MSPM0G3507 name="controller" schSheetName="controller" />',
  )
  expect(files["index.circuit.tsx"]).not.toContain("connections={{")
})

test("TI system blocks include per-subcircuit I2C interface definitions", () => {
  const blocks = createTiBlocksCircuitJsonSystemJson().filter(
    (item) => item.type === "system_block",
  )
  const controller = blocks.find(
    (block) => block.system_block_id === "controller",
  )
  const sensor = blocks.find((block) => block.system_block_id === "sensor")

  expect(controller?.interfaces).toContainEqual({
    name: "I2C1",
    kind: "i2c",
    i2cPins: {
      SDA: "U1.PA1",
      SCL: "U1.PA0",
      VCC: "U1.VDD",
      GND: "U1.GND",
    },
  })
  expect(sensor?.interfaces).toContainEqual({
    name: "I2C1",
    kind: "i2c",
    i2cPins: {
      SDA: "U1.I2C_SDA",
      SCL: "U1.I2C_SCL",
      VCC: "U1.VDD",
      GND: "U1.GND",
    },
  })
})

test("systemJsonToTsxProject matches I2C interfaces and emits cross-subcircuit traces", () => {
  const systemJson = createTiBlocksCircuitJsonSystemJson()
    .filter(
      (item) =>
        item.type !== "system_connection" ||
        item.system_connection_id !== "w_sda",
    )
    .map<SystemJson>((item) =>
      item.type === "system_connection" && item.system_connection_id === "w_scl"
        ? { ...item, label: "i2c" }
        : item,
    )
  const { files } = systemJsonToTsxProject(systemJson)
  const tsx = files["index.circuit.tsx"]

  expect(tsx).toContain(
    '<trace from=".controller > .U1 > .PA1" to=".sensor > .U1 > .I2C_SDA" />',
  )
  expect(tsx).toContain(
    '<trace from=".controller > .U1 > .PA0" to=".sensor > .U1 > .I2C_SCL" />',
  )
  expect(tsx).toContain(
    '<trace from=".controller > .U1 > .VDD" to=".sensor > .U1 > .VDD" />',
  )
  expect(tsx).toContain(
    '<trace from=".controller > .U1 > .GND" to=".sensor > .U1 > .GND" />',
  )
  expect(tsx).not.toContain('PA0: "sensor.SCL"')
})
