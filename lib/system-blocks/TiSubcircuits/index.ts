import { SystemBlock, type SystemBlockConfig } from "../SystemBlock"
import type { SystemBlockInterface } from "../../system-json/system-json"

type TiSystemBlockConfig = Partial<
  Pick<
    SystemBlockConfig,
    | "systemDiagramId"
    | "systemBlockId"
    | "center"
    | "size"
    | "tsxInstanceName"
    | "subcircuitId"
    | "schSheetName"
  >
>

type PortSide = "top" | "bottom" | "left" | "right"

export interface TiSubcircuitDefinition {
  componentName: string
  label: string
  category: string[]
  partNumber: string
  description: string
  icon: string
  size?: SystemBlockConfig["size"]
  interfaces?: SystemBlockInterface[]
  ports: Partial<Record<PortSide, string[]>>
  connectionPortExpansions?: Record<string, string[]>
}

function createTiSubcircuitConfig(
  definition: TiSubcircuitDefinition,
  config: TiSystemBlockConfig,
): SystemBlockConfig {
  return {
    systemDiagramId: config.systemDiagramId,
    systemBlockId:
      config.systemBlockId ?? toSnakeCase(definition.componentName),
    center: config.center,
    size: config.size ?? definition.size ?? { width: 200, height: 128 },
    tsxInstanceName: config.tsxInstanceName,
    subcircuitId: config.subcircuitId,
    schSheetName: config.schSheetName,
    label: definition.label,
    category: definition.category,
    componentName: definition.componentName,
    icon: definition.icon,
    partNumber: definition.partNumber,
    description: definition.description,
    interfaces: definition.interfaces,
    ports: Object.entries(definition.ports).flatMap(([sideOfBlock, names]) =>
      (names ?? []).map((name) => ({
        name,
        sideOfBlock: sideOfBlock as PortSide,
      })),
    ),
    connectionPortExpansions: definition.connectionPortExpansions,
  }
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
}

