import { expect, test } from "bun:test"
import { findLibraryItem } from "../../lib/design-system/library"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createSystemJsonForLibraryBlock } from "../../components/DesignCanvas/systemJsonCanvas"

test("library TI blocks carry subcircuit metadata used by added editor blocks", () => {
  const item = findLibraryItem("MCU")

  expect(item).toMatchObject({
    subcircuitId: "Microcontroller_MSPM0G3507",
  })
})

test("an editor-added TI block converts to its concrete subcircuit TSX", () => {
  const blockSystemJson = createSystemJsonForLibraryBlock(
    "system_diagram_0",
    "b_1",
    "MCU",
    { x: 120, y: 100 },
  )
  expect(blockSystemJson).not.toBeNull()

  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: "system_diagram_0",
      name: "Test System",
    },
    ...blockSystemJson!,
  ]
  const portLabels = blockSystemJson!
    .filter((item) => item.type === "system_port")
    .map((port) => port.label)

  expect(portLabels).toEqual([
    "VDD",
    "GND",
    "NRST",
    "SWDIO",
    "SWCLK",
    "PA0",
    "PA1",
  ])
  expect(systemJsonToTsx(systemJson)).toContain("<Microcontroller_MSPM0G3507")
})
