import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { obstacleAvoidanceSystem } from "./trace-solving-scenarios"

test("tracesolve01 snapshots obstacle avoidance routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(obstacleAvoidanceSystem)

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
