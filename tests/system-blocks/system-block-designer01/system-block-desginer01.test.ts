import { expect, test } from "bun:test"
import { createSystemBlockDesginer01SystemJson } from "../../../app/SystemBlockDesginer01/createSystemBlockDesginer01SystemJson"
import { systemJsonToSvgSnapshot } from "../../fixtures/system-json-to-svg-snapshot"

test("renders system block desginer 01 system json snapshot", async () => {
  const snapshot = systemJsonToSvgSnapshot(
    createSystemBlockDesginer01SystemJson(),
  )

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
