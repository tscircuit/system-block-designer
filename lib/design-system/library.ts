import type { BlockPorts, LibraryCategory, LibraryItem } from "./types"
import { TiSubcircuitDefinitions } from "../system-blocks/TiSubcircuits"

const TI_DEFINITIONS = Object.values(TiSubcircuitDefinitions)

function withTiDefinitionMetadata(
  item: LibraryItem,
  definitions: typeof TI_DEFINITIONS,
): LibraryItem {
  const definition = definitions[0]
  if (!definition) return item

  return {
    ...item,
    subcircuitId: definition.componentName,
    w: item.w ?? definition.size?.width,
    h: item.h ?? definition.size?.height,
  }
}

const BASE_LIBRARY: LibraryCategory[] = [
  {
    name: "Battery Management",
    open: true,
    items: [
      { type: "Active Balancing", icon: "balance", count: 6 },
      { type: "Batteries", icon: "battery", count: 16 },
      { type: "Battery Housing", icon: "battery2", count: 14 },
      { type: "Battery Management", icon: "battery2", count: 30 },
      { type: "Battery Monitor", icon: "monitor", count: 3 },
      { type: "Coin Cell", icon: "battery", count: 3 },
      { type: "Cylindrical Cell", icon: "battery", count: 8 },
      { type: "Exposed Header", icon: "header", count: 3 },
      { type: "Passive Balancing", icon: "balance", count: 5 },
    ],
  },
  {
    name: "Communication",
    open: false,
    items: [
      { type: "Radio Transceiver", icon: "antenna", count: 12 },
      { type: "BLE Module", icon: "chip", count: 9, w: 176, h: 140 },
      { type: "NFC", icon: "nfc", count: 7 },
      { type: "UWB Anchor", icon: "uwb", count: 4 },
      { type: "Level Shifter", icon: "shifter", count: 5 },
      { type: "Signal Level Shift", icon: "shifter", count: 5 },
    ],
  },
  {
    name: "Memory",
    open: false,
    items: [
      { type: "Flash", icon: "memory", count: 8 },
      { type: "EEPROM", icon: "memory", count: 6 },
      { type: "SRAM", icon: "memory", count: 4 },
    ],
  },
  {
    name: "Processing & Security",
    open: false,
    items: [
      { type: "MCU", icon: "chip", count: 22 },
      { type: "Authenticators", icon: "key", count: 6 },
      { type: "Secure Element", icon: "key", count: 5 },
    ],
  },
  {
    name: "Power",
    open: false,
    items: [
      { type: "PMIC", icon: "power", count: 11 },
      { type: "LDO", icon: "power", count: 9 },
      { type: "Buck Converter", icon: "power", count: 7 },
    ],
  },
]

const tiByCategory = TI_DEFINITIONS.reduce((byCategory, definition) => {
  const [categoryName, itemType = categoryName] = definition.category
  const byItemType = byCategory.get(categoryName) ?? new Map()
  byItemType.set(itemType, [...(byItemType.get(itemType) ?? []), definition])
  byCategory.set(categoryName, byItemType)
  return byCategory
}, new Map<string, Map<string, typeof TI_DEFINITIONS>>())

const BASE_CATEGORY_NAMES = new Set(
  BASE_LIBRARY.map((category) => category.name),
)

export const LIBRARY: LibraryCategory[] = [
  ...BASE_LIBRARY.map((category) => {
    const baseItemTypes = new Set(category.items.map((item) => item.type))
    const tiItems =
      tiByCategory.get(category.name) ??
      new Map<string, typeof TI_DEFINITIONS>()
    const missingTiItems = Array.from(tiItems.entries())
      .filter(([itemType]) => !baseItemTypes.has(itemType))
      .map(([itemType, definitions]) =>
        withTiDefinitionMetadata(
          {
            type: itemType,
            icon: definitions[0]?.icon ?? "chip",
            count: definitions.length,
            category: [category.name, itemType],
          },
          definitions,
        ),
      )

    return {
      ...category,
      items: [
        ...category.items.map((item) => {
          const definitions =
            item.type === category.name
              ? Array.from(tiItems.values()).flat()
              : (tiItems.get(item.type) ?? [])

          return withTiDefinitionMetadata(
            {
              ...item,
              count: definitions.length,
              category:
                item.type === category.name
                  ? [category.name]
                  : [category.name, item.type],
            },
            definitions,
          )
        }),
        ...missingTiItems,
      ],
    }
  }),
  ...Array.from(tiByCategory.keys())
    .filter((categoryName) => !BASE_CATEGORY_NAMES.has(categoryName))
    .map(
      (categoryName): LibraryCategory => ({
        name: categoryName,
        open: false,
        items: Array.from(tiByCategory.get(categoryName)!.entries()).map(
          ([itemType, definitions]) =>
            withTiDefinitionMetadata(
              {
                type: itemType,
                icon: definitions[0]?.icon ?? "chip",
                count: definitions.length,
                category: [categoryName, itemType],
              },
              definitions,
            ),
        ),
      }),
    ),
]

const ALL_ITEMS = LIBRARY.flatMap((category) => category.items)

export function findLibraryItem(type: string) {
  return ALL_ITEMS.find((item) => item.type === type)
}

export function defaultPorts(type: string): BlockPorts {
  const ports: BlockPorts = { L: [], R: [], T: [], B: [] }

  if (/Transceiver|UWB/.test(type)) {
    ports.R.push("SPI", "GPIO")
    ports.B.push("SUPPLY")
  } else if (/Level Shift|Shifter/.test(type)) {
    ports.L.push("GPIO", "GPIO")
    ports.R.push("SPI", "GPIO")
    ports.B.push("SUPPLY")
  } else if (/BLE|MCU/.test(type)) {
    ports.L.push("GPIO", "GPIO", "GPIO")
    ports.R.push("SPI", "GPIO")
    ports.B.push("SUPPLY")
  } else if (/Flash|EEPROM|SRAM|Memory/.test(type)) {
    ports.L.push("SPI", "GPIO")
    ports.B.push("SUPPLY")
  } else if (/NFC/.test(type)) {
    ports.L.push("I2C")
    ports.R.push("GPIO", "GPIO", "GPIO")
    ports.B.push("SUPPLY")
  } else if (/Authenticat|Secure/.test(type)) {
    ports.L.push("I2C")
    ports.R.push("I2C")
    ports.B.push("SUPPLY")
  } else if (/PMIC|LDO|Buck/.test(type)) {
    ports.L.push("EN")
    ports.R.push("SUPPLY")
  } else if (/Batter|Cell|Balanc|Monitor/.test(type)) {
    ports.R.push("V+", "V-")
  } else {
    ports.L.push("IN")
    ports.R.push("OUT")
  }

  return ports
}
