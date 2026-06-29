import type { BomViewRow } from "../../lib/bom/types"

interface BomColumn {
  key: keyof BomViewRow
  label: string
  width: number
  align?: "right"
}

const columns: BomColumn[] = [
  {
    key: "partNumber",
    label: "Part Number",
    width: 240,
  },
  { key: "supplierPartNumber", label: "Supplier Part #", width: 164 },
  {
    key: "packageName",
    label: "Package",
    width: 118,
    align: "right",
  },
  { key: "value", label: "Value", width: 110, align: "right" },
  {
    key: "quantity",
    label: "Quantity",
    width: 92,
    align: "right",
  },
  {
    key: "unitPrice",
    label: "Unit Price",
    width: 124,
    align: "right",
  },
  {
    key: "stock",
    label: "Stock",
    width: 116,
    align: "right",
  },
  {
    key: "functionalBlock",
    label: "Functional Block(s)",
    width: 264,
  },
  { key: "description", label: "Details", width: 196 },
]

interface BomTableProps {
  rows: BomViewRow[]
}

export function BomTable({ rows }: BomTableProps) {
  return (
    <div className="bom-table-wrap">
      <table className="bom-table">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === "right" ? "is-right" : undefined}
              >
                <span className="bom-th-content">{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.partNumber}-${row.description}`}>
              <td className="bom-cell-strong">{row.partNumber}</td>
              <td className="bom-cell-subtle">{row.supplierPartNumber}</td>
              <td className="is-right">{row.packageName}</td>
              <td className="is-right">{row.value}</td>
              <td className="is-right">{row.quantity}</td>
              <td className="is-right">{row.unitPrice}</td>
              <td className="is-right">{row.stock}</td>
              <td className="bom-cell-wrap">{row.functionalBlock}</td>
              <td className="bom-cell-wrap bom-cell-subtle">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
