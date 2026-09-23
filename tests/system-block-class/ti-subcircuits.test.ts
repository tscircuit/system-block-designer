import { expect, test } from "bun:test"
import { TiSubcircuitComponents } from "@tsci/tscircuit.ti"
import {
  BatteryManagement_BQ24074,
  BuckBoostConverter_TPS63802,
  EnvironmentalSensor_HDC3020,
  Microcontroller_MSPM0G3507,
  MotorDriver_DRV8833,
  TiSystemBlockClasses,
} from "../../lib/system-blocks/TiSubcircuits"

test("exports a system block class for every TI subcircuit", () => {
  const tiComponentNames = Object.keys(TiSubcircuitComponents).filter(
    (componentName) => componentName !== "FlashMemory_W25Q128JVSIQ",
  )

  expect(Object.keys(TiSystemBlockClasses).sort()).toEqual(
    tiComponentNames.sort(),
  )
})

test("TI subcircuit blocks render their matching TSX component names", () => {
  expect(new BatteryManagement_BQ24074().getTsxFile()).toBe(
    "<BatteryManagement_BQ24074 />",
  )
  expect(new BuckBoostConverter_TPS63802().getTsxFile()).toBe(
    "<BuckBoostConverter_TPS63802 />",
  )
})

test("TI I2C interface ports expand for block-to-block connections", () => {
  const mcu = new Microcontroller_MSPM0G3507({
    systemBlockId: "controller",
    tsxInstanceName: "controller",
  })
  const sensor = new EnvironmentalSensor_HDC3020({
    systemBlockId: "sensor",
  })

  sensor
    .setConnection("VDD", [{ netName: "VCC" }])
    .setConnection("GND", [{ netName: "GND" }])
    .setConnection("I2C", [{ systemBlock: mcu, portName: "GPIO" }])

  expect(sensor.getTsxFile()).toMatchInlineSnapshot(
    `"<EnvironmentalSensor_HDC3020 connections={{ VDD: \"net.VCC\", GND: \"net.GND\", SCL: \"controller.PA0\", SDA: \"controller.PA1\" }} />"`,
  )
})

test("TI motor interface ports expand to concrete output pins", () => {
  const motorA = new MotorDriver_DRV8833({
    systemBlockId: "motor_a",
    tsxInstanceName: "motorA",
  })
  const motorB = new MotorDriver_DRV8833({
    systemBlockId: "motor_b",
  })

  motorB.setConnection("MOTOR", [{ systemBlock: motorA, portName: "MOTOR" }])

  expect(motorB.getTsxFile()).toMatchInlineSnapshot(
    `"<MotorDriver_DRV8833 connections={{ MOTOR_A: \"motorA.MOTOR_A\", MOTOR_B: \"motorA.MOTOR_B\" }} />"`,
  )
})
