import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../app/SmartLock/createSmartLockSystemJson"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

test("matches smart lock system-block json snapshot", async () => {
  const smartLockSystem = createSmartLockSystemJson()
  const snapshot = systemJsonToSvgSnapshot(smartLockSystem)

  const blocks = smartLockSystem.filter((item) => item.type === "system_block")
  const ports = smartLockSystem.filter((item) => item.type === "system_port")
  const connections = smartLockSystem.filter(
    (item) => item.type === "system_connection",
  )
  const portIds = new Set(ports.map((port) => port.system_port_id))
  const portSideCounts = Object.fromEntries(
    blocks.map((block) => {
      const blockPorts = ports.filter(
        (port) => port.system_block_id === block.system_block_id,
      )
      return [
        block.system_block_id,
        Object.fromEntries(
          (["top", "right", "bottom", "left"] as const)
            .map((side) => [
              side,
              blockPorts.filter((port) => port.side_of_block === side).length,
            ])
            .filter(([, count]) => count > 0),
        ),
      ]
    }),
  )

  expect(blocks.map((block) => block.subcircuit_id)).toEqual([
    "WirelessMCU_CC3235SF",
    "LevelShifter_TXB0104",
    "WirelessMCU_CC2745R10",
    "FlashMemory_W25Q128JVSIQ",
    "RFIDReader_TRF7960",
    "LevelShifter_TXS0102",
    "Microcontroller_MSPM0G3507",
    "PowerManagement_TPS6521835",
  ])
  expect(blocks.every((block) => Boolean(block.part_number))).toBe(true)
  expect(portSideCounts).toEqual({
    radio_transceiver: { right: 2, bottom: 3, left: 1 },
    radio_level_shifter: { top: 1, right: 2, left: 3 },
    ble_module: { right: 2, bottom: 2, left: 4 },
    flash: { bottom: 1, left: 2 },
    nfc: { top: 3, right: 3, bottom: 2 },
    nfc_level_shifter: { right: 2, bottom: 1, left: 4 },
    authenticator: { right: 1, left: 1 },
    pmic: { top: 2, left: 1 },
  })
  expect(connections).toHaveLength(25)
  expect(
    connections.every(
      (connection) =>
        connection.source_system_port_id !== undefined &&
        connection.target_system_port_id !== undefined &&
        portIds.has(connection.source_system_port_id) &&
        portIds.has(connection.target_system_port_id),
    ),
  ).toBe(true)

  expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
