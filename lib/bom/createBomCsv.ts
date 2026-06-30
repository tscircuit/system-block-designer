import type { BomExportMode, BomViewRow } from "./types"

interface BomCsvColumn {
  key: keyof Pick<
    BomViewRow,
    | "manufacturer"
    | "mpn"
    | "packageName"
    | "value"
    | "quantity"
    | "functionalBlock"
    | "partName"
    | "lifecycle"
    | "unitPrice"
    | "stock"
  >
  label: string
}

const columns: BomCsvColumn[] = [
  { key: "manufacturer", label: "Manufacturer" },
  { key: "mpn", label: "MPN" },
  { key: "packageName", label: "Package" },
  { key: "value", label: "Value" },
  { key: "quantity", label: "Quantity" },
  { key: "functionalBlock", label: "Functional Block(s)" },
  { key: "partName", label: "Part Name" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "unitPrice", label: "Est. Unit Price" },
  { key: "stock", label: "Est. Stock" },
]

export function createBomCsv(rows: BomViewRow[], mode: BomExportMode) {
  const exportRows = createExportRows(rows, mode)
  const header = columns.map((column) => escapeCsvCell(column.label)).join(",")
  const body = exportRows.map((row) =>
    columns.map((column) => escapeCsvCell(row[column.key])).join(","),
  )

  return `\uFEFF${[header, ...body].join("\n")}\n`
}

function createExportRows(rows: BomViewRow[], mode: BomExportMode) {
  if (mode === "Grouped by subsystem") {
    return rows
      .flatMap((row) => expandFunctionalBlocks(row))
      .sort(compareGroupedRows)
  }

  if (mode === "Flat list") {
    return [...rows].sort(compareFlatRows)
  }

  return rows
}

function expandFunctionalBlocks(row: BomViewRow) {
  const functionalBlocks = row.functionalBlock
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (functionalBlocks.length <= 1) return [row]

  return functionalBlocks.map((functionalBlock) => ({
    ...row,
    functionalBlock,
  }))
}

function compareGroupedRows(left: BomViewRow, right: BomViewRow) {
  return (
    left.functionalBlock.localeCompare(right.functionalBlock) ||
    left.mpn.localeCompare(right.mpn) ||
    left.partName.localeCompare(right.partName)
  )
}

function compareFlatRows(left: BomViewRow, right: BomViewRow) {
  return (
    left.mpn.localeCompare(right.mpn) ||
    left.functionalBlock.localeCompare(right.functionalBlock) ||
    left.partName.localeCompare(right.partName)
  )
}

function escapeCsvCell(value: string) {
  const normalizedValue = value.replace(/\r?\n/g, " ").trim()
  const escapedValue = normalizedValue.replace(/"/g, '""')

  if (/[",]/.test(escapedValue)) {
    return `"${escapedValue}"`
  }

  return escapedValue
}
