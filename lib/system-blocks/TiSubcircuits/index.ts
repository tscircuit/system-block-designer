import { SystemBlock, type SystemBlockConfig } from "../SystemBlock"
import { LibraryCategoryName } from "../../system-block-library/types"
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
  category: readonly [LibraryCategoryName, string]
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
    category: [...definition.category],
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

function createGpioInterface(
  name: string,
  pinSelector: string,
): SystemBlockInterface {
  return {
    name,
    kind: "gpio",
    gpioPins: { GPIO: pinSelector },
  }
}

export const TiSubcircuitDefinitions = {
  BatteryManagement_BQ24074: {
    componentName: "BatteryManagement_BQ24074",
    label: "Battery Charger",
    category: [LibraryCategoryName.BatteryManagement, "Battery Charger"],
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
    category: [LibraryCategoryName.BatteryManagement, "Battery Charger"],
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
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
    category: [LibraryCategoryName.BatteryManagement, "Battery Monitor"],
    partNumber: "BQ27441-G1",
    description: "TI BQ27441-G1 single-cell battery fuel gauge.",
    icon: "monitor",
    size: { width: 220, height: 148 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
          GND: "U1.PGND",
        },
      },
      createGpioInterface("GPIO", "U1.GPIO_GPOUT"),
    ],
    ports: {
      top: ["PACKP", "VSYS"],
      bottom: ["PGND"],
      left: ["SDA", "SCL", "BIN"],
      right: ["GPOUT"],
    },
  },
  RealTimeClock_BQ32002: {
    componentName: "RealTimeClock_BQ32002",
    label: "Real-Time Clock",
    category: [LibraryCategoryName.ProcessingAndSecurity, "Real-Time Clock"],
    partNumber: "BQ32002",
    description: "TI BQ32002 real-time clock with I2C interface.",
    icon: "chip",
    size: { width: 200, height: 128 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
          VCC: "U1.VCC",
          GND: "U1.GND",
        },
      },
    ],
    ports: {
      top: ["VCC"],
      bottom: ["GND"],
      left: ["SCL", "SDA"],
      right: ["IRQ"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  WirelessMCU_CC2340R5: {
    componentName: "WirelessMCU_CC2340R5",
    label: "Bluetooth Wireless MCU",
    category: [LibraryCategoryName.Communication, "Wireless MCU"],
    partNumber: "CC2340R5",
    description: "TI CC2340R5 Bluetooth Low Energy wireless MCU reference.",
    icon: "antenna",
    size: { width: 360, height: 280 },
    interfaces: [
      createGpioInterface("DIO3", "U1.GPIO_DIO3"),
      createGpioInterface("DIO4", "U1.GPIO_DIO4"),
    ],
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
  WirelessMCU_CC2745R10: {
    componentName: "WirelessMCU_CC2745R10",
    label: "Bluetooth Wireless MCU",
    category: [LibraryCategoryName.Communication, "Wireless MCU"],
    partNumber: "CC2745R10",
    description: "TI CC2745R10 Bluetooth Low Energy wireless MCU reference.",
    icon: "antenna",
    size: { width: 400, height: 320 },
    interfaces: [
      createGpioInterface("DIO0", "U1.GPIO_DIO0"),
      createGpioInterface("DIO1", "U1.GPIO_DIO1"),
      createGpioInterface("DIO2", "U1.GPIO_DIO2"),
      createGpioInterface("DIO3", "U1.GPIO_DIO3"),
      createGpioInterface("DIO4", "U1.GPIO_DIO4"),
      createGpioInterface("DIO5", "U1.GPIO_DIO5"),
      createGpioInterface("DIO7", "U1.GPIO_DIO7"),
      createGpioInterface("DIO11", "U1.GPIO_DIO11"),
      createGpioInterface("DIO12", "U1.GPIO_DIO12"),
      createGpioInterface("DIO15", "U1.GPIO_DIO15"),
      createGpioInterface("DIO16", "U1.GPIO_DIO16"),
      createGpioInterface("DIO17", "U1.GPIO_DIO17"),
      createGpioInterface("DIO18", "U1.GPIO_DIO18"),
      createGpioInterface("DIO19", "U1.GPIO_DIO19"),
      createGpioInterface("DIO20", "U1.GPIO_DIO20"),
      createGpioInterface("DIO21", "U1.GPIO_DIO21"),
      createGpioInterface("DIO22", "U1.GPIO_DIO22"),
      createGpioInterface("DIO23", "U1.GPIO_DIO23"),
      createGpioInterface("DIO24", "U1.GPIO_DIO24"),
      createGpioInterface("DIO27", "U1.GPIO_DIO27"),
      createGpioInterface("DIO28", "U1.GPIO_DIO28"),
    ],
    ports: {
      top: ["WMCU_VDD", "VDDS", "VDDR", "VDDD"],
      bottom: ["GND"],
      left: [
        "DIO9_SWDIO",
        "DIO10_SWDCK",
        "DIO0",
        "DIO1",
        "DIO2",
        "DIO3",
        "DIO4",
        "DIO5",
        "DIO7",
        "DIO11",
        "DIO12",
        "DIO15",
        "DIO16",
      ],
      right: [
        "DIO17",
        "DIO18",
        "DIO19",
        "DIO20",
        "DIO21",
        "DIO22",
        "DIO23",
        "DIO24",
        "DIO27",
        "DIO28",
        "RF_TEST",
        "RF_FEED",
        "X32P",
        "X32N",
        "X48P",
        "X48N",
      ],
    },
    connectionPortExpansions: {
      SWD: ["DIO9_SWDIO", "DIO10_SWDCK"],
      RF: ["RF_TEST", "RF_FEED"],
    },
  },
  WirelessMCU_CC3235SF: {
    componentName: "WirelessMCU_CC3235SF",
    label: "Wi-Fi Wireless MCU",
    category: [LibraryCategoryName.Communication, "Wireless MCU"],
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
      createGpioInterface("SFL_CLK", "U2.FLASH_SPI_CLK"),
      createGpioInterface("P01_GPIO_10", "U2.GPIO10"),
      createGpioInterface("P02_GPIO_11", "U2.GPIO11"),
      createGpioInterface("P03_GPIO_12", "U2.GPIO12"),
      createGpioInterface("P04_GPIO_13", "U2.GPIO13"),
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
    category: [LibraryCategoryName.MotorDriver, "H-Bridge"],
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
    category: [LibraryCategoryName.MotorDriver, "H-Bridge"],
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
    category: [LibraryCategoryName.Sensor, "Environmental Sensor"],
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
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
    category: [LibraryCategoryName.Sensor, "Environmental Sensor"],
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
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
    category: [LibraryCategoryName.Sensor, "Environmental Sensor"],
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
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
    category: [LibraryCategoryName.Power, "Power Monitor"],
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
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
    category: [LibraryCategoryName.ProcessingAndSecurity, "MCU"],
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
      createGpioInterface("PA0", "U1.GPIO_PA0"),
      createGpioInterface("PA1", "U1.GPIO_PA1"),
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
  Microcontroller_MSPM33C3x: {
    componentName: "Microcontroller_MSPM33C3x",
    label: "Microcontroller",
    category: [LibraryCategoryName.ProcessingAndSecurity, "MCU"],
    partNumber: "MSPM33C3x",
    description: "TI MSPM33C3x basic microcontroller application reference.",
    icon: "chip",
    size: { width: 200, height: 128 },
    ports: {
      top: ["V3_3"],
      bottom: ["GND"],
      left: ["NRST", "SWDIO", "SWCLK"],
    },
    connectionPortExpansions: {
      SWD: ["SWDIO", "SWCLK"],
    },
  },
  LEDDriver_TLC59116: {
    componentName: "LEDDriver_TLC59116",
    label: "LED Driver",
    category: [LibraryCategoryName.Power, "LED Driver"],
    partNumber: "TLC59116",
    description: "TI TLC59116 16-channel I2C constant-current LED driver.",
    icon: "power",
    size: { width: 220, height: 140 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U3.I2C_SDA",
          SCL: "U3.I2C_SCL",
          VCC: "U3.VDD",
          GND: "U3.GND",
        },
      },
    ],
    ports: {
      top: ["VIN_5V", "V3_3"],
      bottom: ["GND"],
      left: ["SCL", "SDA", "RESET"],
    },
    connectionPortExpansions: {
      I2C: ["SCL", "SDA"],
    },
  },
  TemperatureSensor_TMP1075: {
    componentName: "TemperatureSensor_TMP1075",
    label: "Temperature Sensor",
    category: [LibraryCategoryName.Sensor, "Temperature Sensor"],
    partNumber: "TMP1075",
    description: "TI TMP1075 digital temperature sensor with I2C interface.",
    icon: "sensor",
    size: { width: 180, height: 112 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
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
  TemperatureSensor_TMP1827: {
    componentName: "TemperatureSensor_TMP1827",
    label: "Multidrop Temperature Sensor",
    category: [LibraryCategoryName.Sensor, "Temperature Sensor"],
    partNumber: "TMP1827",
    description: "TI TMP1827 two-device single-wire multidrop reference.",
    icon: "sensor",
    size: { width: 200, height: 128 },
    ports: {
      top: ["VDD"],
      bottom: ["GND"],
      left: ["SDQ_BUS"],
    },
  },
  LoadSwitch_TPS22919: {
    componentName: "LoadSwitch_TPS22919",
    label: "Load Switch",
    category: [LibraryCategoryName.Power, "Load Switch"],
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
    category: [LibraryCategoryName.Power, "Buck Converter"],
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
  BoostConverter_TPS61299X: {
    componentName: "BoostConverter_TPS61299X",
    label: "Boost Converter",
    category: [LibraryCategoryName.Power, "Boost Converter"],
    partNumber: "TPS61299X",
    description: "TI TPS61299X synchronous boost converter reference.",
    icon: "power",
    size: { width: 200, height: 128 },
    ports: {
      top: ["VIN", "VOUT_5V"],
      bottom: ["GND"],
      left: ["EN"],
      right: ["SW"],
    },
  },
  BuckBoostConverter_TPS63802: {
    componentName: "BuckBoostConverter_TPS63802",
    label: "Buck-Boost Converter",
    category: [LibraryCategoryName.Power, "Buck-Boost Converter"],
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
    category: [LibraryCategoryName.Power, "LDO"],
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
  PowerManagement_TPS6521835: {
    componentName: "PowerManagement_TPS6521835",
    label: "Power Management IC",
    category: [LibraryCategoryName.Power, "PMIC"],
    partNumber: "TPS6521835",
    description: "TI TPS6521835 multi-rail power-management reference.",
    icon: "power",
    size: { width: 320, height: 240 },
    interfaces: [
      {
        name: "I2C1",
        kind: "i2c",
        i2cPins: {
          SDA: "U1.I2C_SDA",
          SCL: "U1.I2C_SCL",
        },
      },
      createGpioInterface("GPO2", "U1.GPO2"),
    ],
    ports: {
      top: ["IN_BIAS", "IN_BU", "IN_LS1", "IN_LS2", "IN_LS3", "VDD", "VIO"],
      bottom: ["GND"],
      left: ["PB", "PFI", "PWR_EN", "IN_nCC", "PGOOD_BU", "GPO2"],
      right: [
        "DCDC1_OUT",
        "DCDC2_OUT",
        "DCDC3_OUT",
        "DCDC4_OUT",
        "DCDC5_OUT",
        "DCDC6_OUT",
        "INT_LDO",
      ],
    },
  },
  PowerModule_TPSM82823: {
    componentName: "PowerModule_TPSM82823",
    label: "Power Module",
    category: [LibraryCategoryName.Power, "Buck Module"],
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
  LevelShifter_TXB0104: {
    componentName: "LevelShifter_TXB0104",
    label: "4-Bit Level Shifter",
    category: [LibraryCategoryName.Communication, "Level Shifter"],
    partNumber: "TXB0104",
    description: "TI TXB0104 four-bit bidirectional voltage-level shifter.",
    icon: "shifter",
    size: { width: 220, height: 148 },
    interfaces: [
      createGpioInterface("A1", "U1.IO_A1"),
      createGpioInterface("A2", "U1.IO_A2"),
      createGpioInterface("A3", "U1.IO_A3"),
      createGpioInterface("A4", "U1.IO_A4"),
      createGpioInterface("B1", "U1.IO_B1"),
      createGpioInterface("B2", "U1.IO_B2"),
      createGpioInterface("B3", "U1.IO_B3"),
      createGpioInterface("B4", "U1.IO_B4"),
    ],
    ports: {
      top: ["V1_8", "V3_3"],
      bottom: ["GND"],
      left: ["A1", "A2", "A3", "A4"],
      right: ["B1", "B2", "B3", "B4"],
    },
    connectionPortExpansions: {
      A: ["A1", "A2", "A3", "A4"],
      B: ["B1", "B2", "B3", "B4"],
    },
  },
  LevelShifter_TXS0102: {
    componentName: "LevelShifter_TXS0102",
    label: "2-Bit Level Shifter",
    category: [LibraryCategoryName.Communication, "Level Shifter"],
    partNumber: "TXS0102",
    description: "TI TXS0102 two-bit bidirectional voltage-level shifter.",
    icon: "shifter",
    size: { width: 200, height: 136 },
    interfaces: [
      createGpioInterface("OE", "U1.OE"),
      createGpioInterface("A1", "U1.IO_A1"),
      createGpioInterface("A2", "U1.IO_A2"),
      createGpioInterface("B1", "U1.IO_B1"),
      createGpioInterface("B2", "U1.IO_B2"),
    ],
    ports: {
      top: ["V1_8", "V3_3"],
      bottom: ["GND"],
      left: ["OE", "A1", "A2"],
      right: ["B1", "B2"],
    },
    connectionPortExpansions: {
      A: ["A1", "A2"],
      B: ["B1", "B2"],
    },
  },
  RFIDReader_TRF7960: {
    componentName: "RFIDReader_TRF7960",
    label: "RFID/NFC Transceiver",
    category: [LibraryCategoryName.Communication, "NFC"],
    partNumber: "TRF7960",
    description: "TI TRF7960 RFID/NFC transceiver module reference.",
    icon: "nfc",
    size: { width: 300, height: 220 },
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
      createGpioInterface("EN", "U1.EN"),
      createGpioInterface("DATA_CLK", "U1.SPI_SCK"),
      createGpioInterface("IRQ", "U1.IRQ"),
      createGpioInterface("MOD", "U1.MOD"),
      createGpioInterface("MOSI", "U1.SPI_MOSI"),
      createGpioInterface("MISO", "U1.SPI_MISO"),
      createGpioInterface("SYS_CLK", "U1.SYS_CLK"),
    ],
    ports: {
      top: ["VIN_5V", "VIN_3V3"],
      bottom: ["GND"],
      left: [
        "EN",
        "EN2",
        "SLAVE_SELECT",
        "DATA_CLK",
        "MOSI",
        "MISO",
        "IRQ",
        "MOD",
        "SYS_CLK",
        "ASK_OOK",
      ],
      right: ["RF_50", "ANT_FEED"],
    },
    connectionPortExpansions: {
      SPI: ["SLAVE_SELECT", "DATA_CLK", "MOSI", "MISO"],
      RF: ["RF_50", "ANT_FEED"],
    },
  },
  FlashMemory_W25Q128JVSIQ: {
    componentName: "FlashMemory_W25Q128JVSIQ",
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
      createGpioInterface("QSPI_SS", "U1.SPI_CS"),
      createGpioInterface("QSPI_CLK", "U1.SPI_SCK"),
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

export class RealTimeClock_BQ32002 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.RealTimeClock_BQ32002,
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

export class WirelessMCU_CC2745R10 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.WirelessMCU_CC2745R10,
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

export class Microcontroller_MSPM33C3x extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.Microcontroller_MSPM33C3x,
        config,
      ),
    )
  }
}

export class LEDDriver_TLC59116 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.LEDDriver_TLC59116,
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

export class TemperatureSensor_TMP1827 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.TemperatureSensor_TMP1827,
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

export class BoostConverter_TPS61299X extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.BoostConverter_TPS61299X,
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

export class PowerManagement_TPS6521835 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.PowerManagement_TPS6521835,
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

export class LevelShifter_TXB0104 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.LevelShifter_TXB0104,
        config,
      ),
    )
  }
}

