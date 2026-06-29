export interface BomSummaryItem {
  label: string
  value: string
}

export interface BomViewRow {
  partNumber: string
  supplierPartNumber: string
  packageName: string
  value: string
  quantity: string
  functionalBlock: string
  description: string
  unitPrice: string
  stock: string
}

export interface BomArtifacts {
  summary: BomSummaryItem[]
  rows: BomViewRow[]
}

export interface SupplierPartDetails {
  stock: number | null
  prices: Array<{
    qFrom: number
    qTo: number | null
    price: number
  }>
}