export const TiSubcircuitDefinitions = {
  BatteryManagement_BQ24074: {
    componentName: "BatteryManagement_BQ24074",
    label: "Battery Charger",
    category: ["Battery Management", "Battery Charger"],
    partNumber: "BQ24074",
    description: "TI BQ24074 single-cell Li-ion linear battery charger.",
    icon: "battery2",
    size: { width: 220, height: 148 },
    ports: {
      top: ["IN", "OUT", "BAT"],
      bottom: ["GND"],
      left: ["TS", "ILIM", "ISET", "ITERM"],
      right: ["N_CHG_LED", "N_CHG_LED_A", "N_PGOOD_LED", "N_PGOOD_LED_A"],
    },
  },
  BatteryManagement_BQ25895: {
    componentName: "BatteryManagement_BQ25895",
    label: "Switch-Mode Battery Charger",
    category: ["Battery Management", "Battery Charger"],
    partNumber: "BQ25895",
    description:
      "TI BQ25895 I2C-controlled single-cell switch-mode battery charger.",
    icon: "battery2",
    size: { width: 260, height: 184 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VBUS", "PMID", "SYS", "BAT"],
      bottom: ["GND"],
      left: ["D_POS", "D_NEG", "SDA", "SCL", "INT"],
      right: ["VREF", "ILIM", "OTG", "CE", "QON", "TS"],
    },
  },
  BatteryManagement_BQ27441G1: {
    componentName: "BatteryManagement_BQ27441G1",
    label: "Battery Fuel Gauge",
    category: ["Battery Management", "Battery Monitor"],
    partNumber: "BQ27441-G1",
    description: "TI BQ27441-G1 single-cell battery fuel gauge.",
    icon: "monitor",
    size: { width: 220, height: 148 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          GND: "U1.PGND",
        },
      },
    ],
    ports: {
      top: ["PACKP", "VSYS"],
      bottom: ["PGND"],
      left: ["SDA", "SCL", "BIN"],
      right: ["GPOUT"],
    },
  },
  WirelessMCU_CC2340R5: {
    componentName: "WirelessMCU_CC2340R5",
    label: "Bluetooth Wireless MCU",
    category: ["Communication", "Wireless MCU"],
    partNumber: "CC2340R5",
    description: "TI CC2340R5 Bluetooth Low Energy wireless MCU reference.",
    icon: "antenna",
    size: { width: 360, height: 280 },
    ports: {
      top: ["VDDS", "VDDR", "WMCU_VDD"],
      bottom: ["GND"],
      left: ["WMCU_RESET", "WMCU_SWDIO", "WMCU_SWDCK", "DIO3", "DIO4"],
      right: [
        "ANT_RF",
        "SMA_RF",
        "RF_B",
        "RF_D",
        "RF_E",
        "X32P",
        "X32N",
        "X48P",
        "X48N",
      ],
    },
    connectionPortExpansions: {
      SWD: ["WMCU_SWDIO", "WMCU_SWDCK"],
      RF: ["ANT_RF", "SMA_RF"],
    },
  },
  WirelessMCU_CC3235SF: {
    componentName: "WirelessMCU_CC3235SF",
    label: "Wi-Fi Wireless MCU",
    category: ["Communication", "Wireless MCU"],
    partNumber: "CC3235SF",
    description: "TI CC3235SF SimpleLink Wi-Fi wireless MCU reference.",
    icon: "antenna",
    size: { width: 460, height: 360 },
    interfaces: [
      {
        name: "SPI_FLASH",
        kind: "spi",
        spiPins: {
          CS: "U2.FLASH_SPI_CS",
          SCLK: "U2.FLASH_SPI_CLK",
          MOSI: "U2.FLASH_SPI_DOUT",
          MISO: "U2.FLASH_SPI_DIN",
        },
      },
    ],
    ports: {
      top: [
        "VBAT_CC",
        "VDD_ANA",
        "VDD_ANA2",
        "VDD_DIG",
        "VDD_PA",
        "VDD_PLL",
        "VDD_RAM",
      ],
      bottom: ["GND"],
      left: [
        "CC_nRESET",
        "A_RX",
        "A_TX",
        "SFL_CS",
        "SFL_CLK",
        "SFL_DIN",
        "SFL_DOUT",
        "SOP0",
        "SOP1",
        "SOP2",
      ],
      right: [
        "P01_GPIO_10",
        "P02_GPIO_11",
        "P03_GPIO_12",
        "P04_GPIO_13",
        "P05_GPIO_14",
        "P06_GPIO_15",
        "P07_GPIO_16",
        "P08_GPIO_17",
        "P15_GPIO_22",
        "P16_JTAG_TDI",
        "P17_JTAG_TDO",
        "P18_GPIO_28",
        "P19_JTAG_TCK",
        "P20_JTAG_TMS",
        "P50_GPIO_00",
        "P53_GPIO_30",
        "P55_GPIO_01",
        "P57_GPIO_02",
        "P58_GPIO_03",
        "P59_GPIO_04",
        "P60_GPIO_05",
        "P61_GPIO_06",
        "P62_GPIO_07",
        "P63_GPIO_08",
        "P64_GPIO_09",
        "RF_BG",
      ],
    },
    connectionPortExpansions: {
      SPI_FLASH: ["SFL_CS", "SFL_CLK", "SFL_DIN", "SFL_DOUT"],
      UART: ["A_RX", "A_TX"],
      JTAG: ["P16_JTAG_TDI", "P17_JTAG_TDO", "P19_JTAG_TCK", "P20_JTAG_TMS"],
      SOP: ["SOP0", "SOP1", "SOP2"],
    },
  },
  MotorDriver_DRV8833: {
    componentName: "MotorDriver_DRV8833",
    label: "Dual H-Bridge Motor Driver",
    category: ["Motor Driver", "H-Bridge"],
    partNumber: "DRV8833",
    description: "TI DRV8833 low-voltage dual H-bridge motor driver.",
    icon: "power",
    size: { width: 200, height: 136 },
    ports: {
      top: ["VM"],
      bottom: ["GND"],
      left: ["IN1", "IN2"],
      right: ["MOTOR_A", "MOTOR_B"],
    },
    connectionPortExpansions: {
      MOTOR: ["MOTOR_A", "MOTOR_B"],
    },
  },
  MotorDriver_DRV8876: {
    componentName: "MotorDriver_DRV8876",
    label: "H-Bridge Motor Driver",
    category: ["Motor Driver", "H-Bridge"],
    partNumber: "DRV8876",
    description:
      "TI DRV8876 brushed DC motor driver with current feedback and fault output.",
    icon: "power",
    size: { width: 220, height: 152 },
    ports: {
      top: ["VM", "VCC", "VREF"],
      bottom: ["GND"],
      left: ["PWM", "PH", "nSLEEP", "ADC"],
      right: ["OUT1", "OUT2", "nFAULT"],
    },
    connectionPortExpansions: {
      MOTOR: ["OUT1", "OUT2"],
      CONTROL: ["PWM", "PH", "nSLEEP", "nFAULT", "ADC"],
    },
  },
  EnvironmentalSensor_HDC2080: {
    componentName: "EnvironmentalSensor_HDC2080",
    label: "Environmental Sensor",
    category: ["Sensor", "Environmental Sensor"],
    partNumber: "HDC2080",
    description:
      "TI HDC2080 temperature and humidity sensor with I2C interface.",
    icon: "sensor",
    size: { width: 180, height: 112 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          VCC: "U1.VDD",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["ADDR", "DRDY_INT"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  EnvironmentalSensor_HDC3020: {
    componentName: "EnvironmentalSensor_HDC3020",
    label: "Environmental Sensor",
    category: ["Sensor", "Environmental Sensor"],
    partNumber: "HDC3020",
    description:
      "TI HDC3020 temperature and humidity sensor with I2C interface.",
    icon: "sensor",
    size: { width: 180, height: 112 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          VCC: "U1.VDD",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["ALERT"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  EnvironmentalSensor_HDC3022: {
    componentName: "EnvironmentalSensor_HDC3022",
    label: "Environmental Sensor",
    category: ["Sensor", "Environmental Sensor"],
    partNumber: "HDC3022",
    description:
      "TI HDC3022 temperature and humidity sensor with I2C interface.",
    icon: "sensor",
    size: { width: 180, height: 112 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          VCC: "U1.VDD",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["ALERT"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  PowerMonitor_INA237: {
    componentName: "PowerMonitor_INA237",
    label: "Power Monitor",
    category: ["Power", "Power Monitor"],
    partNumber: "INA237",
    description:
      "TI INA237 high-precision current, voltage, and power monitor.",
    icon: "monitor",
    size: { width: 220, height: 148 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          VCC: "U1.VS",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VS", "BUS_HIGH", "LOAD_CHARGER"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["N_ALERT"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  Microcontroller_MSPM0G3507: {
    componentName: "Microcontroller_MSPM0G3507",
    label: "Microcontroller",
    category: ["Processing & Security", "MCU"],
    partNumber: "MSPM0G3507",
    description: "TI MSPM0G3507 Arm Cortex-M0+ microcontroller reference.",
    icon: "chip",
    size: { width: 220, height: 156 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.PA1",
          SCL: "U1.PA0",
          VCC: "U1.VDD",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["NRST", "SWDIO", "SWCLK"],
      right: ["PA0", "PA1"],
    },
    connectionPortExpansions: {
      SWD: ["SWDIO", "SWCLK"],
      GPIO: ["PA0", "PA1"],
    },
  },
  TemperatureSensor_TMP1075: {
    componentName: "TemperatureSensor_TMP1075",
    label: "Temperature Sensor",
    category: ["Sensor", "Temperature Sensor"],
    partNumber: "TMP1075",
    description: "TI TMP1075 digital temperature sensor with I2C interface.",
    icon: "sensor",
    size: { width: 180, height: 112 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.SDA",
          SCL: "U1.SCL",
          VCC: "U1.VDD",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["ALERT"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  LoadSwitch_TPS22919: {
    componentName: "LoadSwitch_TPS22919",
    label: "Load Switch",
    category: ["Power", "Load Switch"],
    partNumber: "TPS22919",
    description: "TI TPS22919 5.5-V load switch reference.",
    icon: "power",
    size: { width: 180, height: 120 },
    ports: {
      top: ["IN"],
      bottom: ["GND"],
      left: ["ON"],
      right: ["OUT", "QOD"],
    },
  },
  BuckConverter_TPS62933: {
    componentName: "BuckConverter_TPS62933",
    label: "Buck Converter",
    category: ["Power", "Buck Converter"],
    partNumber: "TPS62933",
    description: "TI TPS62933 high-efficiency synchronous buck converter.",
    icon: "power",
    size: { width: 220, height: 148 },
    ports: {
      top: ["VIN", "VOUT"],
      bottom: ["GND"],
      left: ["EN_DIV", "FB_COMP"],
      right: ["SW", "FB"],
    },
  },
  BuckBoostConverter_TPS63802: {
    componentName: "BuckBoostConverter_TPS63802",
    label: "Buck-Boost Converter",
    category: ["Power", "Buck-Boost Converter"],
    partNumber: "TPS63802",
    description: "TI TPS63802 high-efficiency buck-boost converter reference.",
    icon: "power",
    size: { width: 220, height: 132 },
    ports: {
      top: ["VIN", "VOUT"],
      bottom: ["GND"],
      left: ["EN", "MODE"],
      right: ["PG", "FB"],
    },
  },
  PowerManagement_TPS7A02: {
    componentName: "PowerManagement_TPS7A02",
    label: "Low-Dropout Regulator",
    category: ["Power", "LDO"],
    partNumber: "TPS7A02",
    description: "TI TPS7A02 low-IQ low-dropout voltage regulator.",
    icon: "power",
    size: { width: 180, height: 120 },
    ports: {
      top: ["IN", "OUT"],
      bottom: ["GND"],
      left: ["EN"],
      right: ["LOAD"],
    },
  },
  PowerModule_TPSM82823: {
    componentName: "PowerModule_TPSM82823",
    label: "Power Module",
    category: ["Power", "Buck Module"],
    partNumber: "TPSM82823",
    description: "TI TPSM82823 step-down converter power module.",
    icon: "power",
    size: { width: 200, height: 128 },
    ports: {
      top: ["Vin", "Vout"],
      bottom: ["GND"],
      left: ["PG"],
      right: ["FB"],
    },
  },
} satisfies Record<string, TiSubcircuitDefinition>

export class BatteryManagement_BQ24074 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BatteryManagement_BQ24074,
        config,
      ),
    )
  }
}

export class BatteryManagement_BQ25895 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BatteryManagement_BQ25895,
        config,
      ),
    )
  }
}

export class BatteryManagement_BQ27441G1 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BatteryManagement_BQ27441G1,
        config,
      ),
    )
  }
}

