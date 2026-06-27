import { SearchIcon, SettingsIcon } from "./BomIcons"

export function BomToolbar() {
  return (
    <div className="bom-toolbar">
      <label className="bom-search">
        <span>
          <SearchIcon />
        </span>
        <input placeholder="Search by Manufacturer, MPN or Description" />
      </label>
      <div className="bom-toolbar-actions">
        <button className="bom-sort-button">Sort by⌄</button>
        <button className="bom-square-button" aria-label="Column height">
          ↕
        </button>
        <button className="bom-square-button" aria-label="Column settings">
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}
