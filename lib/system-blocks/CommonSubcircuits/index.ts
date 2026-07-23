import { LibraryCategoryName } from "../../system-block-library/types"
import { SystemBlock } from "../SystemBlock"
import {
  createSubcircuitConfig,
  type SubcircuitDefinition,
  type SubcircuitSystemBlockConfig,
} from "../SubcircuitDefinition"

export const COMMON_SUBCIRCUIT_IMPORT_PATH = "@tscircuit/common"
export const COMMON_SUBCIRCUIT_SOURCE_DIRECTORY = "Experiments"

export const CommonSubcircuitDefinitions = {
  FlashMemory_W25Q128JVSIQ: {
    componentName: "FlashMemory_W25Q128JVSIQ",
    importPath: COMMON_SUBCIRCUIT_IMPORT_PATH,
    sourceDirectory: COMMON_SUBCIRCUIT_SOURCE_DIRECTORY,
    label: "QSPI Flash Memory",
    category: [LibraryCategoryName.Memory, "Flash"],
    partNumber: "W25Q128JVSIQ",
    description: "Winbond W25Q128JVSIQ 128-Mbit QSPI flash memory reference.",
    icon: "memory",
    size: { width: 220, height: 148 },
    interfaces: [
      {
        name: "SPI1",
        kind: "spi",
        spiPins: {
          CS: "U1.SPI_CS",
          SCLK: "U1.SPI_SCK",
          MOSI: "U1.SPI_MOSI",
          MISO: "U1.SPI_MISO",
        },
      },
      {
        name: "GPIO",
        kind: "gpio",
        gpioPins: {
          QSPI_SS: "U1.SPI_CS",
          QSPI_CLK: "U1.SPI_SCK",
        },
      },
    ],
    ports: {
      top: ["VCC"],
      bottom: ["GND"],
      left: ["QSPI_SS", "QSPI_CLK"],
      right: ["QSPI_SD0", "QSPI_SD1", "QSPI_SD2", "QSPI_SD3"],
    },
    connectionPortExpansions: {
      SPI: ["QSPI_SS", "QSPI_CLK", "QSPI_SD0", "QSPI_SD1"],
      QSPI: [
        "QSPI_SS",
        "QSPI_CLK",
        "QSPI_SD0",
        "QSPI_SD1",
        "QSPI_SD2",
        "QSPI_SD3",
      ],
    },
  },
} satisfies Record<string, SubcircuitDefinition>

export class FlashMemory_W25Q128JVSIQ extends SystemBlock {
  constructor(config: SubcircuitSystemBlockConfig = {}) {
    super(
      createSubcircuitConfig(
        CommonSubcircuitDefinitions.FlashMemory_W25Q128JVSIQ,
        config,
      ),
    )
  }
}

export const CommonSystemBlockClasses = {
  FlashMemory_W25Q128JVSIQ,
} as const

export type CommonSystemBlockName = keyof typeof CommonSystemBlockClasses
