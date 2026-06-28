import { expect, test } from "bun:test"
import { ExampleSpiComponent } from "../../lib/system-blocks/ExampleSpiComponent/ExampleSpiComponent"

test("ExampleSpiComponent expands SPI-to-SPI connections into concrete tsx pin connections", () => {
  const spiController = new ExampleSpiComponent({
    systemBlockId: "spi_controller",
    tsxInstanceName: "spiController",
  })
  const spiPeripheral = new ExampleSpiComponent({
    systemBlockId: "spi_peripheral",
    tsxInstanceName: "spiPeripheral",
  })

  spiPeripheral.setConnection("SPI", [
    { systemBlock: spiController, portName: "SPI" },
  ])

  expect(spiPeripheral.getTsxFile()).toMatchInlineSnapshot(
    `"<ExampleSpiComponent connections={{ SCK: \"spiController.SCK\", MOSI: \"spiController.MOSI\", MISO: \"spiController.MISO\", CS: \"spiController.CS\" }} />"`,
  )
})
