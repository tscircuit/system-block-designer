import {
  BasePipelineSolver,
  BaseSolver,
  type PipelineStep,
  definePipelineStep,
} from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { Point } from "../system-json/system-json"
import {
  countCrossings,
  countObstacleHits,
  countParallelCrowding,
  dedupePoints,
  getBendCount,
  getCollinearOverlapLength,
  getPathLength,
  midpointOfLongestSegment,
  obstacleToRect,
  pathKey,
  pointInRect,
  rectFromCenter,
  type TraceRect,
} from "./geometry"
import type {
  SolvedSystemTraceLine,
  SolvedSystemTraceLines,
  SystemTraceCandidate,
  SystemTraceRouteEndpoint,
  SystemTraceSolverInput,
  SystemTraceSolverOptions,
} from "./types"

const DEFAULT_OPTIONS: Required<SystemTraceSolverOptions> = {
  minStub: 24,
  obstaclePadding: 18,
  laneGap: 18,
  labelPadding: 8,
}

export class SystemTraceEndpointSolver extends BaseSolver {
  endpoints: SystemTraceRouteEndpoint[] = []
  rects: TraceRect[] = []
  private nextRouteIndex = 0
  private rectsCreated = false
  private options: Required<SystemTraceSolverOptions>

  constructor(private input: SystemTraceSolverInput) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...input.options }
    this.MAX_ITERATIONS = input.routes.length + 4
  }

  override _step() {
    if (!this.rectsCreated) {
      this.rects = this.input.obstacles.map((obstacle) =>
        obstacleToRect(obstacle, this.options.obstaclePadding),
      )
      this.rectsCreated = true
      this.stats = {
        operation: "created-obstacle-rects",
        rects: this.rects.length,
      }
      return
    }

    const route = this.input.routes[this.nextRouteIndex]
    if (!route) {
      this.solved = true
      this.stats = {
        operation: "endpoints-complete",
        routes: this.endpoints.length,
      }
      return
    }

    this.endpoints.push(route)
    this.nextRouteIndex++
    this.stats = {
      operation: "accepted-route-endpoints",
      connectionId: route.connectionId,
      routes: this.endpoints.length,
    }
  }

  override getConstructorParams() {
    return [this.input]
  }

  override getOutput() {
    return { endpoints: this.endpoints, rects: this.rects }
  }

  override visualize(): GraphicsObject {
    return makeTraceGraphics({
      title: "Trace endpoints",
      rects: this.rects,
      routes: this.endpoints.map((route) => ({
        connectionId: route.connectionId,
        label: route.label,
        points: [route.source.point, route.target.point],
      })),
    })
  }
}

export class SingleSystemTraceSolver extends BaseSolver {
  candidates: SystemTraceCandidate[] = []
  bestCandidate: SystemTraceCandidate | null = null
  private candidateInputs: Point[][] = []
  private nextCandidateIndex = 0
  private generated = false
  private options: Required<SystemTraceSolverOptions>

