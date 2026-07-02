import { expect, test } from "bun:test"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { nearCollinearLaneSystem } from "./trace-solving-scenarios"

test("tracesolve06 snapshots near collinear lane routing", async () => {
  const snapshot = systemJsonToSvgSnapshot(nearCollinearLaneSystem)

  expect(snapshot).toContain('d="M 250 211 L 470 211"')
  expect(snapshot).not.toContain('d="M 250 229 L 470 229"')
  expect(snapshot).toContain("L 274 292 Q 274 301")
  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
