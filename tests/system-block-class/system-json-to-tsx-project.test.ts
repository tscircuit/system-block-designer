import { expect, test } from "bun:test"
import { createTiBlocksCircuitJsonSystemJson } from "../../components/pages/DesignCanvas/DesignCanvas01/createTiBlocksCircuitJsonSystemJson"
import { systemJsonToTsxProject } from "../../lib/system-blocks/systemJsonToTsx"

test("systemJsonToTsxProject emits chip, subcircuit, and index files", () => {
  const { files } = systemJsonToTsxProject(
    createTiBlocksCircuitJsonSystemJson(),
  )

  expect(Object.keys(files).sort()).toEqual([
    "chips/HDC3020.tsx",
    "chips/MSPM0G3507.tsx",
    "index.circuit.tsx",
    "subcircuits/EnvironmentalSensor_HDC3020.tsx",
    "subcircuits/Microcontroller_MSPM0G3507.tsx",
  ])
  expect(files["chips/HDC3020.tsx"]).toContain(
    "EnvironmentalSensor_HDC3020 as HDC3020",
  )
  expect(files["subcircuits/EnvironmentalSensor_HDC3020.tsx"]).toContain(
    'import { HDC3020 } from "../chips/HDC3020"',
  )
  expect(files["index.circuit.tsx"]).toContain(
    'import { Microcontroller_MSPM0G3507 } from "./subcircuits/Microcontroller_MSPM0G3507"',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<board width="100mm" height="100mm">',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<Microcontroller_MSPM0G3507 name="controller" connections={{ PA0: "sensor.SCL", PA1: "sensor.SDA", VDD: "sensor.VDD", GND: "sensor.GND" }} />',
  )
})
