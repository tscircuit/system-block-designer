import { updateConnectionPaths } from "../../components/DesignCanvas/systemJsonCanvas"
import type { SystemBlock as SystemBlockInstance } from "../../lib/system-blocks/SystemBlock"
import {
  AudioAmplifier_TAS2505,
  BatteryManagement_BQ24074,
  BluetoothAudioHost_MSP430F5229,
  BluetoothController_CC2564C,
  PowerManagement_TPS7A2018,
} from "../../lib/system-blocks/TiSubcircuits"
import type {
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../../lib/system-json/system-json"

const SYSTEM_DIAGRAM_ID = "bluetooth_speaker_system"

export function createBluetoothSpeakerSystemJson(): SystemJson[] {
  const host = new BluetoothAudioHost_MSP430F5229({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "bluetooth_host",
    tsxInstanceName: "bluetooth_host",
    subcircuitId: "BluetoothAudioHost_MSP430F5229",
    center: { x: 210, y: 190 },
    size: { width: 260, height: 220 },
  })
  const controller = new BluetoothController_CC2564C({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "bluetooth_controller",
    tsxInstanceName: "bluetooth_controller",
    subcircuitId: "BluetoothController_CC2564C",
    center: { x: 600, y: 190 },
    size: { width: 260, height: 220 },
  })
  const amplifier = new AudioAmplifier_TAS2505({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "audio_amplifier",
    tsxInstanceName: "audio_amplifier",
    subcircuitId: "AudioAmplifier_TAS2505",
    center: { x: 990, y: 210 },
    size: { width: 260, height: 220 },
  })
  const charger = new BatteryManagement_BQ24074({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "battery_charger",
    tsxInstanceName: "battery_charger",
    subcircuitId: "BatteryManagement_BQ24074",
    center: { x: 260, y: 590 },
    size: { width: 220, height: 160 },
  })
  const power = new PowerManagement_TPS7A2018({
    systemDiagramId: SYSTEM_DIAGRAM_ID,
    systemBlockId: "power_1v8",
    tsxInstanceName: "power_1v8",
    subcircuitId: "PowerManagement_TPS7A2018",
    center: { x: 650, y: 590 },
    size: { width: 200, height: 140 },
  })

  const blocks = [
    systemBlockJson(host, "MSP430 Bluetooth Audio Host"),
    systemBlockJson(controller, "CC2564C Bluetooth Controller"),
    systemBlockJson(amplifier, "TAS2505 Speaker Amplifier"),
    systemBlockJson(charger, "Li-ion Battery Charger"),
    systemBlockJson(power, "1.8 V Logic Power"),
  ]
  const ports = [
    ...systemPorts(host, [
      ["bluetooth_host_cc_hci_tx", "right"],
      ["bluetooth_host_cc_hci_rx", "right"],
      ["bluetooth_host_cc_hci_rts", "right"],
      ["bluetooth_host_cc_hci_cts", "right"],
      ["bluetooth_host_cc_n_shutd", "right"],
      ["bluetooth_host_cc_slow_clk", "right"],
      ["bluetooth_host_i2_c_scl", "bottom"],
      ["bluetooth_host_audio_reset", "bottom"],
      ["bluetooth_host_vcc_5229", "top"],
      ["bluetooth_host_dvio_1_v8", "top"],
      ["bluetooth_host_gnd", "bottom"],
    ]),
    ...systemPorts(controller, [
      ["bluetooth_controller_hci_tx", "left"],
      ["bluetooth_controller_hci_rx", "left"],
      ["bluetooth_controller_hci_rts", "left"],
      ["bluetooth_controller_hci_cts", "left"],
      ["bluetooth_controller_n_shutd", "left"],
      ["bluetooth_controller_slow_clk", "left"],
      ["bluetooth_controller_aud_clk", "right"],
      ["bluetooth_controller_aud_fsync", "right"],
      ["bluetooth_controller_aud_out", "right"],
      ["bluetooth_controller_vbat", "top"],
      ["bluetooth_controller_vdd_io", "top"],
      ["bluetooth_controller_vcc_1_v8_32_k", "top"],
      ["bluetooth_controller_gnd", "bottom"],
    ]),
    ...systemPorts(amplifier, [
      ["audio_amplifier_bclk", "left"],
      ["audio_amplifier_wclk", "left"],
      ["audio_amplifier_mclk", "left"],
      ["audio_amplifier_din", "left"],
      ["audio_amplifier_i2_c_scl", "left"],
      ["audio_amplifier_n_rst", "left"],
      ["audio_amplifier_svdd", "top"],
      ["audio_amplifier_avdd", "top"],
      ["audio_amplifier_dvdd", "top"],
      ["audio_amplifier_iovdd", "top"],
      ["audio_amplifier_spkp", "right"],
      ["audio_amplifier_spkm", "right"],
      ["audio_amplifier_gnd", "bottom"],
    ]),
    ...systemPorts(charger, [
      ["battery_charger_out", "right"],
      ["battery_charger_gnd", "bottom"],
    ]),
    ...systemPorts(power, [
      ["power_1v8_vin", "left"],
      ["power_1v8_en", "left"],
      ["power_1v8_vout_1_v8", "right"],
      ["power_1v8_gnd", "bottom"],
    ]),
  ]

  return updateConnectionPaths([
    {
      type: "system_diagram",
      system_diagram_id: SYSTEM_DIAGRAM_ID,
      name: "Bluetooth Speaker — CC2564C + MSP430F5229 + TAS2505",
      description:
        "Battery-powered Bluetooth audio sink using reusable TI subcircuits.",
    },
    ...blocks,
    ...ports,
    connection(
      "charger_to_ldo",
      "battery_charger_out",
      "power_1v8_vin",
      "VBAT",
    ),
    connection(
      "charger_to_ldo_enable",
      "battery_charger_out",
      "power_1v8_en",
      "ENABLE",
    ),
    connection(
      "charger_to_controller",
      "battery_charger_out",
      "bluetooth_controller_vbat",
      "VBAT",
    ),
    connection(
      "charger_to_amplifier",
      "battery_charger_out",
      "audio_amplifier_svdd",
      "VBAT",
    ),
    connection(
      "logic_to_controller",
      "power_1v8_vout_1_v8",
      "bluetooth_controller_vdd_io",
      "1.8 V",
    ),
    connection(
      "logic_to_controller_clock",
      "power_1v8_vout_1_v8",
      "bluetooth_controller_vcc_1_v8_32_k",
      "1.8 V",
    ),
    connection(
      "logic_to_host_dvio",
      "power_1v8_vout_1_v8",
      "bluetooth_host_dvio_1_v8",
      "1.8 V",
    ),
    connection(
      "logic_to_host_vcc",
      "power_1v8_vout_1_v8",
      "bluetooth_host_vcc_5229",
      "1.8 V",
    ),
    connection(
      "logic_to_amplifier_avdd",
      "power_1v8_vout_1_v8",
      "audio_amplifier_avdd",
      "1.8 V",
    ),
    connection(
      "logic_to_amplifier_dvdd",
      "power_1v8_vout_1_v8",
      "audio_amplifier_dvdd",
      "1.8 V",
    ),
    connection(
      "logic_to_amplifier_iovdd",
      "power_1v8_vout_1_v8",
      "audio_amplifier_iovdd",
      "1.8 V",
    ),
    connection(
      "hci_tx",
      "bluetooth_controller_hci_tx",
      "bluetooth_host_cc_hci_tx",
      "HCI UART",
    ),
    connection(
      "hci_rx",
      "bluetooth_controller_hci_rx",
      "bluetooth_host_cc_hci_rx",
      "HCI UART",
    ),
    connection(
      "hci_rts",
      "bluetooth_controller_hci_rts",
      "bluetooth_host_cc_hci_rts",
      "HCI UART",
    ),
    connection(
      "hci_cts",
      "bluetooth_controller_hci_cts",
      "bluetooth_host_cc_hci_cts",
      "HCI UART",
    ),
    connection(
      "shutdown",
      "bluetooth_host_cc_n_shutd",
      "bluetooth_controller_n_shutd",
      "CONTROL",
    ),
    connection(
      "slow_clock",
      "bluetooth_host_cc_slow_clk",
      "bluetooth_controller_slow_clk",
      "32.768 kHz",
    ),
    connection(
      "audio_i2c",
      "bluetooth_host_i2_c_scl",
      "audio_amplifier_i2_c_scl",
      "I2C",
    ),
    connection(
      "audio_reset",
      "bluetooth_host_audio_reset",
      "audio_amplifier_n_rst",
      "RESET",
    ),
    connection(
      "audio_bclk",
      "bluetooth_controller_aud_clk",
      "audio_amplifier_bclk",
      "PCM BCLK",
    ),
    connection(
      "audio_mclk",
      "bluetooth_controller_aud_clk",
      "audio_amplifier_mclk",
      "PCM MCLK",
    ),
    connection(
      "audio_wclk",
      "bluetooth_controller_aud_fsync",
      "audio_amplifier_wclk",
      "PCM WCLK",
    ),
    connection(
      "audio_data",
      "bluetooth_controller_aud_out",
      "audio_amplifier_din",
      "PCM DATA",
    ),
    connection("ground_ldo", "battery_charger_gnd", "power_1v8_gnd", "GND"),
    connection(
      "ground_host",
      "battery_charger_gnd",
      "bluetooth_host_gnd",
      "GND",
    ),
    connection(
      "ground_controller",
      "battery_charger_gnd",
      "bluetooth_controller_gnd",
      "GND",
    ),
    connection(
      "ground_amplifier",
      "battery_charger_gnd",
      "audio_amplifier_gnd",
      "GND",
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
    throw new Error(`Bluetooth speaker block ${displayLabel} did not render`)
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
      throw new Error(`Bluetooth speaker port ${systemPortId} did not render`)
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
    system_connection_id: `bluetooth_speaker_${id}`,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label,
  }
}