  constructor(
    private input: {
      route: SystemTraceRouteEndpoint
      rects: TraceRect[]
      occupiedPaths: Point[][]
      options?: SystemTraceSolverOptions
    },
  ) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...input.options }
    this.MAX_ITERATIONS = 500
  }

  override _step() {
    if (!this.generated) {
      this.candidateInputs = createCandidatePaths(
        this.input.route,
        this.input.rects,
        this.options,
      )
      this.generated = true
      this.stats = {
        operation: "generated-candidates",
        connectionId: this.input.route.connectionId,
        candidates: this.candidateInputs.length,
      }
      return
    }

    const points = this.candidateInputs[this.nextCandidateIndex]
    if (!points) {
      if (!this.bestCandidate) {
        this.failed = true
        this.error = `No route candidates for ${this.input.route.connectionId}`
        return
      }
      this.solved = true
      this.stats = {
        operation: "selected-best-candidate",
        connectionId: this.input.route.connectionId,
        candidateId: this.bestCandidate.id,
        score: this.bestCandidate.score,
      }
      return
    }

    const candidate = scoreCandidate(
      `${this.input.route.connectionId}:${this.nextCandidateIndex}`,
      points,
      this.input.rects,
      this.input.occupiedPaths,
      this.options.laneGap,
      this.input.route,
    )
    this.candidates.push(candidate)
    if (!this.bestCandidate || candidate.score < this.bestCandidate.score) {
      this.bestCandidate = candidate
    }
    this.nextCandidateIndex++
    this.stats = {
      operation: "scored-candidate",
      candidateId: candidate.id,
      score: candidate.score,
      obstacleHits: candidate.obstacleHits,
      crossingCount: candidate.crossingCount,
    }
  }

  computeProgress() {
    if (!this.generated) return 0
    return Math.min(
      1,
      this.nextCandidateIndex / Math.max(this.candidateInputs.length, 1),
    )
  }

  override getConstructorParams() {
    return [this.input]
  }

  override getOutput() {
    return {
      route: this.input.route,
      candidate: this.bestCandidate,
    }
  }

  override visualize(): GraphicsObject {
    return makeTraceGraphics({
      title: `Route ${this.input.route.connectionId}`,
      rects: this.input.rects,
      routes: [
        ...this.candidates.map((candidate) => ({
          connectionId: candidate.id,
          points: candidate.points,
          color: "#a7b0bd",
        })),
        ...(this.bestCandidate
          ? [
              {
                connectionId: `best ${this.input.route.connectionId}`,
                label: this.input.route.label,
                points: this.bestCandidate.points,
                color: "#0f766e",
              },
            ]
          : []),
      ],
    })
  }
}

export class SystemTraceRouteSolver extends BaseSolver {
  solvedLines: SolvedSystemTraceLine[] = []
  private routeIndex = 0
  private options: Required<SystemTraceSolverOptions>

  constructor(
    private input: {
      endpoints: SystemTraceRouteEndpoint[]
      rects: TraceRect[]
      options?: SystemTraceSolverOptions
    },
  ) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...input.options }
    this.MAX_ITERATIONS = 10_000
  }

  override _step() {
    const route = this.input.endpoints[this.routeIndex]
    if (!route) {
      this.solved = true
      this.activeSubSolver = null
      this.stats = {
        operation: "all-routes-solved",
        routes: this.solvedLines.length,
      }
      return
    }

    if (!this.activeSubSolver) {
      this.activeSubSolver = new SingleSystemTraceSolver({
        route,
        rects: this.input.rects,
        occupiedPaths: this.solvedLines.map((line) => line.points),
        options: this.options,
      })
      this.stats = {
        operation: "started-route",
        connectionId: route.connectionId,
      }
      return
    }

    this.activeSubSolver.step()
    if (this.activeSubSolver.failed) {
      this.failed = true
      this.error = this.activeSubSolver.error
      return
    }

    if (!this.activeSubSolver.solved) return

    const output = this.activeSubSolver.getOutput() as {
      route: SystemTraceRouteEndpoint
      candidate: SystemTraceCandidate | null
    }
    if (!output.candidate) {
      this.failed = true
      this.error = `No selected route for ${route.connectionId}`
      return
    }

    this.solvedLines.push({
      connectionId: output.route.connectionId,
      label: output.route.label,
      points: output.candidate.points,
      labelPosition: midpointOfLongestSegment(output.candidate.points),
      candidateId: output.candidate.id,
      score: output.candidate.score,
    })
    this.routeIndex++
    this.activeSubSolver = null
    this.stats = {
      operation: "committed-route",
      connectionId: output.route.connectionId,
      score: output.candidate.score,
      routes: this.solvedLines.length,
    }
  }

  computeProgress() {
    return this.routeIndex / Math.max(this.input.endpoints.length, 1)
  }

  override getConstructorParams() {
    return [this.input]
  }

  override getOutput() {
    return { lines: this.solvedLines }
  }

  override visualize(): GraphicsObject {
    if (this.activeSubSolver) return this.activeSubSolver.visualize()
    return makeTraceGraphics({
      title: "Solved trace routes",
      rects: this.input.rects,
      routes: this.solvedLines.map((line) => ({
        connectionId: line.connectionId,
        label: line.label,
        points: line.points,
        color: "#2563eb",
      })),
    })
  }
}

