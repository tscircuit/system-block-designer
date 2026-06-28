import { BlockIcon } from "../../lib/design-system/icons"
import type { SystemBlock } from "../../lib/system-json/system-json"

interface BlockPropertiesSidebarProps {
  block: SystemBlock | null
  onClose: () => void
}

export function BlockPropertiesSidebar({
  block,
  onClose,
}: BlockPropertiesSidebarProps) {
  if (!block) return null

  const blockName = block.label ?? block.system_block_id
  const categoryPath =
    block.category.length > 1
      ? block.category
      : ["System Block", block.category[0] ?? blockName]
  const parentPath = categoryPath.slice(0, -1).join(" / ")
  const currentCategory = categoryPath[categoryPath.length - 1] ?? blockName

  return (
    <aside
      className="properties-sidebar"
      data-testid="block-functional-settings-container"
      aria-label="Block functional settings"
    >
      <div className="settings-collapse">
        <button
          className="settings-collapse-header"
          type="button"
          aria-expanded="true"
        >
          <span className="settings-collapse-title">Selected Block</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div className="selected-block-summary">
          <div className="selected-block-icon" aria-hidden="true">
            <BlockIcon name={block.icon ?? "chip"} size={22} />
          </div>
          <div className="selected-block-copy">
            <strong>{blockName}</strong>
            <span>{currentCategory}</span>
          </div>
        </div>
        <button
          className="props-close"
          type="button"
          title="Close properties"
          aria-label="Close properties"
          onClick={onClose}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="settings-panel">
        <span className="settings-title">{blockName} block settings</span>
        <section className="settings-section">
          <div
            className="functionality-hierarchy"
            data-testid="functionality-hierarchy-container"
          >
            {parentPath && <span>{parentPath} / </span>}
            <strong>{currentCategory}</strong>
          </div>
          <button className="apply-updates" type="button" disabled>
            Apply updates
          </button>
          <div className="settings-divider" role="separator" />
          <div className="settings-fields">
            <label className="settings-field block-name-field">
              <span>Block Name</span>
              <input
                data-testid="block-name-input"
                type="text"
                value={blockName}
                readOnly
              />
            </label>
            <label className="settings-field icon-color-field">
              <span>Icon Color</span>
              <button
                className="icon-color-select"
                type="button"
                data-testid="block-color-select"
              >
                <span className="icon-color-preview">
                  <span className="icon-color-swatch" />
                  <span className="icon-color-icon">
                    <BlockIcon name={block.icon ?? "chip"} size={20} />
                  </span>
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </label>
          </div>
        </section>
      </div>
    </aside>
  )
}
