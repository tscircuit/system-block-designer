import { makeBlock } from "./library"
import type { SeedDesign, Side } from "./types"

export function createSmartLockSeed(): SeedDesign {
  let id = 1
  const nextId = (prefix: string) => `${prefix}_${id++}`
  const makeSeedBlock = (
    num: number,
    type: string,
    x: number,
    y: number,
    w?: number,
    h?: number,
  ) => {
    const block = makeBlock(type, x, y, nextId("b"), num)
    if (w) block.w = w
    if (h) block.h = h
    return block
  }

  const radio = makeSeedBlock(5, "Radio Transceiver", 60, 60)
  const shifter = makeSeedBlock(3, "Level Shifter", 560, 30)
  const ble = makeSeedBlock(1, "BLE Module", 940, 150, 176, 140)
  const flash = makeSeedBlock(8, "Flash", 1330, 150)
  const nfc = makeSeedBlock(7, "NFC", 60, 330)
  const signalShift = makeSeedBlock(4, "Signal Level Shift", 560, 320)
  const auth = makeSeedBlock(6, "Authenticators", 320, 470)
  const pmic = makeSeedBlock(2, "PMIC", 940, 690)
  const blocks = [radio, shifter, ble, flash, nfc, signalShift, auth, pmic]

  const wire = (
    sourceId: string,
    sourceSide: Side,
    sourceIndex: number,
    targetId: string,
    targetSide: Side,
    targetIndex: number,
    label: string,
  ) => ({
    id: nextId("w"),
    from: { blockId: sourceId, side: sourceSide, idx: sourceIndex },
    to: { blockId: targetId, side: targetSide, idx: targetIndex },
    label,
  })

  const wires = [
    wire(radio.id, "R", 0, shifter.id, "L", 0, "SPI"),
    wire(radio.id, "R", 1, shifter.id, "L", 1, "GPIO"),
    wire(shifter.id, "R", 0, ble.id, "L", 0, "SPI"),
    wire(shifter.id, "R", 1, ble.id, "L", 1, "GPIO"),
    wire(ble.id, "R", 0, flash.id, "L", 0, "SPI"),
    wire(ble.id, "R", 1, flash.id, "L", 1, "GPIO"),
    wire(nfc.id, "R", 0, signalShift.id, "L", 0, "GPIO"),
    wire(nfc.id, "R", 1, signalShift.id, "L", 1, "GPIO"),
    wire(signalShift.id, "R", 0, ble.id, "L", 2, "GPIO"),
    wire(nfc.id, "L", 0, auth.id, "L", 0, "I2C"),
    wire(auth.id, "R", 0, pmic.id, "L", 0, "I2C"),
    wire(pmic.id, "R", 0, ble.id, "B", 0, "SUPPLY"),
  ]

  return { doc: { blocks, wires }, uid: id }
}
