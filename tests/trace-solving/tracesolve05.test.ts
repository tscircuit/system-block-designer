import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { overlappingTopLaneSystem } from "./trace-solving-scenarios"

test("tracesolve05 snapshots overlapping top lane routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(overlappingTopLaneSystem)

  expect(snapshot).toContain('data-system-connection-id="i2c_monitor"')
  expect(snapshot).toContain('data-system-connection-id="i2c_sensor"')
  expect(snapshot).not.toContain('d="M 380 260 L 485 260')
  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
