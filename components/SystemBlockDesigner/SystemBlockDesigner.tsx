import { useEffect, useState } from "react"
import { createBomArtifacts } from "../../lib/bom/createBomArtifacts"
import type { BomArtifacts } from "../../lib/bom/types"
import { AiChat } from "../AiChat"
import { BomView } from "../BOMView/BomView"
import { DesignCanvasContent } from "../DesignCanvas/DesignCanvas"
import type { DesignCanvasProps } from "../DesignCanvas/DesignCanvas.types"
import { TopBar } from "../DesignCanvas/TopBar"
import { useDesignCanvasController } from "../DesignCanvas/useDesignCanvasController"
import { OutputFiles } from "../OutputFiles/OutputFiles"

export function SystemBlockDesigner({
  projectTitle = "System Block Designer",
  initialSystemJson,
  debugOptions,
  topBarActions,
}: DesignCanvasProps) {
  const canvas = useDesignCanvasController(initialSystemJson)
  const [bomArtifacts, setBomArtifacts] = useState<BomArtifacts | null>(null)
  const [bomLoading, setBomLoading] = useState(false)
  const [bomError, setBomError] = useState<string | null>(null)

  const showSystemJsonDownload = debugOptions?.showSystemJsonDownload ?? false
  const showCircuitJsonDownload = debugOptions?.showCircuitJsonDownload ?? false
  const showSchematicSnapshotPreview =
    debugOptions?.showSchematicSnapshotPreview ?? false

  useEffect(() => {
    let cancelled = false

    if (!canvas.resolvedCircuitJson) {
      setBomArtifacts(null)
      setBomError(null)
      setBomLoading(false)
      return
    }

    setBomLoading(true)
    setBomError(null)

    void createBomArtifacts({
      systemJson: canvas.systemJson,
      circuitJson: canvas.resolvedCircuitJson,
    })
      .then((nextBomArtifacts) => {
        if (cancelled) return
        setBomArtifacts(nextBomArtifacts)
      })
      .catch((error) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        setBomArtifacts(null)
        setBomError(message)
      })
      .finally(() => {
        if (cancelled) return
        setBomLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canvas.resolvedCircuitJson, canvas.systemJson])

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
        canViewResolvedOutputs={Boolean(canvas.resolvedCircuitJson)}
        resolving={canvas.resolving}
        onResolve={canvas.onResolve}
        canUndo={canvas.pastRef.current.length > 0}
        canRedo={canvas.futureRef.current.length > 0}
        onUndo={canvas.undo}
        onRedo={canvas.redo}
        assistantAction={
          <AiChat
            contextParams={{
              projectTitle,
              activeTab: canvas.activeTab,
              systemJson: canvas.systemJson,
              blocks: canvas.blocks,
              ports: canvas.ports,
              connections: canvas.connections,
              warnings: canvas.warnings,
              errors: canvas.errors,
              selection: canvas.selection,
            }}
            onApplyActions={canvas.applyAiActions}
          />
        }
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
        <BomView
          rows={bomArtifacts?.rows ?? []}
          summary={bomArtifacts?.summary ?? []}
          loading={bomLoading}
          error={bomError}
          emptyMessage="No parts were generated for this design."
        />
      ) : canvas.activeTab === "out" ? (
        <OutputFiles
          projectTitle={projectTitle}
          systemJson={canvas.systemJson}
          bomRows={bomArtifacts?.rows ?? []}
          bomLoading={bomLoading}
          bomError={bomError}
          circuitJson={canvas.resolvedCircuitJson}
          resolvingCircuitJson={canvas.resolving}
          onResolveCircuitJson={canvas.onResolve}
          showSchematicSnapshotPreview={showSchematicSnapshotPreview}
        />
      ) : (
        <DesignCanvasContent canvas={canvas} />
      )}
    </div>
  )
}

export default SystemBlockDesigner
