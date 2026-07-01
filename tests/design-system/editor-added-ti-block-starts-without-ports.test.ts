import { expect, test } from "bun:test"
import { createSystemJsonForLibraryBlock } from "../../components/DesignCanvas/systemJsonCanvas"
import { systemJsonToTsx } from "../../lib/system-blocks/systemJsonToTsx"
import type { SystemJson } from "../../lib/system-json/system-json"

test("an editor-added TI block starts without ports and converts to its concrete subcircuit TSX", () => {
  const blockSystemJson = createSystemJsonForLibraryBlock({
    system_diagram_id: "system_diagram_0",
    blockId: "b_1",
    type: "MCU",
    center: { x: 120, y: 100 },
  })
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

  expect(portLabels).toEqual([])
  expect(systemJsonToTsx(systemJson)).toContain("<Microcontroller_MSPM0G3507")
})
