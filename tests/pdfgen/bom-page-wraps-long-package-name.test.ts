import { expect, test } from "bun:test"
import type { BomViewRow } from "../../lib/bom/types"
import { createPdf } from "../../lib/pdfgen/createPdf"

const bomRows: BomViewRow[] = [
  {
    referenceDesignators: "R1",
    manufacturer: "Texas Instruments",
    mpn: "0402WGF1003TCE",
    packageName: "res0402",
    value: "100k",
    quantity: "1",
    functionalBlock: "Microcontroller",
    partName: "0402WGF1003TCE 100k res0402",
    description: "Resistor, 100k, 0402",
    lifecycle: "Active",
    unitPrice: "0.0005 USD",
    stock: "15,436,416",
  },
  {
    referenceDesignators: "J1",
    manufacturer: "Texas Instruments",
    mpn: "2.54-1*2P",
    packageName: "pinrow2_p2.54_female",
    value: "—",
    quantity: "1",
    functionalBlock: "Microcontroller",
    partName: "2.54-1*2P female pinrow2_p2.54_female",
    description: "2-pin female pin header with a long package name",
    lifecycle: "Active",
    unitPrice: "0.0354 USD",
    stock: "47,198",
  },
  {
    referenceDesignators: "C1",
    manufacturer: "Texas Instruments",
    mpn: "CL05B103KB5NNNC",
    packageName: "0402",
    value: "10n",
    quantity: "1",
    functionalBlock: "Microcontroller",
    partName: "CL05B103KB5NNNC 10n 0402",
    description: "Capacitor, 10n, 0402",
    lifecycle: "Active",
    unitPrice: "0.001243 USD",
    stock: "7,849,775",
  },
]

test("bom page snapshots long package names within the package column", async () => {
  const pdfBytes = await createPdf({
    bomPage: {
      type: "bom",
      rows: bomRows,
    },
  })

  await expect(pdfBytes).toMatchPdfSnapshot(import.meta.path)
})
