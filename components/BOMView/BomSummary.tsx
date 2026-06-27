import type { BomSummaryItem } from "./bomData"

interface BomSummaryProps {
  items: BomSummaryItem[]
}

export function BomSummary({ items }: BomSummaryProps) {
  return (
    <section className="bom-summary" data-testid="bom-summary">
      {items.map((item) => (
        <article className="bom-summary-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  )
}
