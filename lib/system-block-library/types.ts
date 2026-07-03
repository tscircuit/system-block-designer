import type { IconName } from "../utils/iconPaths"

export const LIBRARY_CATEGORIES = [
  "Battery Management",
  "Communication",
  "Memory",
  "Motor Driver",
  "Power",
  "Processing & Security",
  "Sensor",
] as const

export type LibraryCategoryName = (typeof LIBRARY_CATEGORIES)[number]

export type LibraryItemCategory =
  | readonly [LibraryCategoryName]
  | readonly [LibraryCategoryName, string]

export interface LibraryItem {
  type: string
  icon: IconName
  count: number
  category?: LibraryItemCategory
  w?: number
  h?: number
  subcircuitId?: string
}

export interface LibraryCategory {
  name: LibraryCategoryName
  open: boolean
  items: LibraryItem[]
}
