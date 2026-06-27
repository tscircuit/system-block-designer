import type { DesignDocument } from "../../lib/design-system/types"

export type Selection =
  | { kind: "block"; id: string }
  | { kind: "wire"; id: string }
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
      kind: "wire"
      id: string
      cx: number
      cy: number
      w: number
      value: string
    }
  | null

export interface DesignCanvasProps {
  projectTitle?: string
  initialDoc?: DesignDocument
}

export interface CanvasView {
  pan: {
    x: number
    y: number
  }
  zoom: number
}
