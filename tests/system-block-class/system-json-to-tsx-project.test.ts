import { expect, test } from "bun:test"
import { createTiBlocksCircuitJsonSystemJson } from "../../components/pages/DesignCanvas/DesignCanvas01/createTiBlocksCircuitJsonSystemJson"
import { systemJsonToTsxProject } from "../../lib/system-blocks/systemJsonToTsx"

test("systemJsonToTsxProject emits one index file importing TI subcircuits", () => {
  const { files } = systemJsonToTsxProject(
    createTiBlocksCircuitJsonSystemJson(),
  )

  expect(Object.keys(files)).toEqual(["index.circuit.tsx"])
  expect(files["index.circuit.tsx"]).toContain(
    'import { EnvironmentalSensor_HDC3020, Microcontroller_MSPM0G3507 } from "@tsci/tscircuit.ti"',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<board routingDisabled>',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<Microcontroller_MSPM0G3507 name="controller" connections={{ PA0: "sensor.SCL", PA1: "sensor.SDA", VDD: "sensor.VDD", GND: "sensor.GND" }} />',
  )
})
