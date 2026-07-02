import { expect, test } from "bun:test"
import {
  countObstacleHits,
  obstacleToRect,
} from "../lib/system-trace-solver/geometry"
import { solveSystemTraceLines } from "../lib/system-trace-solver"

test("system trace solver routes around a blocking block", () => {
  const obstacle = {
    id: "middle",
    label: "Middle",
    center: { x: 300, y: 160 },
    width: 140,
    height: 100,
  }
  const result = solveSystemTraceLines({
    obstacles: [obstacle],
    routes: [
      {
        connectionId: "spi",
        label: "spi",
        source: {
          portId: "source",
          blockId: "left",
          point: { x: 120, y: 160 },
          direction: { x: 1, y: 0 },
        },
        target: {
          portId: "target",
          blockId: "right",
          point: { x: 520, y: 160 },
          direction: { x: -1, y: 0 },
        },
      },
    ],
  })

  const line = result.linesByConnectionId.spi
  const hits = countObstacleHits(line.points, [obstacleToRect(obstacle, 18)])

  expect(hits).toBe(0)
  expect(line.points.length).toBeGreaterThan(4)
})
