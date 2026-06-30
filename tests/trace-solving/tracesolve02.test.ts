import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { crossingBusesSystem } from "./trace-solving-scenarios"

test("tracesolve02 snapshots crossing bus routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(crossingBusesSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
