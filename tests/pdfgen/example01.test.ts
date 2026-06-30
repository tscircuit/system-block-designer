import { join } from "node:path"
import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import { createPdf, type CreatePdfParams } from "../../lib/pdfgen/createPdf"
import { rasterizeSvgWithResvg } from "../../lib/pdfgen/rasterizeSvgWithResvg"

const drv8876SchematicSheetSvg = await Bun.file(
  join(
    import.meta.dir,
    "fixtures",
    "DRV8876-driver-pwm-operation-ph-en.circuit-schematic-simulation.snap.svg",
  ),
).text()
const circuitToSvgSchematicSheetSvg = await Bun.file(
  join(import.meta.dir, "fixtures", "schematic-sheet.snap.svg"),
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
  schematicSheetSvgs: [
    {
      type: "schematic_sheet",
      title: "Schematics - DRV8876 Driver PWM Operation",
      svg: drv8876SchematicSheetSvg,
    },
    {
      type: "schematic_sheet",
      title: "Schematics - Circuit Sheet",
      svg: circuitToSvgSchematicSheetSvg,
    },
  ],
}

test("snapshots each page of example01 as png", async () => {
  const pdfBytes = await createPdf(examplePdf, {
    rasterizeSvg: rasterizeSvgWithResvg,
  })
  await expect(pdfBytes).toMatchPdfSnapshot(import.meta.path)
})
