import type { BlockPorts, DesignBlock, LibraryCategory } from "./types"

export const LIBRARY: LibraryCategory[] = [
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

export function makeBlock(
  type: string,
  x: number,
  y: number,
  id: string,
  num: number,
): DesignBlock {
  const item = findLibraryItem(type)

  return {
    id,
    num,
    type,
    x,
    y,
    w: item?.w ?? 128,
    h: item?.h ?? 104,
    icon: item?.icon ?? "chip",
    ports: defaultPorts(type),
  }
}

export function nextBlockNum(blocks: DesignBlock[]) {
  const used = new Set(blocks.map((block) => block.num))
  let number = 1
  while (used.has(number)) number += 1
  return number
}
