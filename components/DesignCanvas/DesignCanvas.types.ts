import type { SystemJson } from "../../lib/system-json/system-json"
import type { ReactNode } from "react"

export type Selection =
  | { kind: "block"; id: string }
  | { kind: "connection"; id: string }
  | null

export type Editing =
  | {
      kind: "block"
      id: string
      cx: number
      cy: number
      w: number
      value: string
    }
  | {
      kind: "connection"
      id: string
      cx: number
      cy: number
      w: number
      value: string
    }
  | null

export type CanvasContextMenu =
  | {
      kind: "block"
      blockId: string
      x: number
      y: number
    }
  | {
      kind: "connection"
      connectionId: string
      x: number
      y: number
    }
  | null

export interface DesignCanvasProps {
  projectTitle?: string
  initialSystemJson?: SystemJson[]
  debugOptions?: {
    showSystemJsonDownload?: boolean
    systemJsonDownloadFilename?: string
    showCircuitJsonDownload?: boolean
    circuitJsonDownloadFilename?: string
    showSchematicSnapshotPreview?: boolean
  }
  topBarActions?: ReactNode
}

export interface CanvasView {
  pan: {
    x: number
    y: number
  }
  zoom: number
}
