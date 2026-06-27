import { midpointOfPath } from "./midpointOfPath"
import { pathPointsToSvgPath } from "./pathPointsToSvgPath"
import type { Point } from "./types"

const ROUTE_STEP = 24

interface RoutedPath {
  d: string
  mid: Point
}

export function routeOrthogonalPath(
  start: Point,
  startDirection: Point,
  end: Point,
  endDirection: Point,
): RoutedPath {
  const points = createOrthogonalRoutePoints(
    start,
    startDirection,
    end,
    endDirection,
  )

  return {
    d: pathPointsToSvgPath(points),
    mid: midpointOfPath(points),
  }
}

function createOrthogonalRoutePoints(
  start: Point,
  startDirection: Point,
  end: Point,
  endDirection: Point,
) {
  const startLead = offsetPointInDirection(start, startDirection, ROUTE_STEP)
  const endLead = offsetPointInDirection(end, endDirection, ROUTE_STEP)
  const middlePoints = getOrthogonalRouteMiddlePoints(
    startLead,
    startDirection,
    endLead,
    endDirection,
  )

  return [start, startLead, ...middlePoints, endLead, end]
}

function offsetPointInDirection(
  point: Point,
  direction: Point,
  distance: number,
): Point {
  return {
    x: point.x + direction.x * distance,
    y: point.y + direction.y * distance,
  }
}

function getOrthogonalRouteMiddlePoints(
  startLead: Point,
  startDirection: Point,
  endLead: Point,
  endDirection: Point,
) {
  const startsHorizontal = isHorizontalDirection(startDirection)
  const endsHorizontal = isHorizontalDirection(endDirection)

  if (startsHorizontal && endsHorizontal) {
    const midX = (startLead.x + endLead.x) / 2
    return [
      { x: midX, y: startLead.y },
      { x: midX, y: endLead.y },
    ]
  }

  if (!startsHorizontal && !endsHorizontal) {
    const midY = (startLead.y + endLead.y) / 2
    return [
      { x: startLead.x, y: midY },
      { x: endLead.x, y: midY },
    ]
  }

  if (startsHorizontal) {
    return [{ x: endLead.x, y: startLead.y }]
  }

  return [{ x: startLead.x, y: endLead.y }]
}

function isHorizontalDirection(direction: Point) {
  return direction.x !== 0
}
