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

test("system block desginer 01 TSX export includes one index file", () => {
  const { files } = systemJsonToTsxProject(
    createSystemBlockDesginer01SystemJson(),
  )

  expect(Object.keys(files)).toEqual(["index.circuit.tsx"])
  expect(files["index.circuit.tsx"]).toContain("@tsci/tscircuit.ti")
})
