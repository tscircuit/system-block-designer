import type { Point } from "./types"

const DEFAULT_CORNER_RADIUS = 9
const SAME_POINT_TOLERANCE = 0.5

export function pathPointsToSvgPath(
  points: Point[],
  radius = DEFAULT_CORNER_RADIUS,
) {
  const filteredPoints = removeConsecutiveDuplicatePoints(points)

  if (filteredPoints.length < 3) {
    return svgLinePath(
      filteredPoints[0],
      filteredPoints[filteredPoints.length - 1],
    )
  }

  return roundedPolylineToSvgPath(filteredPoints, radius)
}

function removeConsecutiveDuplicatePoints(points: Point[]) {
  const filteredPoints = [points[0]]

  for (let i = 1; i < points.length; i += 1) {
    const lastPoint = filteredPoints[filteredPoints.length - 1]
    if (!areNearlySamePoint(lastPoint, points[i])) {
      filteredPoints.push(points[i])
    }
  }

  return filteredPoints
}

function areNearlySamePoint(a: Point, b: Point) {
  return (
    Math.abs(a.x - b.x) <= SAME_POINT_TOLERANCE &&
    Math.abs(a.y - b.y) <= SAME_POINT_TOLERANCE
  )
}

function svgLinePath(start: Point, end: Point) {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

function roundedPolylineToSvgPath(points: Point[], radius: number) {
  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i += 1) {
    const corner = getRoundedCornerPoints(
      points[i - 1],
      points[i],
      points[i + 1],
      radius,
    )
    path += ` L ${corner.start.x} ${corner.start.y} Q ${points[i].x} ${points[i].y} ${corner.end.x} ${corner.end.y}`
  }

  const lastPoint = points[points.length - 1]
  return `${path} L ${lastPoint.x} ${lastPoint.y}`
}

function getRoundedCornerPoints(
  previous: Point,
  corner: Point,
  next: Point,
  radius: number,
) {
  const incomingVector = vectorBetween(previous, corner)
  const outgoingVector = vectorBetween(corner, next)
  const incomingLength = vectorLength(incomingVector) || 1
  const outgoingLength = vectorLength(outgoingVector) || 1
  const curveRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2)

  return {
    start: {
      x: corner.x - (incomingVector.x / incomingLength) * curveRadius,
      y: corner.y - (incomingVector.y / incomingLength) * curveRadius,
    },
    end: {
      x: corner.x + (outgoingVector.x / outgoingLength) * curveRadius,
      y: corner.y + (outgoingVector.y / outgoingLength) * curveRadius,
    },
  }
}

function vectorBetween(start: Point, end: Point): Point {
  return {
    x: end.x - start.x,
    y: end.y - start.y,
  }
}

function vectorLength(vector: Point) {
  return Math.hypot(vector.x, vector.y)
}
