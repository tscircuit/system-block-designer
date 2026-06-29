import { useState } from "react"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"
import { downloadBlob } from "./downloadBlob"
import "./output-files.css"

type OutputFile = {
  id: string
  title: string
  description: string
  icon: "pdf" | "bom" | "kicad"
  options?: string[]
  selected?: string
}

interface OutputFilesProps {
  systemJson?: SystemJson[]
  circuitJson?: CircuitJson | null
  resolvingCircuitJson?: boolean
  onResolveCircuitJson?: () => void | Promise<void>
  showSchematicSnapshotPreview?: boolean
}

const outputFiles: OutputFile[] = [
  {
    id: "pdf",
    title: "PDF",
    description:
      "Project document containing project description, schematics and BOM.",
    icon: "pdf",
  },
  {
    id: "bom",
    title: "BOM",
    description: "CSV file containing the project Bill of Materials.",
    icon: "bom",
    options: ["Consolidated", "Grouped by subsystem", "Flat list"],
    selected: "Consolidated",
  },
  {
    id: "project-package",
    title: "Project Package",
    description:
      "EDA files containing the schematics and component footprints.",
    icon: "kicad",
    options: ["TSX", "KiCad"],
    selected: "TSX",
  },
]

function FileIcon({ type }: { type: OutputFile["icon"] }) {
  if (type === "pdf") {
    return (
      <div className="output-file-icon output-file-icon-pdf" aria-hidden="true">
        <svg viewBox="0 0 72 72">
          <path d="M21 10h31l12 12v39H21z" />
          <path d="M52 10v13h12" />
        </svg>
        <span>PDF</span>
      </div>
    )
  }

  if (type === "bom") {
    return (
      <div className="output-file-icon output-file-icon-bom" aria-hidden="true">
        <svg viewBox="0 0 72 72">
          <path d="M16 16h40" />
          <path d="M16 25h40" />
          <path d="M16 34h40" />
          <path d="M23 43h26" />
        </svg>
        <span>BOM</span>
      </div>
    )
  }

  return (
    <div className="output-file-icon output-file-icon-kicad" aria-hidden="true">
      <svg viewBox="0 0 72 72">
        <rect x="14" y="28" width="16" height="16" />
        <rect x="45" y="20" width="13" height="13" />
        <rect x="46" y="42" width="13" height="13" />
        <path d="M30 36h16" />
        <path d="M52 33v9" />
      </svg>
      <span>KICAD</span>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h6l2 3h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function OutputFileCard({
  file,
  onDownload,
  disabled,
}: {
  file: OutputFile
  onDownload: (file: OutputFile, selectedOption?: string) => void
  disabled?: boolean
}) {
  const [selectedOption, setSelectedOption] = useState(
    file.selected ?? file.options?.[0],
  )

  return (
    <article
      className="output-file-card"
      data-testid={`file-exporter-${file.id}`}
    >
      <div className="output-file-art">
        <FileIcon type={file.icon} />
      </div>
      <div className="output-file-content">
        <div className="output-file-main">
          <div className="output-file-copy">
            <h2>{file.title}</h2>
            <p>{file.description}</p>
          </div>
          <div className="output-file-controls">
            {file.options ? (
              <label className="output-file-select-wrap">
                <span className="sr-only">{file.title} format</span>
                <select
                  value={selectedOption}
                  aria-label={`${file.title} format`}
                  onChange={(event) => setSelectedOption(event.target.value)}
                >
                  {file.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="output-file-spacer" />
            )}
            <button
              className="output-download-button"
              type="button"
              disabled={disabled}
              aria-label={`Download ${file.title}`}
              title={
                disabled
                  ? "Resolve before downloading TSX"
                  : `Download ${file.title}`
              }
              onClick={() => onDownload(file, selectedOption)}
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function OutputFiles({
  systemJson,
  circuitJson,
  resolvingCircuitJson = false,
  onResolveCircuitJson,
  showSchematicSnapshotPreview = false,
}: OutputFilesProps) {
  const [schematicPreviewOpen, setSchematicPreviewOpen] = useState(false)

  const schematicSvg =
    schematicPreviewOpen && circuitJson
      ? convertCircuitJsonToSchematicSvg(
          circuitJson as Parameters<typeof convertCircuitJsonToSchematicSvg>[0],
        )
      : null

  const showSchematicPreview = () => {
    setSchematicPreviewOpen(true)
    if (!circuitJson && !resolvingCircuitJson) {
      void onResolveCircuitJson?.()
    }
  }

  const downloadFile = (file: OutputFile, selectedOption?: string) => {
    if (file.id === "project-package" && selectedOption === "TSX") {
      if (!systemJson) return

      downloadBlob(
        new Blob([systemJsonToTsx(systemJson)], {
          type: "text/plain;charset=utf-8",
        }),
        "index.circuit.tsx",
      )
      return
    }

    downloadBlob(
      new Blob([`${file.title} export is not available in this demo.\n`], {
        type: "text/plain",
      }),
      `${file.id}.txt`,
    )
  }

  return (
    <main className="output-files-page" data-testid="output-files-wrapper">
      <section className="output-files-panel" aria-label="Output files">
        <div className="output-files-header">
          <h1>Download your project</h1>
          <button className="output-download-all" type="button">
            <FolderIcon />
            <span>Download all</span>
          </button>
        </div>

        <div className="output-files-list">
          {outputFiles.map((file) => (
            <OutputFileCard
              key={file.id}
              file={file}
              onDownload={downloadFile}
              disabled={file.id === "project-package" && !systemJson}
            />
          ))}
        </div>

        <button className="output-next-step" type="button">
          <span aria-hidden="true">?</span>
          What is the next step in your EDA tool?
        </button>

        {showSchematicSnapshotPreview ? (
          <section
            className="output-debug-panel"
            aria-label="Schematic snapshot debug preview"
          >
            <div className="output-debug-header">
              <div>
                <h2>Schematic snapshot</h2>
                <p>Debug preview generated from resolved Circuit JSON.</p>
              </div>
              <button
                className="output-debug-button"
                type="button"
                onClick={showSchematicPreview}
                disabled={resolvingCircuitJson}
              >
                {resolvingCircuitJson
                  ? "Resolving..."
                  : schematicPreviewOpen
                    ? "Refresh preview"
                    : "Preview"}
              </button>
            </div>

            {schematicPreviewOpen ? (
              <div className="output-schematic-preview">
                {schematicSvg ? (
                  <div
                    className="output-schematic-svg"
                    dangerouslySetInnerHTML={{ __html: schematicSvg }}
                  />
                ) : (
                  <div className="output-schematic-empty">
                    {resolvingCircuitJson
                      ? "Resolving Circuit JSON..."
                      : "Resolve the project to preview the schematic snapshot."}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default OutputFiles
