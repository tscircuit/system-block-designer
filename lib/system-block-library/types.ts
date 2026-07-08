import type { IconName } from "../utils/iconPaths"

export enum LibraryCategoryName {
  BatteryManagement = "Battery Management",
  Communication = "Communication",
  Memory = "Memory",
  MotorDriver = "Motor Driver",
  Power = "Power",
  ProcessingAndSecurity = "Processing & Security",
  Sensor = "Sensor",
}

export const LIBRARY_CATEGORIES = Object.values(LibraryCategoryName)

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
