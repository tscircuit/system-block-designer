import { expect, test } from "bun:test"
import { convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"
import { createSystemBlockDesigner01SystemJson } from "../../../app/SystemBlockDesigner01/createSystemBlockDesigner01SystemJson"
import { systemJsonToTsx } from "../../../lib/system-blocks/systemJsonToTsx"
import { renderTsxToCircuitJson } from "../../fixtures/render-tsx-to-circuit-json"

test("system block designer 01 circuit json renders to schematic snapshot", async () => {
  const systemJson = createSystemBlockDesigner01SystemJson()
  const i2cConnections = systemJson.filter(
    (item) => item.type === "system_connection" && item.label === "i2c",
  )
  expect(i2cConnections).toHaveLength(2)

  const tsx = systemJsonToTsx(systemJson)
  const circuitJson = await renderTsxToCircuitJson(tsx)

  const schematicSvg = convertCircuitJsonToStackedSchematicSheetsSvg(
    circuitJson as any,
  )

  await expect(schematicSvg).toMatchSvgSnapshot(import.meta.path)
}, 60_000)
