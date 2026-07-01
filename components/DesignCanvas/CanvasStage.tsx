import type { RefObject } from "react"
import type {
  SystemBlock,
  SystemConnection,
  SystemPort,
} from "../../lib/system-json/system-json"
import { BlockNode } from "./BlockNode"
import type {
  CanvasContextMenu,
  CanvasView,
  Editing,
  Selection,
} from "./DesignCanvas.types"
import { ConnectionEl } from "./ConnectionEl"

interface CanvasStageProps {
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
  view: CanvasView
  selection: Selection
  blockMap: Map<string, SystemBlock>
  portMap: Map<string, SystemPort>
  connected: Set<string>
  collapsed: boolean
  dropActive: boolean
  tempPath: string | null
  editing: Editing
  contextMenu: CanvasContextMenu
  editWrapper: { x: number; y: number } | null
  svgRef: RefObject<SVGSVGElement | null>
  stageRef: RefObject<HTMLElement | null>
  onToggleLibrary: () => void
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLElement>) => void
  onDrop: (event: React.DragEvent<HTMLElement>) => void
  onSvgPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void
  onSvgContextMenu: (event: React.MouseEvent<SVGSVGElement>) => void
  onSvgDoubleClick: (event: React.MouseEvent<SVGSVGElement>) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
  onDeleteConnection: (connectionId: string) => void
  onEditChange: (editing: Editing) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
}

export function CanvasStage({
  blocks,
  ports,
  connections,
  view,
  selection,
  blockMap,
  portMap,
  connected,
  collapsed,
  dropActive,
  tempPath,
  editing,
  contextMenu,
  editWrapper,
  svgRef,
  stageRef,
  onToggleLibrary,
  onDragOver,
  onDragLeave,
  onDrop,
  onSvgPointerDown,
  onSvgContextMenu,
  onSvgDoubleClick,
  onDuplicateBlock,
  onDeleteBlock,
  onDeleteConnection,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
}: CanvasStageProps) {
  return (
    <>
      <button
        className="sb-toggle"
        title="Toggle library"
        onClick={onToggleLibrary}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
        </svg>
      </button>
      <section
        className={`stage${dropActive ? " drop-active" : ""}`}
        ref={stageRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <svg
          className="svgwrap"
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          onPointerDown={onSvgPointerDown}
          onContextMenu={onSvgContextMenu}
          onDoubleClick={onSvgDoubleClick}
        >
          <defs>
            <pattern
              id="dots"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1.4" cy="1.4" r="1.4" fill="var(--grid)" />
            </pattern>
            <filter id="selglow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor="#0d9488"
                floodOpacity="0.4"
              />
            </filter>
          </defs>
          <rect
            className="grid-bg"
            x={-4000}
            y={-4000}
            width={12000}
            height={12000}
          />
          <g
            transform={`translate(${view.pan.x},${view.pan.y}) scale(${view.zoom})`}
          >
            <g>
              {connections.map((connection) => (
                <ConnectionEl
                  key={connection.system_connection_id}
                  connection={connection}
                  blocks={blockMap}
                  ports={ports}
                  portMap={portMap}
                  selected={
                    selection?.kind === "connection" &&
                    selection.id === connection.system_connection_id
                  }
                />
              ))}
            </g>
            {tempPath && (
              <path className="connection connection-temp" d={tempPath} />
            )}
            <g>
              {blocks.map((block, index) => (
                <BlockNode
                  key={block.system_block_id}
                  block={block}
                  blockNumber={index + 1}
                  ports={ports}
                  selected={
                    selection?.kind === "block" &&
                    selection.id === block.system_block_id
                  }
                  connected={connected.has(block.system_block_id)}
                />
              ))}
            </g>
          </g>
        </svg>
        {blocks.length === 0 && (
          <div className="hint">
            <div className="big">Drag a component from the library</div>
            <div className="sm">
              or click one to drop it here · drag between ports to connect
            </div>
          </div>
        )}
        {editing && editWrapper && (
          <input
            className="edit-input"
            autoFocus
            value={editing.value}
            style={{
              left: editWrapper.x - (editing.w * view.zoom) / 2,
              top: editWrapper.y - 13,
              width: Math.max(60, editing.w * view.zoom),
            }}
            onChange={(event) =>
              onEditChange({ ...editing, value: event.target.value })
            }
            onBlur={onCommitEdit}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key === "Enter") onCommitEdit()
              if (event.key === "Escape") onCancelEdit()
            }}
          />
        )}
        {contextMenu && (
          <ul
            data-testid="context-menu-container"
            className="block-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            {contextMenu.kind === "block" && (
              <li
                aria-disabled="false"
                className="block-context-menu-item"
                data-test-id="context-menu-item-clone-element"
                id="context-menu-item-clone-element"
                onClick={() => onDuplicateBlock(contextMenu.blockId)}
              >
                <span data-testid="ellipsis-text-Duplicate">Duplicate</span>
              </li>
            )}
            <li
              aria-disabled="false"
              className="block-context-menu-item"
              data-test-id="context-menu-item-delete-element"
              id="context-menu-item-delete-element"
              onClick={() => {
                if (contextMenu.kind === "block") {
                  onDeleteBlock(contextMenu.blockId)
                } else {
                  onDeleteConnection(contextMenu.connectionId)
                }
              }}
            >
              <span data-testid="ellipsis-text-Delete">Delete</span>
            </li>
            {contextMenu.kind === "block" && (
              <li
                aria-disabled="true"
                className="block-context-menu-item disabled"
                data-test-id="context-menu-item-show-specs"
                id="context-menu-item-show-specs"
              >
                <span data-testid="ellipsis-text-Manage settings">
                  Manage settings
                </span>
              </li>
            )}
          </ul>
        )}
      </section>
    </>
  )
}
