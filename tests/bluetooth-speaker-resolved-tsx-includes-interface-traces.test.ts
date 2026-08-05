import { expect, test } from "bun:test"
import { createBluetoothSpeakerSystemJson } from "../app/BluetoothSpeaker/createBluetoothSpeakerSystemJson"
import { systemJsonToTsx } from "../lib/system-blocks/systemJsonToTsx"

test("Bluetooth speaker resolved TSX includes each interface trace", () => {
  const tsx = systemJsonToTsx(createBluetoothSpeakerSystemJson())
  const traceLines = tsx
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("<trace "))

  expect(tsx).toContain(
    'import { AudioAmplifier_TAS2505, BatteryManagement_BQ24074, BluetoothAudioHost_MSP430F5229, BluetoothController_CC2564C, PowerManagement_TPS7A2018 } from "@tsci/tscircuit.ti"',
  )
  expect(traceLines).toEqual([
    '<trace from=".bluetooth_controller > .U1A > .HCI_TX" to=".bluetooth_host > .U10 > .UART_RXD" />',
    '<trace from=".bluetooth_controller > .U1A > .HCI_RX" to=".bluetooth_host > .U10 > .UART_TXD" />',
    '<trace from=".bluetooth_controller > .U1A > .HCI_RTS" to=".bluetooth_host > .U10 > .P1_4" />',
    '<trace from=".bluetooth_controller > .U1A > .HCI_CTS" to=".bluetooth_host > .U10 > .P1_5" />',
    '<trace from=".bluetooth_host > .U10 > .P1_7" to=".bluetooth_controller > .U1A > .N_SHUTD" />',
    '<trace from=".bluetooth_host > .R10 > .pin2" to=".bluetooth_controller > .U1A > .SLOW_CLK" />',
    '<trace from=".bluetooth_host > .U10 > .I2C_SDA" to=".audio_amplifier > .U1 > .SDA" />',
    '<trace from=".bluetooth_host > .U10 > .I2C_SCL" to=".audio_amplifier > .U1 > .SCL" />',
    '<trace from=".bluetooth_host > .U10 > .P2_0" to=".audio_amplifier > .U1 > .N_RST" />',
    '<trace from=".bluetooth_controller > .U1A > .AUD_CLK" to=".audio_amplifier > .U1 > .BCLK" />',
    '<trace from=".bluetooth_controller > .U1A > .AUD_CLK" to=".audio_amplifier > .U1 > .MCLK" />',
    '<trace from=".bluetooth_controller > .U1A > .AUD_FSYNC" to=".audio_amplifier > .U1 > .WCLK" />',
    '<trace from=".bluetooth_controller > .U1A > .AUD_OUT" to=".audio_amplifier > .U1 > .DIN" />',
  ])
})
