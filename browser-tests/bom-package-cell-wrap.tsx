import React from "react"
import ReactDOM from "react-dom/client"
import { BomView } from "../components/BOMView/BomView"
import type { BomSummaryItem, BomViewRow } from "../lib/bom/types"

const rows: BomViewRow[] = [
  {
    manufacturer: "Texas Instruments",
    mpn: "2.54-1*2P",
    packageName: "pinrow2_p2.54_female",
    value: "—",
    quantity: "1",
    functionalBlock: "Microcontroller",
    partName: "2.54-1*2P female pinrow2_p2.54_female",
    lifecycle: "Active",
    unitPrice: "0.0354 USD",
    stock: "47,198",
  },
]

const summary: BomSummaryItem[] = [
  { label: "BOM Last updated", value: "1 Jul 2026" },
  { label: "Unique Components", value: "1" },
  { label: "Est. Price", value: "0.0354 USD" },
]

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <BomView rows={rows} summary={summary} />
    </div>
  </React.StrictMode>,
)
