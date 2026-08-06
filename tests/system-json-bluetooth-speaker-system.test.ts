import { expect, test } from "bun:test"
import { createBluetoothSpeakerSystemJson } from "../app/BluetoothSpeaker/createBluetoothSpeakerSystemJson"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

test("matches Bluetooth speaker system-block JSON snapshot", async () => {
  const bluetoothSpeakerSystem = createBluetoothSpeakerSystemJson()
  const snapshot = systemJsonToSvgSnapshot(bluetoothSpeakerSystem)
  const blocks = bluetoothSpeakerSystem.filter(
    (item) => item.type === "system_block",
  )
  const ports = bluetoothSpeakerSystem.filter(
    (item) => item.type === "system_port",
  )
  const connections = bluetoothSpeakerSystem.filter(
    (item) => item.type === "system_connection",
  )
  const portIds = new Set(ports.map((port) => port.system_port_id))

  expect(blocks.map((block) => block.subcircuit_id)).toEqual([
    "BluetoothAudioHost_MSP430F5229",
    "BluetoothController_CC2564C",
    "AudioAmplifier_TAS2505",
    "BatteryManagement_BQ24074",
    "PowerManagement_TPS7A2018",
  ])
  expect(blocks.every((block) => Boolean(block.part_number))).toBe(true)
  expect(connections).toHaveLength(27)
  expect(
    connections.every(
      (connection) =>
        connection.source_system_port_id !== undefined &&
        connection.target_system_port_id !== undefined &&
        portIds.has(connection.source_system_port_id) &&
        portIds.has(connection.target_system_port_id),
    ),
  ).toBe(true)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
