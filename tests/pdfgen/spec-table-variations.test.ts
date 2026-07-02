import { expect, test } from "bun:test"
import { createPdf, type PdfPageInput } from "../../lib/pdfgen/createPdf"

// Each scenario is rendered as its own Technical Specifications page so the
// snapshot for that page shows how drawSpecTable behaves as the number of rows
// and the length of the Notes column vary. Page order matches the array order:
//   page-01: no notes, page-02: short notes,
//   page-03: many rows / mixed notes, page-04: long wrapping notes.
const scenarios: PdfPageInput[] = [
  {
    type: "technical_specifications",
    title: "Spec Table - No Notes",
    summary: "Rows without notes stay at the original single-line row height.",
    rows: [
      { name: "Connectivity", value: "UWB / BLE / NFC" },
      { name: "Host", value: "BLE Module" },
      { name: "Power", value: "PMIC" },
      { name: "External Interfaces", value: "SPI / I2C / GPIO" },
    ],
  },
  {
    type: "technical_specifications",
    title: "Spec Table - Short Notes",
    summary: "Single-line notes fit within the original row height.",
    rows: [
      {
        name: "Connectivity",
        value: "UWB / BLE / NFC",
        notes: "Proximity unlock.",
      },
      { name: "Host", value: "BLE Module", notes: "Radio and flash." },
      { name: "Power", value: "PMIC", notes: "Regulated rails." },
      {
        name: "External Interfaces",
        value: "SPI / I2C / GPIO",
        notes: "Standard buses.",
      },
    ],
  },
  {
    type: "technical_specifications",
    title: "Spec Table - Many Rows, Mixed Notes",
    summary: "A denser table mixing empty, short, and wrapping notes.",
    rows: [
      { name: "Connectivity", value: "UWB / BLE / NFC" },
      {
        name: "Host",
        value: "BLE Module",
        notes: "Coordinates radio, flash, authentication, and PMIC control.",
      },
      { name: "Power", value: "PMIC", notes: "Supplies regulated rails." },
      { name: "Memory", value: "4 MB QSPI Flash" },
      {
        name: "Sensors",
        value: "IMU / Hall",
        notes: "Tamper detection and door-state sensing.",
      },
      { name: "Battery", value: "Li-ion 500 mAh", notes: "USB-C charging." },
      { name: "Display", value: "None" },
      {
        name: "Audio",
        value: "Piezo buzzer",
        notes: "Audible feedback for unlock, lockout, and low-battery states.",
      },
      { name: "Enclosure", value: "IP54", notes: "Outdoor rated." },
      { name: "External Interfaces", value: "SPI / I2C / GPIO" },
    ],
  },
  {
    type: "technical_specifications",
    title: "Spec Table - Long Wrapping Notes",
    summary:
      "Long notes wrap to multiple lines and each row grows to contain them.",
    rows: [
      {
        name: "Connectivity",
        value: "UWB / BLE / NFC",
        notes:
          "Supports proximity detection, mobile phone unlock, secure commissioning flows, and over-the-air firmware negotiation between the lock and the host application.",
      },
      {
        name: "Host",
        value: "BLE Module",
        notes:
          "Coordinates the radio stack, external flash storage, secure element authentication, and power-management IC control loops across all operating modes.",
      },
      {
        name: "Power",
        value: "PMIC",
        notes: "Supplies regulated rails to the application electronics.",
      },
    ],
  },
]

test("spec table renders across row counts and note lengths", async () => {
  const pdfBytes = await createPdf({ pages: scenarios })
  await expect(pdfBytes).toMatchPdfSnapshot(import.meta.path)
})
