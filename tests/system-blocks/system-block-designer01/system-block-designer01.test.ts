import { expect, test } from "bun:test"
import { createSystemBlockDesigner01SystemJson } from "../../../app/SystemBlockDesigner01/createSystemBlockDesigner01SystemJson"
import { systemJsonToSvgSnapshot } from "../../fixtures/system-json-to-svg-snapshot"

test("renders system block designer 01 system json snapshot", async () => {
  const snapshot = systemJsonToSvgSnapshot(
    createSystemBlockDesigner01SystemJson(),
  )

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
