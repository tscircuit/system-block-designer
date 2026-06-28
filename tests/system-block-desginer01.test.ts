import { expect, test } from "bun:test"
import { createSystemBlockDesginer01SystemJson } from "../app/SystemBlockDesginer01/createSystemBlockDesginer01SystemJson"
import { systemJsonToTsxProject } from "../lib/system-blocks/systemJsonToTsx"
import { systemJsonToSvgSnapshot } from "./fixtures/system-json-to-svg-snapshot"

test("renders system block desginer 01 system json snapshot", async () => {
  const snapshot = systemJsonToSvgSnapshot(
    createSystemBlockDesginer01SystemJson(),
  )

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})

test("system block desginer 01 TSX zip project includes chips and subcircuits", () => {
  const { files } = systemJsonToTsxProject(
    createSystemBlockDesginer01SystemJson(),
  )

  expect(Object.keys(files).sort()).toEqual([
    "chips/HDC3020.tsx",
    "chips/MSPM0G3507.tsx",
    "index.circuit.tsx",
    "subcircuits/EnvironmentalSensor_HDC3020.tsx",
    "subcircuits/Microcontroller_MSPM0G3507.tsx",
  ])
})
