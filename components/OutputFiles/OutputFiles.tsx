import { useState } from "react"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { createBomCsv } from "../../lib/bom/createBomCsv"
import type { BomExportMode, BomViewRow } from "../../lib/bom/types"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createKicadProjectZip } from "./createKicadProjectZip"
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
  bomRows?: BomViewRow[]
  bomLoading?: boolean
  bomError?: string | null
  circuitJson?: CircuitJson | null
  resolvingCircuitJson?: boolean
  onResolveCircuitJson?: () =>
    | CircuitJson
    | null
    | undefined
    | Promise<CircuitJson | null | undefined>
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
    options: ["Consolidated", "Flat list"],
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
  getDownloadDisabled,
  getDownloadTitle,
}: {
  file: OutputFile
  onDownload: (
    file: OutputFile,
    selectedOption?: string,
  ) => void | Promise<void>
  getDownloadDisabled?: (file: OutputFile, selectedOption?: string) => boolean
  getDownloadTitle?: (file: OutputFile, selectedOption?: string) => string
}) {
  const [selectedOption, setSelectedOption] = useState(
    file.selected ?? file.options?.[0],
  )
  const disabled = getDownloadDisabled?.(file, selectedOption) ?? false

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
              title={getDownloadTitle?.(file, selectedOption)}
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
  bomRows = [],
  bomLoading = false,
  bomError = null,
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

  const downloadFile = async (file: OutputFile, selectedOption?: string) => {
    if (file.id === "bom") {
      if (bomRows.length === 0) return

      const exportMode = (selectedOption ?? "Consolidated") as BomExportMode
      const csv = createBomCsv(bomRows, exportMode)
      downloadBlob(
        new Blob([csv], {
          type: "text/csv;charset=utf-8",
        }),
        `bom-${slugifyExportMode(exportMode)}.csv`,
      )
      return
    }

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

    if (file.id === "project-package" && selectedOption === "KiCad") {
      const currentCircuitJson =
        circuitJson ?? (await onResolveCircuitJson?.()) ?? null
      if (!currentCircuitJson) {
        return
      }

      const projectName = "system-block-designer"
      downloadBlob(
        new Blob([createKicadProjectZip(currentCircuitJson, projectName)], {
          type: "application/zip",
        }),
        `${projectName}-kicad.zip`,
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

  const getDownloadDisabled = (file: OutputFile, selectedOption?: string) => {
    if (file.id === "bom") {
      return bomLoading || Boolean(bomError) || bomRows.length === 0
    }
    if (file.id !== "project-package") return false
    if (selectedOption === "TSX") return !systemJson
    if (selectedOption === "KiCad") {
      return resolvingCircuitJson || (!circuitJson && !onResolveCircuitJson)
    }
    return false
  }

  const getDownloadTitle = (file: OutputFile, selectedOption?: string) => {
    if (file.id === "bom") {
      if (bomLoading) return "Building BOM CSV..."
      if (bomError) return "BOM generation failed"
      if (bomRows.length === 0) return "No BOM rows available to download"
      return `Download ${selectedOption ?? "Consolidated"} BOM CSV`
    }
    if (file.id !== "project-package") return `Download ${file.title}`
    if (selectedOption === "TSX" && !systemJson) {
      return "System JSON is required before downloading TSX"
    }
    if (selectedOption === "KiCad") {
      if (resolvingCircuitJson) return "Resolving Circuit JSON..."
      if (!circuitJson && !onResolveCircuitJson) {
        return "Circuit JSON is required before downloading KiCad"
      }
      if (!circuitJson) return "Resolve and download KiCad project"
      return "Download KiCad project"
    }
    return `Download ${file.title}`
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
              getDownloadDisabled={getDownloadDisabled}
              getDownloadTitle={getDownloadTitle}
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

function slugifyExportMode(value: BomExportMode) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export default OutputFiles
