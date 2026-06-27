import { BomView } from "../BOMView/BomView"
import { OutputFiles } from "../OutputFiles/OutputFiles"
import { CanvasStage } from "./CanvasStage"
import { DesignCanvasFooter } from "./DesignCanvasFooter"
import type { DesignCanvasProps } from "./DesignCanvas.types"
import { DesignLibrary } from "./DesignLibrary"
import { TopBar } from "./TopBar"
import "./design-canvas.css"
import { useDesignCanvasController } from "./useDesignCanvasController"

export function DesignCanvas({
  projectTitle = "Smart Lock (UWB Smart Lock)",
  initialDoc,
}: DesignCanvasProps) {
  const canvas = useDesignCanvasController(initialDoc)

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
              doc={canvas.doc}
              view={canvas.view}
              selection={canvas.selection}
              blockMap={canvas.blockMap}
              connected={canvas.connected}
              collapsed={canvas.collapsed}
              dropActive={canvas.dropActive}
              tempPath={canvas.tempPath}
              editing={canvas.editing}
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
              onSvgDoubleClick={canvas.onSvgDoubleClick}
              onEditChange={canvas.setEditing}
              onCommitEdit={canvas.commitEdit}
              onCancelEdit={() => canvas.setEditing(null)}
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
