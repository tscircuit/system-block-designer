import type { BomViewRow } from "../../lib/bom/types"
import { FilterIcon, InfoIcon, SortIcon } from "./BomIcons"

interface BomColumn {
  key: keyof BomViewRow
  label: string
  width: number
  align?: "right"
  filter?: boolean
  sort?: boolean
  info?: boolean
}

const columns: BomColumn[] = [
  {
    key: "manufacturer",
    label: "Manufacturer",
    width: 240,
    filter: true,
    sort: true,
  },
  { key: "mpn", label: "MPN", width: 152, sort: true },
  {
    key: "packageName",
    label: "Package",
    width: 156,
    align: "right",
    sort: true,
  },
  { key: "value", label: "Value", width: 94, align: "right" },
  {
    key: "quantity",
    label: "Quantity",
    width: 92,
    align: "right",
    sort: true,
  },
  {
    key: "functionalBlock",
    label: "Functional Block(s)",
    width: 280,
  },
  {
    key: "unitPrice",
    label: "Est. Unit Price",
    width: 138,
    align: "right",
    sort: true,
    info: true,
  },
  {
    key: "stock",
    label: "Est. Stock",
    width: 118,
    align: "right",
    sort: true,
    info: true,
  },
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
                <span className="bom-th-content">
                  <span>
                    {column.info && <InfoIcon />}
                    {column.label}
                  </span>
                  <span className="bom-th-icons">
                    {column.sort && <SortIcon />}
                    {column.filter && <FilterIcon />}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const alternativesQuery =
              row.mpn !== "—"
                ? row.mpn
                : row.partName !== "—"
                  ? row.partName
                  : ""

            return (
              <tr key={`${row.mpn}-${row.partName}`}>
                <td>
                  <div className="bom-manufacturer">{row.manufacturer}</div>
                  {alternativesQuery ? (
                    <a
                      href={createJlcSearchUrl(alternativesQuery)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Alternatives
                    </a>
                  ) : null}
                </td>
                <td className="bom-cell-strong">
                  {row.mpn !== "—" ? (
                    <a
                      className="bom-mpn-link"
                      href={createJlcSearchUrl(row.mpn)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.mpn}
                    </a>
                  ) : (
                    row.mpn
                  )}
                </td>
                <td className="bom-package-cell is-right">
                  <div className="bom-package-value">{row.packageName}</div>
                </td>
                <td className="is-right">{row.value}</td>
                <td className="is-right">{row.quantity}</td>
                <td>
                  <div className="bom-functional-cell">
                    <div>
                      <span className="bom-inline-link">
                        {row.functionalBlock}
                      </span>
                      <div className="bom-cell-subtle bom-cell-wrap">
                        {row.partName}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="is-right">{row.unitPrice}</td>
                <td className="is-right">{row.stock}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function createJlcSearchUrl(query: string) {
  return `https://jlcsearch.tscircuit.com/components/list?search=${encodeURIComponent(
    query,
  )}`
}
