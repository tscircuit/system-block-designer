import { expect, test } from "bun:test"
import {
  EnvironmentalSensor_HDC2080,
  TemperatureSensor_TMP1075,
} from "../../lib/system-blocks/TiSubcircuits"
import { renderTsxToCircuitJson } from "../fixtures/render-tsx-to-circuit-json"

test("generated TI subcircuit tsx renders to circuit json inside a board", async () => {
  const sensor = new EnvironmentalSensor_HDC2080()
  const temperatureSensor = new TemperatureSensor_TMP1075()

  const tsx = `
import { EnvironmentalSensor_HDC2080, TemperatureSensor_TMP1075 } from "@tsci/tscircuit.ti"

circuit.add(
  <board>
    ${sensor.getTsxFile()}
    ${temperatureSensor.getTsxFile()}
  </board>
)
`

  const circuitJson = await renderTsxToCircuitJson(tsx)
  const sourceBoard = circuitJson.find(
    (element) => element.type === "source_board",
  )
  const pcbBoard = circuitJson.find((element) => element.type === "pcb_board")
  const sourceGroups = circuitJson.filter(
    (element) => element.type === "source_group",
  )
  const childSubcircuits = sourceGroups.filter(
    (element) =>
      element.is_subcircuit &&
      element.parent_source_group_id === sourceBoard?.source_group_id,
  )
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )

  expect(sourceBoard).toMatchObject({ type: "source_board" })
  expect(pcbBoard).toMatchObject({
    type: "pcb_board",
  })
  expect(childSubcircuits).toHaveLength(2)
  expect(
    sourceComponents
      .map((element) => element.manufacturer_part_number)
      .filter((partNumber) => partNumber !== undefined)
      .sort(),
  ).toEqual(["HDC2080DMBR", "MCU", "TMP1075DSGR", "Two-Wire Host Controller"])
  expect(sourceComponents).toHaveLength(10)
  expect(circuitJson.some((element) => element.type.endsWith("_error"))).toBe(
    false,
  )
})
