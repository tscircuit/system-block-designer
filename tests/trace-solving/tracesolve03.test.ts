import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { compactFanoutSystem } from "./trace-solving-scenarios"

test("tracesolve03 snapshots compact fanout routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(compactFanoutSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
