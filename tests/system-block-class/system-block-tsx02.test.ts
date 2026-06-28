import { expect, test } from "bun:test"
import { EnvironmentalSensor_HDC2080 } from "../../lib/system-blocks/TiSubcircuits"

test("EnvironmentalSensor_HDC2080 renders tsx with net connections", () => {
  const sensor = new EnvironmentalSensor_HDC2080()

  sensor
    .setConnection("VDD", [{ netName: "VCC" }])
    .setConnection("GND", ["net.GND"])
    .setConnection("SCL", [{ connection: "net.I2C_SCL" }])
    .setConnection("SDA", [{ connection: "net.I2C_SDA" }])

  expect(sensor.getTsxFile()).toMatchInlineSnapshot(
    `"<EnvironmentalSensor_HDC2080 connections={{ VDD: \"net.VCC\", GND: \"net.GND\", SCL: \"net.I2C_SCL\", SDA: \"net.I2C_SDA\" }} />"`,
  )
})