export class LevelShifter_TXS0102 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.LevelShifter_TXS0102,
        config,
      ),
    )
  }
}

export class RFIDReader_TRF7960 extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.RFIDReader_TRF7960,
        config,
      ),
    )
  }
}

export class FlashMemory_W25Q128JVSIQ extends SystemBlock {
  constructor(config: TiSystemBlockConfig = {}) {
    super(
      createTiSubcircuitConfig(
        TiSubcircuitDefinitions.FlashMemory_W25Q128JVSIQ,
        config,
      ),
    )
  }
}

export const TiSystemBlockClasses = {
  BatteryManagement_BQ24074,
  BatteryManagement_BQ25895,
  BatteryManagement_BQ27441G1,
  RealTimeClock_BQ32002,
  WirelessMCU_CC2340R5,
  WirelessMCU_CC2745R10,
  WirelessMCU_CC3235SF,
  MotorDriver_DRV8833,
  MotorDriver_DRV8876,
  EnvironmentalSensor_HDC2080,
  EnvironmentalSensor_HDC3020,
  EnvironmentalSensor_HDC3022,
  PowerMonitor_INA237,
  Microcontroller_MSPM0G3507,
  Microcontroller_MSPM33C3x,
  LEDDriver_TLC59116,
  TemperatureSensor_TMP1075,
  TemperatureSensor_TMP1827,
  LoadSwitch_TPS22919,
  BuckConverter_TPS62933,
  BoostConverter_TPS61299X,
  BuckBoostConverter_TPS63802,
  PowerManagement_TPS7A02,
  PowerManagement_TPS6521835,
  PowerModule_TPSM82823,
  LevelShifter_TXB0104,
  LevelShifter_TXS0102,
  RFIDReader_TRF7960,
  FlashMemory_W25Q128JVSIQ,
} as const

export type TiSystemBlockName = keyof typeof TiSystemBlockClasses
export type TiSystemBlockClass =
  (typeof TiSystemBlockClasses)[TiSystemBlockName]
