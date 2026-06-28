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

export interface LibraryItem {
  type: string
  icon: string
  count: number
  category?: string[]
  w?: number
  h?: number
}

export interface LibraryCategory {
  name: string
  open: boolean
  items: LibraryItem[]
}
