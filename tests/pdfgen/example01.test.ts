import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { expect, test } from "bun:test"
import { pdfToPng, VerbosityLevel } from "pdf-to-png-converter"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import { createPdf, type CreatePdfParams } from "../../lib/pdfgen/createPdf"

const schematicSheetSvg = await Bun.file(
  join(
    import.meta.dir,
    "fixtures",
    "DRV8876-driver-pwm-operation-ph-en.circuit-schematic-simulation.snap.svg",
  ),
).text()

const examplePdf: CreatePdfParams = {
  titlePage: {
    type: "title",
    projectName: "Smart Lock (UWB Smart Lock)",
    subtitle: "System design package",
    description:
      "Reference package generated from the system block designer PDF generator.",
    preparedFor: "Product Engineering",
    preparedBy: "System Block Designer",
    date: "2026-06-27",
    revision: "A",
  },
  projectDetailsPage: {
    type: "project_details",
    summary:
      "A compact architecture package for an ultra-wideband smart lock platform.",
    details: {
      Project: "Smart Lock",
      Variant: "UWB Smart Lock",
      Status: "Concept",
      Owner: "Hardware Systems",
    },
    sections: [
      {
        title: "Scope",
        body: "This package captures the project overview, technical specification baseline, system architecture, and schematic sheet previews.",
      },
      {
        title: "Deliverables",
        items: [
          "System block diagram",
          "Technical specifications summary",
          "Schematic sheet image pages",
        ],
      },
    ],
  },
  technicalSpecificationsPage: {
    type: "technical_specifications",
    summary: "Initial electrical and integration targets.",
    rows: [
      {
        name: "Connectivity",
        value: "UWB / BLE / NFC",
        notes: "Supports proximity, mobile unlock, and commissioning flows.",
      },
      {
        name: "Host",
        value: "BLE Module",
        notes: "Coordinates radio, flash, authentication, and PMIC control.",
      },
      {
        name: "Power",
        value: "PMIC",
        notes: "Supplies regulated rails to the application electronics.",
      },
      {
        name: "External Interfaces",
        value: "SPI / I2C / GPIO",
        notes: "Shown in the generated system architecture page.",
      },
    ],
  },
  systemArchitecturePage: {
    type: "system_architecture",
    subtitle: "Generated from the smart-lock system JSON fixture.",
    systemJson: createSmartLockSystemJson(),
  },
  schematicSheetSvgs: [schematicSheetSvg],
}

test("snapshots each page of example01 as png", async () => {
  const pdfBytes = await createPdf(examplePdf)
  const pages = await pdfToPng(pdfBytes, {
    viewportScale: 1,
    returnPageContent: true,
    verbosityLevel: VerbosityLevel.ERRORS,
  })

  expect(pages).toHaveLength(5)

  for (const page of pages) {
    expect(page.kind).toBe("content")
    expect(page.content).toBeDefined()
    await expectPngSnapshot(
      page.content!,
      `example01-page-${String(page.pageNumber).padStart(2, "0")}.png`,
    )
  }
})

async function expectPngSnapshot(actual: Uint8Array, filename: string) {
  const snapshotPath = join(import.meta.dir, "__snapshots__", filename)
  const shouldUpdate = process.env.UPDATE_PDFGEN_SNAPSHOTS === "1"

  if (shouldUpdate) {
    await mkdir(dirname(snapshotPath), { recursive: true })
    await Bun.write(snapshotPath, actual)
    return
  }

  const snapshot = Bun.file(snapshotPath)
  expect(await snapshot.exists()).toBe(true)
  expect(
    Buffer.from(actual).equals(Buffer.from(await snapshot.arrayBuffer())),
  ).toBe(true)
}
