import { useState } from "react"
import { systemJsonToTsxProject } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createZip } from "../../lib/utils/createZip"
import { downloadBlob } from "./downloadBlob"
import "./output-files.css"

type OutputFile = {
  id: string
  title: string
  description: string
  icon: "pdf" | "bom" | "kicad"
  generatedAt?: string
  options?: string[]
  selected?: string
}

interface OutputFilesProps {
  systemJson?: SystemJson[]
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
    generatedAt: "Last generated 27 Jun 2026 5:08 PM",
  },
  {
    id: "project-package",
    title: "Project Package",
    description:
      "EDA files containing the schematics and component footprints.",
    icon: "kicad",
    options: ["TSX Zip", "KiCad"],
    selected: "TSX Zip",
    generatedAt: "Last generated 26 Jun 2026 8:50 PM",
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
                  ? "Resolve before downloading TSX Zip"
                  : `Download ${file.title}`
              }
              onClick={() => onDownload(file, selectedOption)}
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
        {file.generatedAt ? (
          <div className="output-file-meta">{file.generatedAt}</div>
        ) : null}
      </div>
    </article>
  )
}

export function OutputFiles({ systemJson }: OutputFilesProps) {
  const downloadFile = (file: OutputFile, selectedOption?: string) => {
    if (file.id === "project-package" && selectedOption === "TSX Zip") {
      if (!systemJson) return

      const project = systemJsonToTsxProject(systemJson)
      const zipBytes = createZip(project.files)
      downloadBlob(
        new Blob([zipBytes], { type: "application/zip" }),
        "tscircuit-project-tsx.zip",
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
      </section>
    </main>
  )
}

export default OutputFiles
