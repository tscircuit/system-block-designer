export type Side = "L" | "R" | "T" | "B"

export interface Point {
  x: number
  y: number
}

export interface BlockPorts {
  L: string[]
  R: string[]
  T: string[]
  B: string[]
}

export interface DesignBlock {
  id: string
  num: number
  type: string
  x: number
  y: number
  w: number
  h: number
  icon: string
  ports: BlockPorts
}

export interface PortRef {
  blockId: string
  side: Side
  idx: number
}

export interface DesignWire {
  id: string
  from: PortRef
  to: PortRef
  label: string
}

export interface DesignDocument {
  blocks: DesignBlock[]
  wires: DesignWire[]
}

export interface LibraryItem {
  type: string
  icon: string
  count: number
  w?: number
  h?: number
}

export interface LibraryCategory {
  name: string
  open: boolean
  items: LibraryItem[]
}

export interface SeedDesign {
  doc: DesignDocument
  uid: number
}
