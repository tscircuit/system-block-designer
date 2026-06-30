import { SearchIcon } from "./BomIcons"

interface BomToolbarProps {
  query: string
  rowCount: number
  onQueryChange: (value: string) => void
}

export function BomToolbar({
  query,
  rowCount,
  onQueryChange,
}: BomToolbarProps) {
  return (
    <div className="bom-toolbar">
      <label className="bom-search">
        <span>
          <SearchIcon />
        </span>
        <input
          value={query}
          placeholder="Search by manufacturer, MPN, block or package"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <div className="bom-toolbar-actions">
        <div className="bom-toolbar-count">{rowCount} row(s)</div>
      </div>
    </div>
  )
}
