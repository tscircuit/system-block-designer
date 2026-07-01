import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import type { BomViewRow } from "../../lib/bom/types"
import { buildProjectPdfParams } from "../../components/OutputFiles/createProjectPdf"

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
  const params = buildProjectPdfParams(systemJson, null, bomRows)

  expect(params.titlePage?.type).toBe("title")
  expect(params.projectDetailsPage?.details?.Blocks).toBeGreaterThan(0)
  expect(params.projectDetailsPage?.details?.["BOM Rows"]).toBe(1)
  expect(params.systemArchitecturePage?.systemJson).toBe(systemJson)
  expect(params.technicalSpecificationsPage?.rows?.length).toBeGreaterThan(0)
  expect(params.bomPage?.rows).toEqual(bomRows)
  // Without circuit json there is no schematic sheet to embed.
  expect(params.schematicSheetSvgs).toBeUndefined()
})
