import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import {
  buildProjectPdfParams,
  getProjectFileName,
} from "../../components/OutputFiles/createProjectPdf"

test("buildProjectPdfParams maps system json onto pdf pages", () => {
  const systemJson = createSmartLockSystemJson()
  const params = buildProjectPdfParams(systemJson, null)

  expect(params.titlePage?.type).toBe("title")
  expect(params.projectDetailsPage?.details?.Blocks).toBeGreaterThan(0)
  expect(params.systemArchitecturePage?.systemJson).toBe(systemJson)
  expect(params.technicalSpecificationsPage?.rows?.length).toBeGreaterThan(0)
  // Without circuit json there is no schematic sheet to embed.
  expect(params.schematicSheetSvgs).toBeUndefined()
})

test("getProjectFileName produces a filesystem-safe slug", () => {
  const fileName = getProjectFileName(createSmartLockSystemJson())
  expect(fileName).toMatch(/^[a-z0-9-]+$/)
})
