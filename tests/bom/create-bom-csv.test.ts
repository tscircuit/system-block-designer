import { expect, test } from "bun:test"
import { createBomCsv } from "../../lib/bom/createBomCsv"
import type { BomViewRow } from "../../lib/bom/types"

const rows: BomViewRow[] = [
  {
    manufacturer: "Texas Instruments",
    mpn: "ABC123",
    packageName: "QFN-32",
    value: "3.3 V",
    quantity: "2",
    functionalBlock: "Power, Control",
    partName: 'Primary "Controller"',
    lifecycle: "Active",
    unitPrice: "1.25 USD",
    stock: "2,500",
  },
  {
    manufacturer: "Texas Instruments",
    mpn: "LM1117",
    packageName: "SOT-223",
    value: "5 V",
    quantity: "1",
    functionalBlock: "Power",
    partName: "LDO",
    lifecycle: "Active",
    unitPrice: "0.15 USD",
    stock: "10,000",
  },
]

test("createBomCsv builds consolidated BOM csv", () => {
  const csv = createBomCsv(rows, "Consolidated")

  expect(csv).toContain("Manufacturer,MPN,Package,Value,Quantity,Functional Block(s),Part Name,Lifecycle,Est. Unit Price,Est. Stock")
  expect(csv).toContain('"Power, Control"')
  expect(csv).toContain('"Primary ""Controller"""')
})

test("createBomCsv expands grouped-by-subsystem rows", () => {
  const csv = createBomCsv(rows, "Grouped by subsystem")
  const lines = csv.trim().split("\n")

  expect(lines).toHaveLength(4)
  expect(lines[1]).toContain(",Control,")
  expect(lines[2]).toContain(",Power,")
  expect(lines[3]).toContain(",Power,")
})
