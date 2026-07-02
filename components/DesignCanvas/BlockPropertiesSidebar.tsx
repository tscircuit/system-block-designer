import { useEffect, useMemo, useState } from "react"
import { BlockIcon } from "../../lib/design-system/icons"
import {
  ICON_COLOR_PALETTE,
  type IconColor,
  normalizeIconColor,
} from "../../lib/system-json/icon-colors"
import type {
  SystemBlock,
  SystemConnection,
} from "../../lib/system-json/system-json"
import {
  TiSubcircuitDefinitions,
  type TiSubcircuitDefinition,
} from "../../lib/system-blocks/TiSubcircuits"
import {
  CONNECTION_INTERFACES,
  inferConnectionInterface,
} from "./systemJsonCanvas"

const TI_DEFINITIONS: TiSubcircuitDefinition[] = Object.values(
  TiSubcircuitDefinitions,
)

interface BlockPropertiesSidebarProps {
  block: SystemBlock | null
  connection: SystemConnection | null
  onClose: () => void
  onApplySubcircuit: (blockId: string, subcircuitId: string) => void
  onUpdateBlockIconColor: (blockId: string, iconColor: IconColor) => void
  onUpdateConnectionInterface: (
    connectionId: string,
    nextInterface: string,
  ) => void
}

export function BlockPropertiesSidebar({
  block,
  connection,
  onClose,
  onApplySubcircuit,
  onUpdateBlockIconColor,
  onUpdateConnectionInterface,
}: BlockPropertiesSidebarProps) {
  const [selectedSubcircuitId, setSelectedSubcircuitId] = useState("")
  const [iconColorPickerOpen, setIconColorPickerOpen] = useState(false)

  const subcircuitOptions = useMemo(() => {
    if (!block) return []
    return TI_DEFINITIONS.filter((definition) =>
      block.category.every(
        (categoryPart, index) => definition.category[index] === categoryPart,
      ),
    )
  }, [block])

  useEffect(() => {
    if (!block) return
    const currentSubcircuit =
      block.subcircuit_id ??
      subcircuitOptions.find(
        (definition) => definition.partNumber === block.part_number,
      )?.componentName ??
      subcircuitOptions[0]?.componentName ??
      ""
    setSelectedSubcircuitId(currentSubcircuit)
    setIconColorPickerOpen(false)
  }, [block, subcircuitOptions])

  if (connection) {
    return (
      <aside
        className="properties-sidebar"
        data-testid="link-functional-settings-container"
        aria-label="Link and ports settings"
      >
        <div className="settings-panel link-settings-panel">
          <div className="settings-panel-header">
            <span className="settings-title">Link and ports settings</span>
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
          <section className="settings-section">
            <label className="settings-field">
              <span>Interface</span>
              <select
                data-testid="connection-interface-select"
                value={inferConnectionInterface(connection.label)}
                onChange={(event) =>
                  onUpdateConnectionInterface(
                    connection.system_connection_id,
                    event.target.value,
                  )
                }
              >
                {CONNECTION_INTERFACES.map((connectionInterface) => (
                  <option key={connectionInterface} value={connectionInterface}>
                    {connectionInterface}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      </aside>
    )
  }

  if (!block) return null

  const blockName = block.label ?? block.system_block_id
  const categoryPath =
    block.category.length > 1
      ? block.category
      : ["System Block", block.category[0] ?? blockName]
  const parentPath = categoryPath.slice(0, -1).join(" / ")
  const currentCategory = categoryPath[categoryPath.length - 1] ?? blockName
  const selectedDefinition = subcircuitOptions.find(
    (definition) => definition.componentName === selectedSubcircuitId,
  )
  const availableInterfaces =
    selectedDefinition?.interfaces ?? block.interfaces ?? []
  const hasPendingSubcircuit =
    Boolean(selectedSubcircuitId) &&
    (selectedSubcircuitId !== block.subcircuit_id ||
      selectedDefinition?.partNumber !== block.part_number)
  const iconColor = normalizeIconColor(block.icon_color)

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
          <div
            className="selected-block-icon"
            style={{ color: iconColor }}
            aria-hidden="true"
          >
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
          <label className="settings-field part-select-field">
            <span>Part number / subcircuit</span>
            <select
              data-testid="block-subcircuit-select"
              value={selectedSubcircuitId}
              disabled={subcircuitOptions.length === 0}
              onChange={(event) => setSelectedSubcircuitId(event.target.value)}
            >
              {subcircuitOptions.length === 0 ? (
                <option value="">No subcircuits available</option>
              ) : (
                subcircuitOptions.map((definition) => (
                  <option
                    key={definition.componentName}
                    value={definition.componentName}
                  >
                    {definition.partNumber} - {definition.label}
                  </option>
                ))
              )}
            </select>
          </label>
          {selectedDefinition && (
            <p className="part-description">{selectedDefinition.description}</p>
          )}
          {availableInterfaces.length > 0 && (
            <div className="available-interfaces">
              <span>Interfaces</span>
              <ul>
                {availableInterfaces.map((interfaceDefinition) => (
                  <li
                    key={`${interfaceDefinition.kind}-${interfaceDefinition.name}`}
                  >
                    <strong>{interfaceDefinition.name}</strong>
                    <span>{interfaceDefinition.kind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="apply-updates"
            type="button"
            disabled={!hasPendingSubcircuit}
            onClick={() => {
              if (!selectedSubcircuitId) return
              onApplySubcircuit(block.system_block_id, selectedSubcircuitId)
            }}
          >
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
              <div className="icon-color-control">
                <button
                  className="icon-color-select"
                  type="button"
                  aria-expanded={iconColorPickerOpen}
                  data-testid="block-color-select"
                  onClick={() => setIconColorPickerOpen((current) => !current)}
                >
                  <span className="icon-color-preview">
                    <span
                      className="icon-color-swatch"
                      style={{ background: iconColor }}
                    />
                    <span
                      className="icon-color-icon"
                      style={{ color: iconColor }}
                    >
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
                <div
                  className="icon-color-palette"
                  data-open={iconColorPickerOpen ? "true" : "false"}
                >
                  {ICON_COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      className="icon-color-option"
                      type="button"
                      title={color}
                      aria-label={`Set icon color to ${color}`}
                      aria-pressed={color === iconColor}
                      data-testid={`block-color-option-${color.slice(1)}`}
                      style={{ background: color }}
                      onClick={() => {
                        onUpdateBlockIconColor(block.system_block_id, color)
                        setIconColorPickerOpen(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </label>
          </div>
        </section>
      </div>
    </aside>
  )
}
