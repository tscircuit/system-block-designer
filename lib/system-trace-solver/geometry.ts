import type { Point } from "../system-json/system-json"
import type { SystemTraceBlockObstacle } from "./types"

export interface TraceRect {
  id: string
  label?: string
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface TraceSegment {
  a: Point
  b: Point
}

export function obstacleToRect(
  obstacle: SystemTraceBlockObstacle,
  defaultPadding: number,
): TraceRect {
  const padding = obstacle.padding ?? defaultPadding
  return {
    id: obstacle.id,
    label: obstacle.label,
    minX: obstacle.center.x - obstacle.width / 2 - padding,
    minY: obstacle.center.y - obstacle.height / 2 - padding,
    maxX: obstacle.center.x + obstacle.width / 2 + padding,
    maxY: obstacle.center.y + obstacle.height / 2 + padding,
  }
}

export function dedupePoints(points: Point[]) {
  const deduped: Point[] = []
  for (const point of points) {
    const previous = deduped[deduped.length - 1]
    if (!previous || previous.x !== point.x || previous.y !== point.y) {
      deduped.push(point)
    }
  }
  return removeCollinearPoints(deduped)
}

export function removeCollinearPoints(points: Point[]) {
  const result: Point[] = []
  for (const point of points) {
    result.push(point)
    while (result.length >= 3) {
      const [a, b, c] = result.slice(-3)
      const vertical = a.x === b.x && b.x === c.x
      const horizontal = a.y === b.y && b.y === c.y
      if (!vertical && !horizontal) break
      if (!pointIsBetweenCollinearPoints(a, b, c)) break
      result.splice(result.length - 2, 1)
    }
  }
  return result
}

export function getPathSegments(points: Point[]): TraceSegment[] {
  return points.slice(1).map((point, index) => ({
    a: points[index],
    b: point,
  }))
}

export function getPathLength(points: Point[]) {
  return getPathSegments(points).reduce(
    (total, segment) =>
      total +
      Math.abs(segment.a.x - segment.b.x) +
      Math.abs(segment.a.y - segment.b.y),
    0,
  )
}

export function getBendCount(points: Point[]) {
  let bends = 0
  for (let i = 2; i < points.length; i++) {
    const a = points[i - 2]
    const b = points[i - 1]
    const c = points[i]
    const prevHorizontal = a.y === b.y
    const nextHorizontal = b.y === c.y
    if (prevHorizontal !== nextHorizontal) bends++
  }
  return bends
}

export function segmentIntersectsRect(segment: TraceSegment, rect: TraceRect) {
  const minX = Math.min(segment.a.x, segment.b.x)
  const maxX = Math.max(segment.a.x, segment.b.x)
  const minY = Math.min(segment.a.y, segment.b.y)
  const maxY = Math.max(segment.a.y, segment.b.y)

  if (segment.a.y === segment.b.y) {
    const y = segment.a.y
    return (
      y > rect.minY && y < rect.maxY && maxX > rect.minX && minX < rect.maxX
    )
  }

  if (segment.a.x === segment.b.x) {
    const x = segment.a.x
    return (
      x > rect.minX && x < rect.maxX && maxY > rect.minY && minY < rect.maxY
    )
  }

  return false
}

export function countObstacleHits(points: Point[], rects: TraceRect[]) {
  return getPathSegments(points).reduce(
    (total, segment) =>
      total +
      rects.filter((rect) => segmentIntersectsRect(segment, rect)).length,
    0,
  )
}

export function segmentsCross(a: TraceSegment, b: TraceSegment) {
  const aHorizontal = a.a.y === a.b.y
  const bHorizontal = b.a.y === b.b.y
  if (aHorizontal === bHorizontal) return false

  const horizontal = aHorizontal ? a : b
  const vertical = aHorizontal ? b : a
  const minHX = Math.min(horizontal.a.x, horizontal.b.x)
  const maxHX = Math.max(horizontal.a.x, horizontal.b.x)
  const minVY = Math.min(vertical.a.y, vertical.b.y)
  const maxVY = Math.max(vertical.a.y, vertical.b.y)
  const x = vertical.a.x
  const y = horizontal.a.y

  return x > minHX && x < maxHX && y > minVY && y < maxVY
}

export function countCrossings(points: Point[], occupiedPaths: Point[][]) {
  const segments = getPathSegments(points)
  const occupiedSegments = occupiedPaths.flatMap(getPathSegments)
  let crossings = 0

  for (const segment of segments) {
    for (const occupied of occupiedSegments) {
      if (segmentsCross(segment, occupied)) crossings++
    }
  }

  return crossings
}

export function countParallelCrowding(
  points: Point[],
  occupiedPaths: Point[][],
  minGap: number,
) {
  let crowded = 0
  const segments = getPathSegments(points)
  const occupiedSegments = occupiedPaths.flatMap(getPathSegments)

  for (const segment of segments) {
    for (const occupied of occupiedSegments) {
      if (segment.a.y === segment.b.y && occupied.a.y === occupied.b.y) {
        const gap = Math.abs(segment.a.y - occupied.a.y)
        if (
          gap > 0 &&
          gap < minGap &&
          rangesOverlap(segment.a.x, segment.b.x, occupied.a.x, occupied.b.x)
        ) {
          crowded++
        }
      }
      if (segment.a.x === segment.b.x && occupied.a.x === occupied.b.x) {
        const gap = Math.abs(segment.a.x - occupied.a.x)
        if (
          gap > 0 &&
          gap < minGap &&
          rangesOverlap(segment.a.y, segment.b.y, occupied.a.y, occupied.b.y)
        ) {
          crowded++
        }
      }
    }
  }

  return crowded
}

export function getCollinearOverlapLength(
  points: Point[],
  occupiedPaths: Point[][],
) {
  let overlapLength = 0
  const segments = getPathSegments(points)
  const occupiedSegments = occupiedPaths.flatMap(getPathSegments)

  for (const segment of segments) {
    for (const occupied of occupiedSegments) {
      if (segment.a.y === segment.b.y && occupied.a.y === occupied.b.y) {
        if (segment.a.y !== occupied.a.y) continue
        overlapLength += rangeOverlapLength(
          segment.a.x,
          segment.b.x,
          occupied.a.x,
          occupied.b.x,
        )
      }

      if (segment.a.x === segment.b.x && occupied.a.x === occupied.b.x) {
        if (segment.a.x !== occupied.a.x) continue
        overlapLength += rangeOverlapLength(
          segment.a.y,
          segment.b.y,
          occupied.a.y,
          occupied.b.y,
        )
      }
    }
  }

  return overlapLength
}

export function pathKey(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join("|")
}

export function midpointOfLongestSegment(points: Point[]) {
  const segments = getPathSegments(points)
  const segment =
    [...segments].sort((a, b) => segmentLength(b) - segmentLength(a))[0] ??
    segments[0]

  if (!segment) return points[0] ?? { x: 0, y: 0 }

  return {
    x: (segment.a.x + segment.b.x) / 2,
    y: (segment.a.y + segment.b.y) / 2,
  }
}

export function pointInRect(point: Point, rect: TraceRect) {
  return (
    point.x >= rect.minX &&
    point.x <= rect.maxX &&
    point.y >= rect.minY &&
    point.y <= rect.maxY
  )
}

export function rectFromCenter(
  id: string,
  center: Point,
  width: number,
  height: number,
): TraceRect {
  return {
    id,
    minX: center.x - width / 2,
    minY: center.y - height / 2,
    maxX: center.x + width / 2,
    maxY: center.y + height / 2,
  }
}

function segmentLength(segment: TraceSegment) {
  return (
    Math.abs(segment.a.x - segment.b.x) + Math.abs(segment.a.y - segment.b.y)
  )
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number) {
  const aMin = Math.min(a1, a2)
  const aMax = Math.max(a1, a2)
  const bMin = Math.min(b1, b2)
  const bMax = Math.max(b1, b2)
  return Math.max(aMin, bMin) < Math.min(aMax, bMax)
}

function rangeOverlapLength(a1: number, a2: number, b1: number, b2: number) {
  const aMin = Math.min(a1, a2)
  const aMax = Math.max(a1, a2)
  const bMin = Math.min(b1, b2)
  const bMax = Math.max(b1, b2)
  return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin))
}

function pointIsBetweenCollinearPoints(a: Point, b: Point, c: Point) {
  if (a.x === b.x && b.x === c.x) {
    return b.y >= Math.min(a.y, c.y) && b.y <= Math.max(a.y, c.y)
  }

  if (a.y === b.y && b.y === c.y) {
    return b.x >= Math.min(a.x, c.x) && b.x <= Math.max(a.x, c.x)
  }

  return false
}
