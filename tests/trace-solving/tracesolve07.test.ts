import { expect, test } from "bun:test"
import {
  getObstacleIntersectionLength,
  obstacleToBodyRect,
} from "../../lib/system-trace-solver/geometry"
import { solveSystemJsonTraceLines } from "../../lib/system-trace-solver"
import type {
  SystemBlock,
  SystemConnection,
  SystemPort,
} from "../../lib/system-json/system-json"
import { systemJsonToSvgSnapshot } from "../fixtures/system-json-to-svg-snapshot"
import { behindBlockSystem } from "./trace-solving-scenarios"

test("tracesolve07 snapshots routing that avoids going behind blocks", async () => {
  const blocks = behindBlockSystem.filter(
    (item): item is SystemBlock => item.type === "system_block",
  )
  const ports = behindBlockSystem.filter(
    (item): item is SystemPort => item.type === "system_port",
  )
  const connections = behindBlockSystem.filter(
    (item): item is SystemConnection => item.type === "system_connection",
  )
  const bodyRects = blocks.map((block) =>
    obstacleToBodyRect({
      id: block.system_block_id,
      label: block.label,
      center: block.center,
      width: block.size.width,
      height: block.size.height,
    }),
  )

  const solved = solveSystemJsonTraceLines({ blocks, ports, connections })
  for (const line of solved.lines) {
    expect(getObstacleIntersectionLength(line.points, bodyRects)).toBe(0)
  }

  const snapshot = systemJsonToSvgSnapshot(behindBlockSystem)
  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
