import { useMemo } from "react"
import type { LibraryCategory } from "../../lib/system-block-library/types"
import { Icon } from "../../lib/utils/icons"

interface DesignLibraryProps {
  categories: LibraryCategory[]
  search: string
  onSearch: (value: string) => void
  collapsed: boolean
  onToggleCategory: (name: string) => void
  onDragItem: (type: string, event: React.DragEvent) => void
  onClickItem: (type: string) => void
}

export function DesignLibrary({
  categories,
  search,
  onSearch,
  collapsed,
  onToggleCategory,
  onDragItem,
  onClickItem,
}: DesignLibraryProps) {
  const query = search.toLowerCase().trim()
  const filtered = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: category.items.filter(
            (item) => !query || item.type.toLowerCase().includes(query),
          ),
        }))
        .filter((group) => !query || group.items.length > 0),
    [categories, query],
  )

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sb-head">
        <h2>Design Library</h2>
        <div className="search">
          <input
            type="text"
            placeholder="Search for a functionality"
            autoComplete="off"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>
      </div>
      <div className="lib">
        {filtered.length === 0 && (
          <div className="lib-empty">No components match "{search}".</div>
        )}
        {filtered.map(({ category, items }) => {
          const open = query ? true : category.open
          return (
            <div
              key={category.name}
              className={`cat ${open ? "open" : "closed"}`}
            >
              <div
                className="cat-head"
                onClick={() => !query && onToggleCategory(category.name)}
              >
                <span className="cat-title">
                  <span className="t">{category.name}</span>
                  <span
                    className="cat-count"
                    aria-label={`${category.count} ${category.count === 1 ? "chip" : "chips"}`}
                  >
                    {category.count}
                  </span>
                </span>
                <svg
                  className="chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <div className="cat-grid">
                {items.map((item) => {
                  const disabled = item.count === 0
                  return (
                    <div
                      key={item.type}
                      className={`libcard${disabled ? " disabled" : ""}`}
                      draggable={!disabled}
                      aria-disabled={disabled}
                      onDragStart={(event) => {
                        if (disabled) {
                          event.preventDefault()
                          return
                        }
                        onDragItem(item.type, event)
                      }}
                      onClick={() => {
                        if (!disabled) onClickItem(item.type)
                      }}
                    >
                      <span className="cnt">{item.count}</span>
                      <div className="ic">
                        <Icon name={item.icon} size={30} />
                      </div>
                      <div className="lbl">{item.type}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
