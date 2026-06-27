import type { SystemJson } from "../../lib/system-json/system-json"

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

export interface DesignCanvasProps {
  projectTitle?: string
  initialSystemJson?: SystemJson[]
}

export interface CanvasView {
  pan: {
    x: number
    y: number
  }
  zoom: number
}
