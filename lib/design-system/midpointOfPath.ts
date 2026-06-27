import type { Point } from "./types"

export function midpointOfPath(points: Point[]): Point {
  const segmentLengths = getPathSegmentLengths(points)
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0)
  let distanceToMidpoint = totalLength / 2

  for (let i = 1; i < points.length; i += 1) {
    const segmentLength = segmentLengths[i - 1]

    if (distanceToMidpoint <= segmentLength) {
      return interpolatePointOnSegment(
        points[i - 1],
        points[i],
        segmentLength ? distanceToMidpoint / segmentLength : 0,
      )
    }

    distanceToMidpoint -= segmentLength
  }

  return points[Math.floor(points.length / 2)]
}

function getPathSegmentLengths(points: Point[]) {
  const segmentLengths: number[] = []

  for (let i = 1; i < points.length; i += 1) {
    const length = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    )
    segmentLengths.push(length)
  }

  return segmentLengths
}

function interpolatePointOnSegment(
  start: Point,
  end: Point,
  ratio: number,
): Point {
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  }
}
