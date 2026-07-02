import type { Point, SystemConnection } from "../system-json/system-json"

export type SystemTraceSide = "left" | "right" | "top" | "bottom"

export interface SystemTraceBlockObstacle {
  id: string
  label?: string
  center: Point
  width: number
  height: number
  padding?: number
}

export interface SystemTracePortEndpoint {
  portId: string
  blockId: string
  point: Point
  direction: Point
}

export interface SystemTraceRouteEndpoint {
  connectionId: string
  label?: string
  source: SystemTracePortEndpoint
  target: SystemTracePortEndpoint
}

export interface SystemTraceSolverInput {
  obstacles: SystemTraceBlockObstacle[]
  routes: SystemTraceRouteEndpoint[]
  options?: SystemTraceSolverOptions
}

export interface SystemTraceSolverOptions {
  minStub?: number
  obstaclePadding?: number
  laneGap?: number
  labelPadding?: number
}

export interface SystemTraceCandidate {
  id: string
  points: Point[]
  length: number
  bends: number
  obstacleHits: number
  obstacleIntersectionLength: number
  crossingCount: number
  parallelCrowding: number
  overlapLength: number
  parallelProximity: number
  endpointReversals: number
  score: number
}

export interface SolvedSystemTraceLine {
  connectionId: string
  label?: string
  points: Point[]
  labelPosition: Point
  candidateId: string
  score: number
}

export interface SolvedSystemTraceLines {
  linesByConnectionId: Record<string, SolvedSystemTraceLine>
  lines: SolvedSystemTraceLine[]
}

export type SystemTraceConnectionLike = Pick<
  SystemConnection,
  | "system_connection_id"
  | "source_system_port_id"
  | "target_system_port_id"
  | "label"
  | "path"
>
