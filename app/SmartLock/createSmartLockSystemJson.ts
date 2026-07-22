import { updateConnectionPaths } from "../../components/DesignCanvas/systemJsonCanvas"
import type { SystemBlock as SystemBlockInstance } from "../../lib/system-blocks/SystemBlock"
import {
  FlashMemory_W25Q128JVSIQ,
  LevelShifter_TXB0104,
  LevelShifter_TXS0102,
  Microcontroller_MSPM0G3507,
  PowerManagement_TPS6521835,
  RFIDReader_TRF7960,
  WirelessMCU_CC2745R10,
  WirelessMCU_CC3235SF,
} from "../../lib/system-blocks/TiSubcircuits"
import type {
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../../lib/system-json/system-json"

const SYSTEM_DIAGRAM_ID = "system_diagram_0"

export function createSmartLockSystemJson(): SystemJson[] {
  const radio = new WirelessMCU_CC3235SF({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "radio_transceiver",
    tsxInstanceName: "radio_transceiver",
    subcircuitId: "WirelessMCU_CC3235SF",
    center: { x: 132, y: 132 },
    size: { width: 144, height: 144 },
  })
  const radioLevelShifter = new LevelShifter_TXB0104({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "radio_level_shifter",
    tsxInstanceName: "radio_level_shifter",
    subcircuitId: "LevelShifter_TXB0104",
    center: { x: 632, y: 112 },
    size: { width: 144, height: 136 },
  })
  const bleModule = new WirelessMCU_CC2745R10({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "ble_module",
    tsxInstanceName: "ble_module",
    subcircuitId: "WirelessMCU_CC2745R10",
    center: { x: 1088, y: 260 },
    size: { width: 300, height: 218 },
  })
  const flash = new FlashMemory_W25Q128JVSIQ({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "flash",
    tsxInstanceName: "flash",
    subcircuitId: "FlashMemory_W25Q128JVSIQ",
    center: { x: 1398, y: 220 },
    size: { width: 144, height: 144 },
  })
  const nfc = new RFIDReader_TRF7960({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "nfc",
    tsxInstanceName: "nfc",
    subcircuitId: "RFIDReader_TRF7960",
    center: { x: 132, y: 422 },
    size: { width: 144, height: 144 },
  })
  const nfcLevelShifter = new LevelShifter_TXS0102({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "nfc_level_shifter",
    tsxInstanceName: "nfc_level_shifter",
    subcircuitId: "LevelShifter_TXS0102",
    center: { x: 632, y: 412 },
    size: { width: 144, height: 136 },
  })
  const authenticator = new Microcontroller_MSPM0G3507({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "authenticator",
    tsxInstanceName: "authenticator",
    subcircuitId: "Microcontroller_MSPM0G3507",
    center: { x: 392, y: 562 },
    size: { width: 144, height: 136 },
  })
  const pmic = new PowerManagement_TPS6521835({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "pmic",
    tsxInstanceName: "pmic",
    subcircuitId: "PowerManagement_TPS6521835",
    center: { x: 1088, y: 782 },
    size: { width: 144, height: 144 },
  })

  const blocks = [
    systemBlockJson(radio, "Radio Transceiver"),
    systemBlockJson(radioLevelShifter, "Level Shifter"),
    systemBlockJson(bleModule, "BLE Module"),
    systemBlockJson(flash, "Flash"),
    systemBlockJson(nfc, "NFC"),
    systemBlockJson(nfcLevelShifter, "Signal Level Shift"),
    systemBlockJson(authenticator, "Authenticator"),
    systemBlockJson(pmic, "PMIC"),
  ]
  const ports = [
    ...systemPorts(radio, [
      ["radio_transceiver_vbat_cc", "left"],
      ["radio_transceiver_sfl_clk", "right"],
      ["radio_transceiver_p01_gpio_10", "right"],
      ["radio_transceiver_p02_gpio_11", "bottom"],
      ["radio_transceiver_p03_gpio_12", "bottom"],
      ["radio_transceiver_p04_gpio_13", "bottom"],
    ]),
    ...systemPorts(radioLevelShifter, [
      ["radio_level_shifter_a1", "left"],
      ["radio_level_shifter_a2", "left"],
      ["radio_level_shifter_v1_8", "left"],
      ["radio_level_shifter_b1", "right"],
      ["radio_level_shifter_b2", "right"],
      ["radio_level_shifter_v3_3", "top"],
    ]),
    ...systemPorts(bleModule, [
      ["ble_module_dio0", "left"],
      ["ble_module_dio1", "left"],
      ["ble_module_dio4", "left"],
      ["ble_module_dio5", "left"],
      ["ble_module_dio2", "right"],
      ["ble_module_dio3", "right"],
      ["ble_module_wmcu_vdd", "bottom"],
      ["ble_module_dio7", "bottom"],
    ]),
    ...systemPorts(flash, [
      ["flash_qspi_clk", "left"],
      ["flash_qspi_ss", "left"],
      ["flash_vcc", "bottom"],
    ]),
    ...systemPorts(nfc, [
      ["nfc_en", "top"],
      ["nfc_data_clk", "top"],
      ["nfc_irq", "top"],
      ["nfc_mod", "right"],
      ["nfc_mosi", "right"],
      ["nfc_miso", "right"],
      ["nfc_vin_3_v3", "bottom"],
      ["nfc_sys_clk", "bottom"],
    ]),
    ...systemPorts(nfcLevelShifter, [
      ["nfc_level_shifter_oe", "left"],
      ["nfc_level_shifter_a1", "left"],
      ["nfc_level_shifter_a2", "left"],
      ["nfc_level_shifter_v1_8", "left"],
      ["nfc_level_shifter_b1", "right"],
      ["nfc_level_shifter_b2", "right"],
      ["nfc_level_shifter_v3_3", "bottom"],
    ]),
    ...systemPorts(authenticator, [
      ["authenticator_pa0", "left"],
      ["authenticator_vdd", "right"],
    ]),
    ...systemPorts(pmic, [
      ["pmic_dcdc2_out", "left"],
      ["pmic_dcdc1_out", "top"],
      ["pmic_gpo2", "top"],
    ]),
  ]

  return updateConnectionPaths([
    {
      type: "system_diagram",
      system_diagram_id: SYSTEM_DIAGRAM_ID,
      name: "Smart Lock (UWB Smart Lock)",
    },
    ...blocks,
    ...ports,
    connection(
      "radio_spi",
      "radio_transceiver_sfl_clk",
      "radio_level_shifter_a1",
      "SPI",
    ),
    connection(
      "radio_gpio",
      "radio_transceiver_p01_gpio_10",
      "radio_level_shifter_a2",
      "GPIO",
    ),
    connection(
      "shifted_radio_spi",
      "radio_level_shifter_b1",
      "ble_module_dio0",
      "SPI",
    ),
    connection(
      "shifted_radio_gpio",
      "radio_level_shifter_b2",
      "ble_module_dio1",
      "GPIO",
    ),
    connection("flash_spi", "ble_module_dio2", "flash_qspi_clk", "SPI"),
    connection("flash_gpio", "ble_module_dio3", "flash_qspi_ss", "GPIO"),
    connection(
      "radio_nfc_gpio_1",
      "radio_transceiver_p02_gpio_11",
      "nfc_en",
      "GPIO",
    ),
    connection(
      "radio_nfc_spi",
      "radio_transceiver_p03_gpio_12",
      "nfc_data_clk",
      "SPI",
    ),
    connection(
      "radio_nfc_gpio_2",
      "radio_transceiver_p04_gpio_13",
      "nfc_irq",
      "GPIO",
    ),
    connection("nfc_shift_oe", "nfc_mod", "nfc_level_shifter_oe", "GPIO"),
    connection("nfc_shift_data_1", "nfc_mosi", "nfc_level_shifter_a1", "GPIO"),
    connection("nfc_shift_data_2", "nfc_miso", "nfc_level_shifter_a2", "GPIO"),
    connection(
      "shifted_nfc_gpio_1",
      "nfc_level_shifter_b1",
      "ble_module_dio4",
      "GPIO",
    ),
    connection(
      "shifted_nfc_gpio_2",
      "nfc_level_shifter_b2",
      "ble_module_dio5",
      "GPIO",
    ),
    connection("authenticator_i2c", "nfc_sys_clk", "authenticator_pa0", "I2C"),
    connection("pmic_i2c", "ble_module_dio7", "pmic_gpo2", "I2C"),
    connection(
      "radio_supply",
      "pmic_dcdc2_out",
      "radio_transceiver_vbat_cc",
      "SUPPLY",
    ),
    connection(
      "radio_shifter_supply",
      "pmic_dcdc2_out",
      "radio_level_shifter_v3_3",
      "SUPPLY",
    ),
    connection(
      "radio_shifter_logic_supply",
      "pmic_dcdc2_out",
      "radio_level_shifter_v1_8",
      "SUPPLY",
    ),
    connection("ble_supply", "pmic_dcdc1_out", "ble_module_wmcu_vdd", "SUPPLY"),
    connection("flash_supply", "pmic_dcdc1_out", "flash_vcc", "SUPPLY"),
    connection("nfc_supply", "pmic_dcdc2_out", "nfc_vin_3_v3", "SUPPLY"),
    connection(
      "nfc_shifter_supply",
      "pmic_dcdc1_out",
      "nfc_level_shifter_v3_3",
      "SUPPLY",
    ),
    connection(
      "nfc_shifter_logic_supply",
      "pmic_dcdc2_out",
      "nfc_level_shifter_v1_8",
      "SUPPLY",
    ),
    connection(
      "authenticator_supply",
      "pmic_dcdc2_out",
      "authenticator_vdd",
      "SUPPLY",
    ),
  ])
}

function systemBlockJson(
  block: SystemBlockInstance,
  displayLabel: string,
): SystemBlock {
  const systemBlock = block
    .getSystemBlockJson()
    .find((item): item is SystemBlock => item.type === "system_block")

  if (!systemBlock) {
    throw new Error(`TI smart-lock block ${displayLabel} did not render`)
  }

  return { ...systemBlock, label: displayLabel }
}

function systemPorts(
  block: SystemBlockInstance,
  layout: Array<
    readonly [systemPortId: string, side: SystemPort["side_of_block"]]
  >,
): SystemPort[] {
  const portsById = new Map(
    block
      .getSystemPortJson(layout.map(([systemPortId]) => systemPortId))
      .map((port) => [port.system_port_id, port]),
  )

  return layout.map(([systemPortId, side]) => {
    const port = portsById.get(systemPortId)
    if (!port) {
      throw new Error(`TI smart-lock port ${systemPortId} did not render`)
    }

    return { ...port, side_of_block: side }
  })
}

function connection(
  id: string,
  sourcePortId: string,
  targetPortId: string,
  label: string,
): SystemConnection {
  return {
    type: "system_connection",
    system_diagram_id: SYSTEM_DIAGRAM_ID,
    system_connection_id: `smart_lock_${id}`,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label,
  }
}
