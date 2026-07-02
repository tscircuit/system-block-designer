import { expect, test } from "bun:test"
import { solveSystemTraceLines } from "../lib/system-trace-solver"

test("system trace solver separates labels on compact fanout routes", () => {
  const result = solveSystemTraceLines({
    obstacles: [],
    routes: ["a", "b", "c"].map((id, index) => ({
      connectionId: id,
      label: "3V3",
      source: {
        portId: `${id}_source`,
        blockId: "source",
        point: { x: 100, y: 100 + index * 20 },
        direction: { x: 1, y: 0 },
      },
      target: {
        portId: `${id}_target`,
        blockId: "target",
        point: { x: 360, y: 100 + index * 20 },
        direction: { x: -1, y: 0 },
      },
    })),
  })

  const labelKeys = result.lines.map(
    (line) =>
      `${Math.round(line.labelPosition.x)}:${Math.round(line.labelPosition.y)}`,
  )

  expect(new Set(labelKeys).size).toBe(result.lines.length)
})
