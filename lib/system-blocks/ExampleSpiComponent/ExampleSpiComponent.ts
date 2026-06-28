import { SystemBlock, type SystemBlockConfig } from "../SystemBlock"

export class ExampleSpiComponent extends SystemBlock {
  constructor(
    config: Partial<
      Pick<
        SystemBlockConfig,
        | "systemDiagramId"
        | "systemBlockId"
        | "center"
        | "size"
        | "tsxInstanceName"
      >
    > = {},
  ) {
    super({
      systemDiagramId: config.systemDiagramId,
      systemBlockId: config.systemBlockId ?? "example_spi_component",
      center: config.center,
      size: config.size ?? { width: 160, height: 96 },
      tsxInstanceName: config.tsxInstanceName,
      label: "Example SPI Component",
      category: ["Example", "SPI"],
      componentName: "ExampleSpiComponent",
      icon: "chip",
      description:
        "Example system block showing how a single SPI system port expands to concrete tscircuit pins.",
      ports: [{ name: "SPI", sideOfBlock: "right" }],
      connectionPortExpansions: {
        SPI: ["SCK", "MOSI", "MISO", "CS"],
      },
    })
  }
}
