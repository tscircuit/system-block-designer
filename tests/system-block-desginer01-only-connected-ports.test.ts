import { expect, test } from "bun:test"
import { createSystemBlockDesginer01SystemJson } from "../app/SystemBlockDesginer01/createSystemBlockDesginer01SystemJson"

test("system block desginer 01 only emits ports used by connections", () => {
  const systemJson = createSystemBlockDesginer01SystemJson()
  const ports = systemJson.filter((item) => item.type === "system_port")
  const connections = systemJson.filter(
    (item) => item.type === "system_connection",
  )
  const connectedPortIds = new Set(
    connections.flatMap((connection) => [
      connection.source_system_port_id,
      connection.target_system_port_id,
      ...(connection.system_port_ids ?? []),
    ]),
  )

  expect(ports.map((port) => port.system_port_id).sort()).toEqual([
    "controller_pa0",
    "controller_pa1",
    "power_monitor_scl",
    "sensor_scl",
  ])
  expect(ports.every((port) => connectedPortIds.has(port.system_port_id))).toBe(
    true,
  )
})
