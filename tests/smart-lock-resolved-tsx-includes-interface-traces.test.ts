import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../app/SmartLock/createSmartLockSystemJson"
import { systemJsonToTsx } from "../lib/system-blocks/systemJsonToTsx"

test("smart lock resolved TSX includes each interface trace", () => {
  const tsx = systemJsonToTsx(createSmartLockSystemJson())
  const traceLines = tsx
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("<trace "))

  expect(tsx).toContain(
    'import { FlashMemory_W25Q128JVSIQ } from "@tscircuit/common"',
  )
  expect(tsx).not.toContain(
    'FlashMemory_W25Q128JVSIQ } from "@tsci/tscircuit.ti"',
  )

  expect(traceLines).toEqual([
    '<trace from=".radio_transceiver > .U2 > .FLASH_SPI_CLK" to=".radio_level_shifter > .U1 > .IO_A1" />',
    '<trace from=".radio_transceiver > .U2 > .GPIO10" to=".radio_level_shifter > .U1 > .IO_A2" />',
    '<trace from=".radio_level_shifter > .U1 > .IO_B1" to=".ble_module > .U1 > .GPIO_DIO0" />',
    '<trace from=".radio_level_shifter > .U1 > .IO_B2" to=".ble_module > .U1 > .GPIO_DIO1" />',
    '<trace from=".ble_module > .U1 > .GPIO_DIO2" to=".flash > .U1 > .SPI_SCK" />',
    '<trace from=".ble_module > .U1 > .GPIO_DIO3" to=".flash > .U1 > .SPI_CS" />',
    '<trace from=".radio_transceiver > .U2 > .GPIO11" to=".nfc > .U1 > .EN" />',
    '<trace from=".radio_transceiver > .U2 > .GPIO12" to=".nfc > .U1 > .SPI_SCK" />',
    '<trace from=".radio_transceiver > .U2 > .GPIO13" to=".nfc > .U1 > .IRQ" />',
    '<trace from=".nfc > .U1 > .MOD" to=".nfc_level_shifter > .U1 > .OE" />',
    '<trace from=".nfc > .U1 > .SPI_MOSI" to=".nfc_level_shifter > .U1 > .IO_A1" />',
    '<trace from=".nfc > .U1 > .SPI_MISO" to=".nfc_level_shifter > .U1 > .IO_A2" />',
    '<trace from=".nfc_level_shifter > .U1 > .IO_B1" to=".ble_module > .U1 > .GPIO_DIO4" />',
    '<trace from=".nfc_level_shifter > .U1 > .IO_B2" to=".ble_module > .U1 > .GPIO_DIO5" />',
    '<trace from=".nfc > .U1 > .SYS_CLK" to=".authenticator > .U1 > .GPIO_PA0" />',
    '<trace from=".ble_module > .U1 > .GPIO_DIO7" to=".pmic > .U1 > .GPO2" />',
  ])
})
