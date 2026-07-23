import { expect, test } from "bun:test"
import {
  FlashMemory_W25Q128JVSIQ,
  RFIDReader_TRF7960,
} from "../../lib/system-blocks/TiSubcircuits"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createTiInterfaceSnapshot } from "./fixtures/create-ti-interface-snapshot"

test("TI SPI connection renders block diagram and schematic snapshots", async () => {
  const systemDiagramId = "system_diagram_0"
  const source = new RFIDReader_TRF7960({
    systemDiagramId,
    systemBlockId: "reader",
    center: { x: 180, y: 180 },
  })
  const target = new FlashMemory_W25Q128JVSIQ({
    systemDiagramId,
    systemBlockId: "flash",
    center: { x: 580, y: 180 },
  })
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "SPI interface test",
      width: 760,
      height: 360,
    },
    ...source.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "reader_spi",
      system_block_id: "reader",
      label: "SPI",
      side_of_block: "right",
    },
    ...target.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "flash_spi",
      system_block_id: "flash",
      label: "SPI",
      side_of_block: "left",
    },
    {
      type: "system_connection",
      system_diagram_id: systemDiagramId,
      system_connection_id: "spi_connection",
      source_system_port_id: "reader_spi",
      target_system_port_id: "flash_spi",
      system_port_ids: ["reader_spi", "flash_spi"],
      path: [
        { x: 330, y: 180 },
        { x: 366, y: 180 },
        { x: 434, y: 180 },
        { x: 470, y: 180 },
      ],
      label: "SPI",
    },
  ]

  const { blockDiagramSvg, schematicSvg, tsx } =
    await createTiInterfaceSnapshot(systemJson)

  expect(tsx).toContain(
    '<trace from=".reader > .U1 > .SPI_CS" to=".flash > .U1 > .SPI_CS" />',
  )
  expect(tsx).toContain(
    '<trace from=".reader > .U1 > .SPI_SCK" to=".flash > .U1 > .SPI_SCK" />',
  )
  expect(tsx).toContain(
    '<trace from=".reader > .U1 > .SPI_MOSI" to=".flash > .U1 > .SPI_MOSI" />',
  )
  expect(tsx).toContain(
    '<trace from=".reader > .U1 > .SPI_MISO" to=".flash > .U1 > .SPI_MISO" />',
  )
  await expect(blockDiagramSvg).toMatchSvgSnapshot(
    import.meta.path,
    "block-diagram",
  )
  await expect(schematicSvg).toMatchSvgSnapshot(import.meta.path, "schematic")
}, 60_000)