export class SystemTraceLabelSolver extends BaseSolver {
  lines: SolvedSystemTraceLine[] = []
  private nextLineIndex = 0
  private placedLabelRects: TraceRect[] = []
  private options: Required<SystemTraceSolverOptions>

  constructor(
    private input: {
      lines: SolvedSystemTraceLine[]
      rects: TraceRect[]
      options?: SystemTraceSolverOptions
    },
  ) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...input.options }
    this.MAX_ITERATIONS = input.lines.length + 2
  }

  override _step() {
    const line = this.input.lines[this.nextLineIndex]
    if (!line) {
      this.solved = true
      this.stats = { operation: "labels-complete", labels: this.lines.length }
      return
    }

    const labelPosition = chooseLabelPosition(
      line,
      this.input.rects,
      this.placedLabelRects,
      this.options.labelPadding,
    )
    const labelRect = rectFromCenter(
      line.connectionId,
      labelPosition,
      getLabelWidth(line.label),
      18 + this.options.labelPadding * 2,
    )
    this.placedLabelRects.push(labelRect)
    this.lines.push({ ...line, labelPosition })
    this.nextLineIndex++
    this.stats = {
      operation: "placed-label",
      connectionId: line.connectionId,
      x: labelPosition.x,
      y: labelPosition.y,
    }
  }

  computeProgress() {
    return this.nextLineIndex / Math.max(this.input.lines.length, 1)
  }

  override getConstructorParams() {
    return [this.input]
  }

  override getOutput() {
    return { lines: this.lines }
  }

  override visualize(): GraphicsObject {
    return makeTraceGraphics({
      title: "Trace labels",
      rects: [...this.input.rects, ...this.placedLabelRects],
      routes: this.lines.map((line) => ({
        connectionId: line.connectionId,
        label: line.label,
        points: line.points,
        color: "#7c3aed",
      })),
    })
  }
}

export class SystemTraceSolver extends BasePipelineSolver<SystemTraceSolverInput> {
  endpointSolver?: SystemTraceEndpointSolver
  routeSolver?: SystemTraceRouteSolver
  labelSolver?: SystemTraceLabelSolver

  pipelineDef: PipelineStep<BaseSolver>[] = [
    definePipelineStep(
      "endpointSolver",
      SystemTraceEndpointSolver,
      (instance: SystemTraceSolver) => [instance.inputProblem],
    ),
    definePipelineStep(
      "routeSolver",
      SystemTraceRouteSolver,
      (instance: SystemTraceSolver) => {
        const endpointOutput = instance.getStageOutput<{
          endpoints: SystemTraceRouteEndpoint[]
          rects: TraceRect[]
        }>("endpointSolver")
        return [
          {
            endpoints: endpointOutput?.endpoints ?? [],
            rects: endpointOutput?.rects ?? [],
            options: instance.inputProblem.options,
          },
        ]
      },
    ),
    definePipelineStep(
      "labelSolver",
      SystemTraceLabelSolver,
      (instance: SystemTraceSolver) => {
        const endpointOutput = instance.getStageOutput<{ rects: TraceRect[] }>(
          "endpointSolver",
        )
        const routeOutput = instance.getStageOutput<{
          lines: SolvedSystemTraceLine[]
        }>("routeSolver")
        return [
          {
            lines: routeOutput?.lines ?? [],
            rects: endpointOutput?.rects ?? [],
            options: instance.inputProblem.options,
          },
        ]
      },
    ),
  ]

  override getConstructorParams() {
    return [this.inputProblem]
  }

  override getOutput(): SolvedSystemTraceLines {
    const labelOutput = this.getStageOutput<{ lines: SolvedSystemTraceLine[] }>(
      "labelSolver",
    )
    const routeOutput = this.getStageOutput<{ lines: SolvedSystemTraceLine[] }>(
      "routeSolver",
    )
    const lines = labelOutput?.lines ?? routeOutput?.lines ?? []
    return {
      lines,
      linesByConnectionId: Object.fromEntries(
        lines.map((line) => [line.connectionId, line]),
      ),
    }
  }

