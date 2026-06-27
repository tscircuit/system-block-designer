import type { Point } from "./types"

export function routePath(p1: Point, d1: Point, p2: Point, d2: Point) {
  const step = 24
  const a = { x: p1.x + d1.x * step, y: p1.y + d1.y * step }
  const b = { x: p2.x + d2.x * step, y: p2.y + d2.y * step }
  const horizontal1 = d1.x !== 0
  const horizontal2 = d2.x !== 0
  const points = [p1, a]

  if (horizontal1 && horizontal2) {
    const midX = (a.x + b.x) / 2
    points.push({ x: midX, y: a.y }, { x: midX, y: b.y })
  } else if (!horizontal1 && !horizontal2) {
    const midY = (a.y + b.y) / 2
    points.push({ x: a.x, y: midY }, { x: b.x, y: midY })
  } else if (horizontal1 && !horizontal2) {
    points.push({ x: b.x, y: a.y })
  } else {
    points.push({ x: a.x, y: b.y })
  }

  points.push(b, p2)
  return { d: pathPointsToSvgPath(points, 9), mid: midpointOfPath(points) }
}

export function midpointOfPath(points: Point[]) {
  const segments: number[] = []
  let total = 0

  for (let i = 1; i < points.length; i += 1) {
    const length = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    )
    segments.push(length)
    total += length
  }

  let target = total / 2
  for (let i = 1; i < points.length; i += 1) {
    if (target <= segments[i - 1]) {
      const ratio = segments[i - 1] ? target / segments[i - 1] : 0
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
      }
    }
    target -= segments[i - 1]
  }

  return points[Math.floor(points.length / 2)]
}

export function pathPointsToSvgPath(points: Point[], radius = 9) {
  const filtered = [points[0]]

  for (let i = 1; i < points.length; i += 1) {
    const last = filtered[filtered.length - 1]
    if (
      Math.abs(last.x - points[i].x) > 0.5 ||
      Math.abs(last.y - points[i].y) > 0.5
    ) {
      filtered.push(points[i])
    }
  }

  if (filtered.length < 3) {
    return `M ${filtered[0].x} ${filtered[0].y} L ${filtered[filtered.length - 1].x} ${filtered[filtered.length - 1].y}`
  }

  let path = `M ${filtered[0].x} ${filtered[0].y}`
  for (let i = 1; i < filtered.length - 1; i += 1) {
    const p0 = filtered[i - 1]
    const p1 = filtered[i]
    const p2 = filtered[i + 1]
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y }
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y }
    const length1 = Math.hypot(v1.x, v1.y) || 1
    const length2 = Math.hypot(v2.x, v2.y) || 1
    const curveRadius = Math.min(radius, length1 / 2, length2 / 2)
    const e1 = {
      x: p1.x - (v1.x / length1) * curveRadius,
      y: p1.y - (v1.y / length1) * curveRadius,
    }
    const e2 = {
      x: p1.x + (v2.x / length2) * curveRadius,
      y: p1.y + (v2.y / length2) * curveRadius,
    }
    path += ` L ${e1.x} ${e1.y} Q ${p1.x} ${p1.y} ${e2.x} ${e2.y}`
  }

  const last = filtered[filtered.length - 1]
  return `${path} L ${last.x} ${last.y}`
}
