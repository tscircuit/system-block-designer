import { expect, test } from "bun:test"
import { EnvironmentalSensor_HDC2080 } from "../../lib/system-blocks/EnviromentalSensor/EnvironmentalSensor_HDC2080"

test("EnvironmentalSensor_HDC2080 renders tsx without connections", () => {
  const sensor = new EnvironmentalSensor_HDC2080()

  expect(sensor.getTsxFile()).toMatchInlineSnapshot(
    `"<EnvironmentalSensor_HDC2080 />"`,
  )
})