export class WirelessMCU_CC2340R5 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.WirelessMCU_CC2340R5,
        config,
      ),
    )
  }
}

export class WirelessMCU_CC3235SF extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.WirelessMCU_CC3235SF,
        config,
      ),
    )
  }
}

export class MotorDriver_DRV8833 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.MotorDriver_DRV8833,
        config,
      ),
    )
  }
}

export class MotorDriver_DRV8876 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.MotorDriver_DRV8876,
        config,
      ),
    )
  }
}

export class EnvironmentalSensor_HDC2080 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.EnvironmentalSensor_HDC2080,
        config,
      ),
    )
  }
}

export class EnvironmentalSensor_HDC3020 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.EnvironmentalSensor_HDC3020,
        config,
      ),
    )
  }
}

export class EnvironmentalSensor_HDC3022 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.EnvironmentalSensor_HDC3022,
        config,
      ),
    )
  }
}

export class PowerMonitor_INA237 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.PowerMonitor_INA237,
        config,
      ),
    )
  }
}

export class Microcontroller_MSPM0G3507 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.Microcontroller_MSPM0G3507,
        config,
      ),
    )
  }
}

export class TemperatureSensor_TMP1075 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.TemperatureSensor_TMP1075,
        config,
      ),
    )
  }
}

export class LoadSwitch_TPS22919 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.LoadSwitch_TPS22919,
        config,
      ),
    )
  }
}

