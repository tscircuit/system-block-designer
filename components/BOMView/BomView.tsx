import { useMemo, useState } from "react"
import type { BomSummaryItem, BomViewRow } from "../../lib/bom/types"
import { bomRows as demoRows, bomSummary as demoSummary } from "./bomData"
import { BomSummary } from "./BomSummary"
import { BomTable } from "./BomTable"
import { BomToolbar } from "./BomToolbar"
import "./bom-view.css"

interface BomViewProps {
  rows?: BomViewRow[]
  summary?: BomSummaryItem[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
}

export function BomView({
  rows,
  summary,
  loading = false,
  error = null,
  emptyMessage = "Resolve the design to generate a bill of materials.",
}: BomViewProps) {
  const [query, setQuery] = useState("")
  const resolvedRows = rows ?? demoRows
  const resolvedSummary = summary ?? demoSummary
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return resolvedRows

    return resolvedRows.filter((row) =>
      [
        row.manufacturer,
        row.mpn,
        row.packageName,
        row.value,
        row.quantity,
        row.functionalBlock,
        row.partName,
        row.lifecycle,
        row.unitPrice,
        row.stock,
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [query, resolvedRows])

  return (
    <div className="bom-page">
      <main className="bom-main">
        <BomSummary items={resolvedSummary} />
        <section className="bom-table-section" data-testid="bom-table">
          <BomToolbar
            query={query}
            rowCount={filteredRows.length}
            onQueryChange={setQuery}
          />
          {loading ? (
            <div className="bom-empty-state">
              Building the BOM from circuit data…
            </div>
          ) : error ? (
            <div className="bom-empty-state">{error}</div>
          ) : filteredRows.length > 0 ? (
            <BomTable rows={filteredRows} />
          ) : (
            <div className="bom-empty-state">
              {query ? "No BOM rows match your search." : emptyMessage}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default BomView
