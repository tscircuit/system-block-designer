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
  SystemPort,
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
  blocks: SystemBlock[]
  connections: SystemConnection[]
  ports: SystemPort[]
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
  blocks,
  connections,
  ports,
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

  const blockLinks = useMemo(() => {
    if (!block) return []

    const portMap = new Map(ports.map((port) => [port.system_port_id, port]))
    const blockMap = new Map(
      blocks.map((candidate) => [candidate.system_block_id, candidate]),
    )

    return connections.flatMap((candidate) => {
      const sourcePort = candidate.source_system_port_id
        ? portMap.get(candidate.source_system_port_id)
        : undefined
      const targetPort = candidate.target_system_port_id
        ? portMap.get(candidate.target_system_port_id)
        : undefined
      const isSource = sourcePort?.system_block_id === block.system_block_id
      const isTarget = targetPort?.system_block_id === block.system_block_id
      if (!isSource && !isTarget) return []

      const localPort = isSource ? sourcePort : targetPort
      const remotePort = isSource ? targetPort : sourcePort
      const remoteBlock = remotePort
        ? blockMap.get(remotePort.system_block_id)
        : undefined

      return [
        {
          id: candidate.system_connection_id,
          interfaceName: inferConnectionInterface(candidate.label),
          localPortName: localPort?.label,
          remoteBlockName:
            remoteBlock?.label ??
            remoteBlock?.system_block_id ??
            "Unknown Block",
        },
      ]
    })
  }, [block, blocks, connections, ports])

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
            <h2 className="settings-title">Link &amp; Port Properties</h2>
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
                aria-hidden="true"
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
      <div className="settings-panel block-settings-panel">
        <div className="settings-panel-header block-settings-header">
          <h2 className="settings-title">Block Properties</h2>
        </div>
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
            <span>{categoryPath.join(" / ")}</span>
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
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <section className="settings-section">
          <label className="settings-field part-select-field">
            <span>Subcircuit</span>
            <select
              name="subcircuit"
              autoComplete="off"
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
          {hasPendingSubcircuit && (
            <button
              className="apply-updates"
              type="button"
              onClick={() => {
                if (!selectedSubcircuitId) return
                onApplySubcircuit(block.system_block_id, selectedSubcircuitId)
              }}
            >
              Use Selected Subcircuit
            </button>
          )}
          <div className="settings-field icon-color-field">
            <span id="icon-color-label">Icon Color</span>
            <div className="icon-color-control">
              <button
                className="icon-color-select"
                type="button"
                aria-labelledby="icon-color-label icon-color-value"
                aria-expanded={iconColorPickerOpen}
                aria-controls="icon-color-palette"
                data-testid="block-color-select"
                onClick={() => setIconColorPickerOpen((current) => !current)}
              >
                <span id="icon-color-value" className="sr-only">
                  Current color: {iconColor}
                </span>
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
                id="icon-color-palette"
                className="icon-color-palette"
                data-open={iconColorPickerOpen ? "true" : "false"}
                role="group"
                aria-label="Icon colors"
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
          </div>
          <section className="block-links" aria-labelledby="block-links-title">
            <div className="block-links-heading">
              <h3 id="block-links-title">Links</h3>
              <span className="block-links-count">{blockLinks.length}</span>
            </div>
            {blockLinks.length > 0 ? (
              <ul>
                {blockLinks.map((link) => (
                  <li key={link.id}>
                    <span className="block-link-endpoint">
                      {link.remoteBlockName}
                    </span>
                    <span className="block-link-interface">
                      {link.interfaceName}
                      {link.localPortName ? ` · ${link.localPortName}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No links yet. Connect this block to see them here.</p>
            )}
          </section>
        </section>
      </div>
    </aside>
  )
}
