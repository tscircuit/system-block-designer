import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import type { SystemBlock } from "../../../lib/system-json/system-json"
import type { CanvasView } from "../DesignCanvas.types"
import { getBlockTopLeft } from "../systemJsonCanvas"

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5

interface UseCanvasViewportConfig {
  svgRef: RefObject<SVGSVGElement | null>
  stageRef: RefObject<HTMLElement | null>
  getBlocks: () => SystemBlock[]
}

export function useCanvasViewport({
  svgRef,
  stageRef,
  getBlocks,
}: UseCanvasViewportConfig) {
  const [view, setViewState] = useState<CanvasView>({
    pan: { x: 120, y: 70 },
    zoom: 0.72,
  })
  const viewRef = useRef(view)

  const applyView = useCallback((next: CanvasView) => {
    viewRef.current = next
    setViewState(next)
  }, [])

  const clientToCanvas = useCallback(
    (cx: number, cy: number) => {
      const rect = svgRef.current!.getBoundingClientRect()
      const currentView = viewRef.current
      return {
        x: (cx - rect.left - currentView.pan.x) / currentView.zoom,
        y: (cy - rect.top - currentView.pan.y) / currentView.zoom,
      }
    },
    [svgRef],
  )

  const canvasToWrapper = useCallback((cx: number, cy: number) => {
    const currentView = viewRef.current
    return {
      x: currentView.pan.x + cx * currentView.zoom,
      y: currentView.pan.y + cy * currentView.zoom,
    }
  }, [])

  const zoomBy = useCallback(
    (factor: number) => {
      const rect = svgRef.current!.getBoundingClientRect()
      const currentView = viewRef.current
      const middleX = rect.width / 2
      const middleY = rect.height / 2
      const before = {
        x: (middleX - currentView.pan.x) / currentView.zoom,
        y: (middleY - currentView.pan.y) / currentView.zoom,
      }
      const zoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, currentView.zoom * factor),
      )
      applyView({
        zoom,
        pan: { x: middleX - before.x * zoom, y: middleY - before.y * zoom },
      })
    },
    [applyView, svgRef],
  )

  const fitView = useCallback(() => {
    const currentBlocks = getBlocks()
    if (!currentBlocks.length) {
      applyView({ pan: { x: 120, y: 70 }, zoom: 0.72 })
      return
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const block of currentBlocks) {
      const topLeft = getBlockTopLeft(block)
      minX = Math.min(minX, topLeft.x)
      minY = Math.min(minY, topLeft.y)
      maxX = Math.max(maxX, topLeft.x + block.size.width)
      maxY = Math.max(maxY, topLeft.y + block.size.height)
    }

    const padding = 80
    const rect = svgRef.current!.getBoundingClientRect()
    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2
    const zoom = Math.max(
      MIN_ZOOM,
      Math.min(2.2, rect.width / width, rect.height / height),
    )
    applyView({
      zoom,
      pan: {
        x: (rect.width - (maxX + minX) * zoom) / 2,
        y: (rect.height - (maxY + minY) * zoom) / 2,
      },
    })
  }, [applyView, getBlocks, svgRef])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const handler = (event: WheelEvent) => {
      event.preventDefault()
      const rect = svgRef.current!.getBoundingClientRect()
      const currentView = viewRef.current
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      const before = {
        x: (mouseX - currentView.pan.x) / currentView.zoom,
        y: (mouseY - currentView.pan.y) / currentView.zoom,
      }
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
      const zoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, currentView.zoom * factor),
      )
      applyView({
        zoom,
        pan: { x: mouseX - before.x * zoom, y: mouseY - before.y * zoom },
      })
    }
    stage.addEventListener("wheel", handler, { passive: false })
    return () => stage.removeEventListener("wheel", handler)
  }, [applyView, stageRef, svgRef])

  return {
    applyView,
    canvasToWrapper,
    clientToCanvas,
    fitView,
    view,
    viewRef,
    zoomBy,
  }
}
