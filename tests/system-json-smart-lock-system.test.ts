import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../lib/design-system/seed"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

test("matches smart lock system-block json snapshot", async () => {
  const smartLockSystem = createSmartLockSystemJson()
  const snapshot = systemJsonToSvgSnapshot(smartLockSystem)

  expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
