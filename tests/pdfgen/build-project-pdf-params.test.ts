import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import type { BomViewRow } from "../../lib/bom/types"
import { buildProjectPdfParams } from "../../components/OutputFiles/createProjectPdf"
import { formatProjectPdfExportedOn } from "../../components/OutputFiles/formatProjectPdfExportedOn"

test("buildProjectPdfParams maps system json onto pdf pages", () => {
  const systemJson = createSmartLockSystemJson()
  const bomRows: BomViewRow[] = [
    {
      referenceDesignators: "U1",
      manufacturer: "Texas Instruments",
      mpn: "CC2340R5",
      packageName: "QFN-32",
      value: "2.4 GHz MCU",
      quantity: "1",
      functionalBlock: "BLE Module",
      partName: "Wireless MCU",
      description: "Wireless MCU, 2.4 GHz, BLE",
      lifecycle: "Active",
      unitPrice: "2.84 USD",
      stock: "18,500",
    },
  ]
  const exportedAt = new Date("2026-06-25T21:06:00.000Z")
  const expectedExportedOn = formatProjectPdfExportedOn(exportedAt)
  const params = buildProjectPdfParams(systemJson, null, bomRows, {
    exportedAt,
  })

  expect(params.titlePage?.type).toBe("title")
  expect(params.titlePage?.date).toBe(expectedExportedOn)
  expect(params.projectDetailsPage?.entries?.[0]).toEqual({
    label: "Project name",
    value: "Smart Lock (UWB Smart Lock)",
  })
  expect(params.projectDetailsPage?.entries?.[1]?.value).toBe(
    "Communication, Memory, Processing & Security, Power",
  )
  expect(params.projectDetailsPage?.entries?.[2]?.value).toBe("Security")
  expect(params.projectDetailsPage?.entries?.[5]?.value).toBe(
    expectedExportedOn,
  )
  expect(params.projectDetailsPage?.disclaimer).toBe(
    "Project Title, Project Description, and Block Diagram may be AI-Generated. Schematics, BOM, and Components are not AI-Generated.",
  )
  expect(params.systemArchitecturePage?.systemJson).toBe(systemJson)
  expect(params.technicalSpecificationsPage?.rows?.length).toBeGreaterThan(0)
  expect(params.bomPage?.rows).toEqual(bomRows)
  // Without circuit json there is no schematic sheet to embed.
  expect(params.schematicSheetSvgs).toBeUndefined()
})
