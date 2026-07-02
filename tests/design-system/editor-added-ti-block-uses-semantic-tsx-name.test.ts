import { expect, test } from "bun:test"
import { createSystemJsonForLibraryBlock } from "../../components/DesignCanvas/systemJsonCanvas"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"

test("editor-added TI blocks use semantic TSX names instead of generated ids", () => {
  const blockSystemJson = [
    "MCU",
    "Environmental Sensor",
    "Power Monitor",
    "LDO",
    "Environmental Sensor",
  ].map((type, index) =>
    createSystemJsonForLibraryBlock({
      system_diagram_id: "system_diagram_0",
      blockId: `b_${index + 1}`,
      type,
      center: { x: 120 + index * 240, y: 100 },
    }),
  )

  for (const block of blockSystemJson) {
    expect(block).not.toBeNull()
  }

  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: "system_diagram_0",
      name: "Test System",
    },
    ...blockSystemJson.flatMap((block) => block!),
  ]

  const tsx = systemJsonToTsx(systemJson)

  expect(tsx).toContain(
    '<schematicsheet name="microcontroller" displayName="Microcontroller" sheetIndex={0} />',
  )
  expect(tsx).toContain(
    '<Microcontroller_MSPM0G3507 name="microcontroller" schSheetName="microcontroller" />',
  )
  expect(tsx).toContain(
    '<schematicsheet name="sensor" displayName="Environmental Sensor" sheetIndex={1} />',
  )
  expect(tsx).toContain(
    '<EnvironmentalSensor_HDC2080 name="sensor" schSheetName="sensor" />',
  )
  expect(tsx).toContain(
    '<schematicsheet name="power_monitor" displayName="Power Monitor" sheetIndex={2} />',
  )
  expect(tsx).toContain(
    '<PowerMonitor_INA237 name="power_monitor" schSheetName="power_monitor" />',
  )
  expect(tsx).toContain(
    '<schematicsheet name="power_management" displayName="Low-Dropout Regulator" sheetIndex={3} />',
  )
  expect(tsx).toContain(
    '<PowerManagement_TPS7A02 name="power_management" schSheetName="power_management" />',
  )
  expect(tsx).toContain(
    '<schematicsheet name="sensor_2" displayName="Environmental Sensor" sheetIndex={4} />',
  )
  expect(tsx).not.toContain('name="b_1"')
  expect(tsx).not.toContain('name="b_2"')
  expect(tsx).not.toContain('name="b_3"')
  expect(tsx).not.toContain('name="b_4"')
  expect(tsx).not.toContain('name="b_5"')
})