  override finalVisualize(): GraphicsObject | null {
    const output = this.getOutput()
    return makeTraceGraphics({
      title: "System trace solution",
      rects: this.inputProblem.obstacles.map((obstacle) =>
        obstacleToRect(
          obstacle,
          this.inputProblem.options?.obstaclePadding ??
            DEFAULT_OPTIONS.obstaclePadding,
        ),
      ),
      routes: output.lines.map((line) => ({
        connectionId: line.connectionId,
        label: line.label,
        points: line.points,
        color: "#0f766e",
      })),
    })
  }
}

export function solveSystemTraceLines(input: SystemTraceSolverInput) {
  const solver = new SystemTraceSolver(input)
  solver.solve()
  if (solver.failed) {
    throw new Error(solver.error ?? "System trace solver failed")
  }
  return solver.getOutput()
}

function createCandidatePaths(
  route: SystemTraceRouteEndpoint,
  rects: TraceRect[],
  options: Required<SystemTraceSolverOptions>,
) {
  const start = route.source.point
  const end = route.target.point
  const startLead = offset(start, route.source.direction, options.minStub)
  const endLead = offset(end, route.target.direction, options.minStub)
  const xLanes = createXLanes(startLead, endLead, rects, options.laneGap)
  const yLanes = createYLanes(startLead, endLead, rects, options.laneGap)
  const candidateMap = new Map<string, Point[]>()

  const add = (points: Point[]) => {
    const cleaned = dedupePoints(points)
    if (cleaned.length >= 2) candidateMap.set(pathKey(cleaned), cleaned)
  }

  add([
    start,
    startLead,
    ...directMiddlePoints(startLead, endLead),
    endLead,
    end,
  ])
  for (const x of xLanes) {
    add([
      start,
      startLead,
      { x, y: startLead.y },
      { x, y: endLead.y },
      endLead,
      end,
    ])
  }
  for (const y of yLanes) {
    add([
      start,
      startLead,
      { x: startLead.x, y },
      { x: endLead.x, y },
      endLead,
      end,
    ])
  }
  for (const x of xLanes.slice(0, 8)) {
    for (const y of yLanes.slice(0, 8)) {
      add([
        start,
        startLead,
        { x, y: startLead.y },
        { x, y },
        { x: endLead.x, y },
        endLead,
        end,
      ])
      add([
        start,
        startLead,
        { x: startLead.x, y },
        { x, y },
        { x, y: endLead.y },
        endLead,
        end,
      ])
    }
  }

  return [...candidateMap.values()]
}

function scoreCandidate(
  id: string,
  points: Point[],
  rects: TraceRect[],
  occupiedPaths: Point[][],
  laneGap: number,
  route: SystemTraceRouteEndpoint,
): SystemTraceCandidate {
  const length = getPathLength(points)
  const bends = getBendCount(points)
  const obstacleHits = countObstacleHits(points, rects)
  const crossingCount = countCrossings(points, occupiedPaths)
  const parallelCrowding = countParallelCrowding(points, occupiedPaths, laneGap)
  const overlapLength = getCollinearOverlapLength(points, occupiedPaths)
  const endpointReversals = countEndpointReversals(points, route)
  const score =
    length +
    bends * 12 +
    obstacleHits * 10_000 +
    crossingCount * 700 +
    parallelCrowding * 250 +
    overlapLength * 100 +
    endpointReversals * 6_000

  return {
    id,
    points,
    length,
    bends,
    obstacleHits,
    crossingCount,
    parallelCrowding,
    overlapLength,
    endpointReversals,
    score,
  }
}

function countEndpointReversals(
  points: Point[],
  route: SystemTraceRouteEndpoint,
) {
  const startLead = points[1]
  const afterStartLead = points[2]
  const endLead = points[points.length - 2]
  const beforeEndLead = points[points.length - 3]
  let reversals = 0

  if (
    startLead &&
    afterStartLead &&
    dot(
      {
        x: afterStartLead.x - startLead.x,
        y: afterStartLead.y - startLead.y,
      },
      route.source.direction,
    ) < 0
  ) {
    reversals++
  }

  if (
    endLead &&
    beforeEndLead &&
    dot(
      {
        x: beforeEndLead.x - endLead.x,
        y: beforeEndLead.y - endLead.y,
      },
      route.target.direction,
    ) < 0
  ) {
    reversals++
  }

  return reversals
}

