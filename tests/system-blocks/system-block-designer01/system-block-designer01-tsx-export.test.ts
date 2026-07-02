import { expect, test } from "bun:test"
import { createSystemBlockDesigner01SystemJson } from "../../../app/SystemBlockDesigner01/createSystemBlockDesigner01SystemJson"
import { systemJsonToTsxProject } from "../../../lib/system-blocks/systemJsonToTsx"

test("system block designer 01 TSX export includes TI I2C traces", () => {
  const { files } = systemJsonToTsxProject(
    createSystemBlockDesigner01SystemJson(),
  )

  expect(Object.keys(files)).toEqual(["index.circuit.tsx"])
  expect(files["index.circuit.tsx"]).toContain("@tsci/tscircuit.ti")
  expect(files["index.circuit.tsx"]).toContain("export default () => (")
  expect(files["index.circuit.tsx"]).not.toContain("circuit.add(")
  expect(files["index.circuit.tsx"]).not.toContain("connections={{")
  expect(files["index.circuit.tsx"]).toContain(
    "EnvironmentalSensor_HDC3020, Microcontroller_MSPM0G3507, PowerMonitor_INA237",
  )
  // Each block renders on its own schematic sheet, pinned via schSheetName.
  expect(files["index.circuit.tsx"]).toContain(
    '<schematicsheet name="controller" displayName="Microcontroller" sheetIndex={0} />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<Microcontroller_MSPM0G3507 name="controller" schSheetName="controller" />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<trace from=".controller > .U1 > .PA1" to=".sensor > .U1 > .SDA" />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<trace from=".controller > .U1 > .PA0" to=".sensor > .U1 > .SCL" />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<trace from=".controller > .U1 > .PA1" to=".power_monitor > .U1 > .SDA" />',
  )
  expect(files["index.circuit.tsx"]).toContain(
    '<trace from=".controller > .U1 > .PA0" to=".power_monitor > .U1 > .SCL" />',
  )
})
