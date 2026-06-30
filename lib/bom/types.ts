export interface BomSummaryItem {
  label: string
  value: string
}

export interface BomViewRow {
  manufacturer: string
  mpn: string
  packageName: string
  value: string
  quantity: string
  functionalBlock: string
  partName: string
  lifecycle: string
  unitPrice: string
  stock: string
}

export interface BomArtifacts {
  summary: BomSummaryItem[]
  rows: BomViewRow[]
}

export interface SupplierPartDetails {
  mpn: string | null
  description: string | null
  lifecycle: string | null
  stock: number | null
  prices: Array<{
    qFrom: number
    qTo: number | null
    price: number
  }>
}
