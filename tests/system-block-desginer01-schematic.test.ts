import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { createSystemBlockDesginer01SystemJson } from "../app/SystemBlockDesginer01/createSystemBlockDesginer01SystemJson"
import { systemJsonToTsx } from "../lib/system-blocks/systemJsonToTsx"
import { renderTsxToCircuitJson } from "./fixtures/render-tsx-to-circuit-json"

test("system block desginer 01 circuit json renders to schematic snapshot", async () => {
  const systemJson = createSystemBlockDesginer01SystemJson()
  const i2cConnections = systemJson.filter(
    (item) => item.type === "system_connection" && item.label === "i2c",
  )
  expect(i2cConnections).toHaveLength(2)

  const tsx = systemJsonToTsx(systemJson)
  const circuitJson = await renderTsxToCircuitJson(tsx)

  const schematicSvg = convertCircuitJsonToSchematicSvg(circuitJson as any)

  await expect(schematicSvg).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
