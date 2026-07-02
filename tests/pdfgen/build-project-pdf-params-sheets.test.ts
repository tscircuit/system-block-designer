import { expect, test } from "bun:test"
import { createSystemBlockDesigner01SystemJson } from "../../app/SystemBlockDesigner01/createSystemBlockDesigner01SystemJson"
import { buildProjectPdfParams } from "../../components/OutputFiles/createProjectPdf"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemBlock } from "../../lib/system-json/system-json"
import { renderTsxToCircuitJson } from "../fixtures/render-tsx-to-circuit-json"

test("buildProjectPdfParams renders one schematic page per sheet", async () => {
  const systemJson = createSystemBlockDesigner01SystemJson()
  const blockCount = systemJson.filter(
    (item): item is SystemBlock => item.type === "system_block",
  ).length

  const tsx = systemJsonToTsx(systemJson)
  const circuitJson = (await renderTsxToCircuitJson(tsx)) as Array<
    Record<string, unknown>
  >

  const sheets = circuitJson.filter((e) => e.type === "schematic_sheet")
  expect(sheets.length).toBe(blockCount)

  const params = buildProjectPdfParams(systemJson, circuitJson)
  // One schematic page per sheet, each carrying a distinct rendered SVG.
  const schematicPages = (params.schematicSheetSvgs ?? []).map((sheet) =>
    typeof sheet === "string" ? { svg: sheet, title: undefined } : sheet,
  )

  expect(schematicPages).toHaveLength(sheets.length)
  expect(schematicPages.map((page) => page.title)).toEqual([
    "Schematics - Block 1 - MSPM0G3507",
    "Schematics - Block 2 - HDC3020",
    "Schematics - Block 3 - INA237",
  ])

  for (const page of schematicPages) {
    expect(page.svg).toContain('class="schematic-sheet"')
  }
}, 90_000)