export class BuckConverter_TPS62933 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BuckConverter_TPS62933,
        config,
      ),
    )
  }
}

export class BuckBoostConverter_TPS63802 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BuckBoostConverter_TPS63802,
        config,
      ),
    )
  }
}

export class PowerManagement_TPS7A02 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.PowerManagement_TPS7A02,
        config,
      ),
    )
  }
}

export class PowerModule_TPSM82823 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.PowerModule_TPSM82823,
        config,
      ),
    )
  }
}

export const TiSystemBlockClasses = {
  BatteryManagement_BQ24074,
  BatteryManagement_BQ25895,
  BatteryManagement_BQ27441G1,
  WirelessMCU_CC2340R5,
  WirelessMCU_CC3235SF,
  MotorDriver_DRV8833,
  MotorDriver_DRV8876,
  EnvironmentalSensor_HDC2080,
  EnvironmentalSensor_HDC3020,
  EnvironmentalSensor_HDC3022,
  PowerMonitor_INA237,
  Microcontroller_MSPM0G3507,
  TemperatureSensor_TMP1075,
  LoadSwitch_TPS22919,
  BuckConverter_TPS62933,
  BuckBoostConverter_TPS63802,
  PowerManagement_TPS7A02,
  PowerModule_TPSM82823,
} as const

export type TiSystemBlockName = keyof typeof TiSystemBlockClasses
export type TiSystemBlockClass =
  (typeof TiSystemBlockClasses)[TiSystemBlockName]
