import { SystemBlock, type SystemBlockConfig } from "../SystemBlock"

export class EnvironmentalSensor_HDC2080 extends SystemBlock {
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
      systemBlockId: config.systemBlockId ?? "environmental_sensor_hdc2080",
      center: config.center,
      size: config.size ?? { width: 180, height: 112 },
      tsxInstanceName: config.tsxInstanceName,
      label: "Environmental Sensor",
      category: ["Sensor", "Environmental Sensor"],
      componentName: "EnvironmentalSensor_HDC2080",
      icon: "sensor",
      partNumber: "HDC2080",
      description:
        "TI HDC2080 temperature and humidity sensor with I2C interface.",
      ports: [
        { name: "VDD", sideOfBlock: "top" },
        { name: "GND", sideOfBlock: "bottom" },
        { name: "SCL", sideOfBlock: "left" },
        { name: "SDA", sideOfBlock: "left" },
        { name: "ADDR", sideOfBlock: "right" },
        { name: "DRDY_INT", sideOfBlock: "right" },
      ],
    })
  }
}
