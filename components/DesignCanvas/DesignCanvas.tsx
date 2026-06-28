import { BomView } from "../BOMView/BomView"
import { OutputFiles } from "../OutputFiles/OutputFiles"
import { BlockPropertiesSidebar } from "./BlockPropertiesSidebar"
import { CanvasStage } from "./CanvasStage"
import { DesignCanvasFooter } from "./DesignCanvasFooter"
import type { DesignCanvasProps } from "./DesignCanvas.types"
import { DesignLibrary } from "./DesignLibrary"
import { TopBar } from "./TopBar"
import "./design-canvas.css"
import { useDesignCanvasController } from "./useDesignCanvasController"

export function DesignCanvas({
  projectTitle = "System Block Designer",
  initialSystemJson,
  debugOptions,
  topBarActions,
}: DesignCanvasProps) {
  const canvas = useDesignCanvasController(initialSystemJson)

  const showSystemJsonDownload = debugOptions?.showSystemJsonDownload ?? false
  const showCircuitJsonDownload = debugOptions?.showCircuitJsonDownload ?? false
  const selectedBlock =
    canvas.selection?.kind === "block"
      ? (canvas.blockMap.get(canvas.selection.id) ?? null)
      : null

  const downloadJson = (value: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const downloadSystemJson = () => {
    downloadJson(
      canvas.systemJson,
      debugOptions?.systemJsonDownloadFilename ?? "system-diagram.json",
    )
  }

  const downloadCircuitJson = () => {
    if (!canvas.resolvedCircuitJson) return
    downloadJson(
      canvas.resolvedCircuitJson,
      debugOptions?.circuitJsonDownloadFilename ?? "circuit.json",
    )
  }

  return (
    <div className="app">
      <TopBar
        projectTitle={projectTitle}
        activeTab={canvas.activeTab}
        onTab={canvas.setActiveTab}
        resolving={canvas.resolving}
        onResolve={canvas.onResolve}
        canUndo={canvas.pastRef.current.length > 0}
        canRedo={canvas.futureRef.current.length > 0}
        onUndo={canvas.undo}
        onRedo={canvas.redo}
        actions={
          <>
            {(showSystemJsonDownload || showCircuitJsonDownload) && (
              <details className="debug-menu">
                <summary className="pill">Debug</summary>
                <div className="debug-menu-panel">
                  {showSystemJsonDownload && (
                    <button type="button" onClick={downloadSystemJson}>
                      Download System JSON
                    </button>
                  )}
                  {showCircuitJsonDownload && (
                    <button
                      type="button"
                      onClick={downloadCircuitJson}
                      disabled={!canvas.resolvedCircuitJson}
                      title={
                        canvas.resolvedCircuitJson
                          ? "Download Circuit JSON"
                          : "Resolve before downloading Circuit JSON"
                      }
                    >
                      Download Circuit JSON
                    </button>
                  )}
                </div>
              </details>
            )}
            {topBarActions}
          </>
        }
      />
      {canvas.activeTab === "bom" ? (
        <BomView />
      ) : canvas.activeTab === "out" ? (
        <OutputFiles />
      ) : (
        <>
          <div className="body">
            <DesignLibrary
              categories={canvas.categories}
              search={canvas.search}
              onSearch={canvas.setSearch}
              collapsed={canvas.collapsed}
              onToggleCategory={canvas.onToggleCategory}
              onDragItem={canvas.onDragItem}
              onClickItem={canvas.addBlockCentered}
            />
            <CanvasStage
              blocks={canvas.blocks}
              ports={canvas.ports}
              connections={canvas.connections}
              view={canvas.view}
              selection={canvas.selection}
              blockMap={canvas.blockMap}
              portMap={canvas.portMap}
              connected={canvas.connected}
              collapsed={canvas.collapsed}
              dropActive={canvas.dropActive}
              tempPath={canvas.tempPath}
              editing={canvas.editing}
              contextMenu={canvas.contextMenu}
              editWrapper={canvas.editWrapper}
              svgRef={canvas.svgRef}
              stageRef={canvas.stageRef}
              onToggleLibrary={() => canvas.setCollapsed((current) => !current)}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "copy"
                canvas.setDropActive(true)
              }}
              onDragLeave={(event) => {
                if (event.target === canvas.stageRef.current)
                  canvas.setDropActive(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                canvas.setDropActive(false)
                const type =
                  event.dataTransfer.getData("text/plain") ||
                  canvas.dragTypeRef.current
                if (!type) return
                const point = canvas.clientToCanvas(
                  event.clientX,
                  event.clientY,
                )
                canvas.addBlockAt(type, point.x, point.y)
              }}
              onSvgPointerDown={canvas.onSvgPointerDown}
              onSvgContextMenu={canvas.onSvgContextMenu}
              onSvgDoubleClick={canvas.onSvgDoubleClick}
              onDuplicateBlock={canvas.duplicateBlock}
              onDeleteBlock={canvas.deleteBlock}
              onEditChange={canvas.setEditing}
              onCommitEdit={canvas.commitEdit}
              onCancelEdit={() => canvas.setEditing(null)}
            />
            <BlockPropertiesSidebar
              block={selectedBlock}
              onClose={canvas.clearSelection}
            />
          </div>
          <DesignCanvasFooter
            errors={canvas.errors}
            warnings={canvas.warnings}
            zoom={canvas.view.zoom}
            onZoomIn={() => canvas.zoomBy(1.15)}
            onZoomOut={() => canvas.zoomBy(1 / 1.15)}
            onFit={canvas.fitView}
          />
        </>
      )}
    </div>
  )
}
