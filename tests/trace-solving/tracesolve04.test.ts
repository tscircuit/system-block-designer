import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { mixedSidePortsSystem } from "./trace-solving-scenarios"

test("tracesolve04 snapshots mixed side port routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(mixedSidePortsSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