function createXLanes(
  startLead: Point,
  endLead: Point,
  rects: TraceRect[],
  gap: number,
) {
  const values = [
    (startLead.x + endLead.x) / 2,
    startLead.x,
    endLead.x,
    ...rects.flatMap((rect) => [rect.minX - gap, rect.maxX + gap]),
  ]
  return rankLaneValues(values, (startLead.x + endLead.x) / 2)
}

function createYLanes(
  startLead: Point,
  endLead: Point,
  rects: TraceRect[],
  gap: number,
) {
  const values = [
    (startLead.y + endLead.y) / 2,
    startLead.y,
    endLead.y,
    ...rects.flatMap((rect) => [rect.minY - gap, rect.maxY + gap]),
  ]
  return rankLaneValues(values, (startLead.y + endLead.y) / 2)
}

function rankLaneValues(values: number[], preferred: number) {
  return [...new Set(values.map((value) => Math.round(value * 1000) / 1000))]
    .sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred))
    .slice(0, 14)
}

function directMiddlePoints(startLead: Point, endLead: Point) {
  const horizontalFirst =
    Math.abs(startLead.x - endLead.x) >= Math.abs(startLead.y - endLead.y)
  if (horizontalFirst) return [{ x: endLead.x, y: startLead.y }]
  return [{ x: startLead.x, y: endLead.y }]
}

function chooseLabelPosition(
  line: SolvedSystemTraceLine,
  blockRects: TraceRect[],
  labelRects: TraceRect[],
  padding: number,
) {
  const width = getLabelWidth(line.label)
  const height = 18 + padding * 2
  const candidates = [
    midpointOfLongestSegment(line.points),
    ...line.points.slice(1, -1),
  ]

  for (const candidate of candidates) {
    const rect = rectFromCenter("label", candidate, width, height)
    const collides = [...blockRects, ...labelRects].some((blockRect) =>
      rectsOverlap(rect, blockRect),
    )
    if (!collides) return candidate
  }

  const fallback = midpointOfLongestSegment(line.points)
  const verticalOffset = labelRects.some((rect) => pointInRect(fallback, rect))
    ? height
    : 0
  return { x: fallback.x, y: fallback.y + verticalOffset }
}

function makeTraceGraphics({
  title,
  rects,
  routes,
}: {
  title: string
  rects: TraceRect[]
  routes: Array<{
    connectionId: string
    label?: string
    points: Point[]
    color?: string
  }>
}): GraphicsObject {
  return {
    title,
    coordinateSystem: "screen",
    rects: rects.map((rect) => ({
      center: {
        x: (rect.minX + rect.maxX) / 2,
        y: (rect.minY + rect.maxY) / 2,
      },
      width: rect.maxX - rect.minX,
      height: rect.maxY - rect.minY,
      fill: "rgba(148, 163, 184, 0.14)",
      stroke: "#94a3b8",
      label: rect.label ?? rect.id,
    })),
    lines: routes.map((route) => ({
      points: route.points,
      strokeWidth: route.color ? 3 : 1,
      strokeColor: route.color ?? "#94a3b8",
      label: route.connectionId,
    })),
    points: routes.flatMap((route) =>
      route.points.map((point, index) => ({
        ...point,
        color:
          index === 0 || index === route.points.length - 1
            ? "#dc2626"
            : "#334155",
      })),
    ),
    texts: routes
      .filter((route) => route.label)
      .map((route) => {
        const point = midpointOfLongestSegment(route.points)
        return {
          x: point.x,
          y: point.y,
          text: route.label ?? "",
          color: route.color ?? "#334155",
          fontSize: 12,
        }
      }),
  }
}

function offset(point: Point, direction: Point, distance: number): Point {
  return {
    x: point.x + direction.x * distance,
    y: point.y + direction.y * distance,
  }
}

function dot(a: Point, b: Point) {
  return a.x * b.x + a.y * b.y
}

function getLabelWidth(label: string | undefined) {
  return (label?.length ?? 0) * 7 + 18
}

function rectsOverlap(a: TraceRect, b: TraceRect) {
  return (
    a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
  )
}
