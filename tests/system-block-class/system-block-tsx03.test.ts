import { expect, test } from "bun:test"
import { EnvironmentalSensor_HDC2080 } from "../../lib/system-blocks/EnviromentalSensor/EnvironmentalSensor_HDC2080"

test("EnvironmentalSensor_HDC2080 renders tsx with multi-target and block-to-block connections", () => {
  const mcuSideSensor = new EnvironmentalSensor_HDC2080({
    systemBlockId: "mcu_side_sensor",
    tsxInstanceName: "mcuSideSensor",
  })
  const sensor = new EnvironmentalSensor_HDC2080({
    systemBlockId: "room_sensor",
  })

  sensor
    .setConnection("DRDY_INT", [
      { systemBlock: mcuSideSensor, portName: "GPIO1" },
    ])
    .setConnection("ADDR", ["net.GND", { connection: "net.ADDR_STRAP" }])

  expect(sensor.getTsxFile()).toMatchInlineSnapshot(
    `"<EnvironmentalSensor_HDC2080 connections={{ DRDY_INT: \"mcuSideSensor.GPIO1\", ADDR: [\"net.GND\", \"net.ADDR_STRAP\"] }} />"`,
  )
})
