import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { routePath } from "../../lib/design-system/geometry"
import { LIBRARY, findLibraryItem } from "../../lib/design-system/library"
import type { LibraryCategory } from "../../lib/design-system/types"
import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemJson,
} from "../../lib/system-json/system-json"
import { SystemJsonArray } from "../../lib/system-json/system-json"
import type { CanvasView, Editing, Selection } from "./DesignCanvas.types"
import {
  createEmptySystemJson,
  createSystemPortsForBlock,
  getBlockTopLeft,
  getNextUid,
  getSystemPortPosition,
  normalizeSystemJson,
  routeSystemPathPoints,
  systemConnectionToSvgPath,
  SYSTEM_DIR,
  updateConnectionPaths,
} from "./systemJsonCanvas"

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5

type ConnectionInteraction = {
  type: "connection"
  fromSystemPortId: string
}

export function useDesignCanvasController(initialSystemJson?: SystemJson[]) {
  const seed = useRef(
    SystemJsonArray.parse(initialSystemJson ?? createEmptySystemJson()),
  )
  const [systemJson, setSystemJsonState] = useState<SystemJson[]>(seed.current)
  const [view, setViewState] = useState<CanvasView>({
    pan: { x: 120, y: 70 },
    zoom: 0.72,
  })
  const [selection, setSelectionState] = useState<Selection>(null)

  const systemJsonRef = useRef(systemJson)
  const viewRef = useRef(view)
  const selectionRef = useRef(selection)
  const editingRef = useRef<Editing>(null)
  const pastRef = useRef<SystemJson[][]>([])
  const futureRef = useRef<SystemJson[][]>([])
  const interactionRef = useRef<
    | { type: "pan"; sx: number; sy: number; px: number; py: number }
    | { type: "block"; id: string; ox: number; oy: number; moved: boolean }
    | ConnectionInteraction
    | null
  >(null)
  const dragStartSystemJsonRef = useRef<SystemJson[] | null>(null)
  const uidRef = useRef(getNextUid(seed.current))
  const dragTypeRef = useRef<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)

  const [histVersion, setHistVersion] = useState(0)
  const [categories, setCategories] = useState<LibraryCategory[]>(LIBRARY)
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("canvas")
  const [resolving, setResolving] = useState(false)
  const [editing, setEditing] = useState<Editing>(null)
  const [tempConnection, setTempConnection] = useState<{
    fromSystemPortId: string
    to: Point
  } | null>(null)
  const [dropActive, setDropActive] = useState(false)

  const nextId = (prefix: string) => `${prefix}_${uidRef.current++}`
  const bumpHistory = useCallback(
    () => setHistVersion((version) => version + 1),
    [],
  )

  const applySystemJson = useCallback((next: SystemJson[]) => {
    const parsed = SystemJsonArray.parse(next)
    systemJsonRef.current = parsed
    setSystemJsonState(parsed)
  }, [])

  const applyView = useCallback((next: CanvasView) => {
    viewRef.current = next
    setViewState(next)
  }, [])

  const applySelection = useCallback((next: Selection) => {
    selectionRef.current = next
    setSelectionState(next)
  }, [])

  const mutate = useCallback(
    (next: SystemJson[]) => {
      pastRef.current = [systemJsonRef.current, ...pastRef.current].slice(
        0,
        100,
      )
      futureRef.current = []
      applySystemJson(updateConnectionPaths(next))
      bumpHistory()
    },
    [applySystemJson, bumpHistory],
  )

  const undo = useCallback(() => {
    if (!pastRef.current.length) return
    const [prev, ...rest] = pastRef.current
    futureRef.current = [systemJsonRef.current, ...futureRef.current]
    pastRef.current = rest
    applySystemJson(prev)
    applySelection(null)
    bumpHistory()
  }, [applySystemJson, applySelection, bumpHistory])

  const redo = useCallback(() => {
    if (!futureRef.current.length) return
    const [next, ...rest] = futureRef.current
    pastRef.current = [systemJsonRef.current, ...pastRef.current]
    futureRef.current = rest
    applySystemJson(next)
    applySelection(null)
    bumpHistory()
  }, [applySystemJson, applySelection, bumpHistory])

  useEffect(() => {
    editingRef.current = editing
  }, [editing])

  const clientToCanvas = useCallback((cx: number, cy: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const currentView = viewRef.current
    return {
      x: (cx - rect.left - currentView.pan.x) / currentView.zoom,
      y: (cy - rect.top - currentView.pan.y) / currentView.zoom,
    }
  }, [])

  const canvasToWrapper = useCallback((cx: number, cy: number) => {
    const currentView = viewRef.current
    return {
      x: currentView.pan.x + cx * currentView.zoom,
      y: currentView.pan.y + cy * currentView.zoom,
    }
  }, [])

  const normalized = useMemo(
    () => normalizeSystemJson(systemJson),
    [systemJson],
  )
  const blockMap = useMemo(
    () =>
      new Map(normalized.blocks.map((block) => [block.system_block_id, block])),
    [normalized.blocks],
  )
  const portMap = useMemo(
    () => new Map(normalized.ports.map((port) => [port.system_port_id, port])),
    [normalized.ports],
  )
  const connected = useMemo(() => {
    const set = new Set<string>()
    for (const connection of normalized.connections) {
      const sourcePort = connection.source_system_port_id
        ? portMap.get(connection.source_system_port_id)
        : undefined
      const targetPort = connection.target_system_port_id
        ? portMap.get(connection.target_system_port_id)
        : undefined
      if (sourcePort) set.add(sourcePort.system_block_id)
      if (targetPort) set.add(targetPort.system_block_id)
    }
    return set
  }, [normalized.connections, portMap])

  const warnings = useMemo(
    () =>
      normalized.blocks.filter((block) => !connected.has(block.system_block_id))
        .length,
    [normalized.blocks, connected],
  )
  const errors = useMemo(() => {
    let count = 0
    for (const block of normalized.blocks) {
      const supplyPorts = normalized.ports.filter(
        (port) =>
          port.system_block_id === block.system_block_id &&
          port.side_of_block === "bottom" &&
          port.label === "SUPPLY",
      )
      for (const port of supplyPorts) {
        const hasSupply = normalized.connections.some(
          (connection) =>
            connection.source_system_port_id === port.system_port_id ||
            connection.target_system_port_id === port.system_port_id,
        )
        if (!hasSupply) count += 1
      }
    }
    return count
  }, [normalized])

  const addBlockAt = useCallback(
    (type: string, cx: number, cy: number) => {
      const currentSystemJson = systemJsonRef.current
      const diagram = currentSystemJson.find(
        (item) => item.type === "system_diagram",
      )
      const system_diagram_id = diagram?.system_diagram_id ?? "system_diagram_0"
      const id = nextId("b")
      const item = findLibraryItem(type)
      const width = item?.w ?? 128
      const height = item?.h ?? 104
      const block: SystemBlock = {
        type: "system_block",
        system_diagram_id,
        system_block_id: id,
        center: { x: cx, y: cy },
        size: { width, height },
        label: type,
        category: [type],
        icon: item?.icon ?? "chip",
      }
      const ports = createSystemPortsForBlock(system_diagram_id, id, type)

      mutate([...currentSystemJson, block, ...ports])
      applySelection({ kind: "block", id })
    },
    [mutate, applySelection],
  )

  const addBlockCentered = useCallback(
    (type: string) => {
      const rect = svgRef.current!.getBoundingClientRect()
      const center = clientToCanvas(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      )
      addBlockAt(type, center.x, center.y)
    },
    [addBlockAt, clientToCanvas],
  )

  const onMove = useCallback(
    (event: PointerEvent) => {
      const interaction = interactionRef.current
      if (!interaction) return

      if (interaction.type === "pan") {
        applyView({
          ...viewRef.current,
          pan: {
            x: interaction.px + (event.clientX - interaction.sx),
            y: interaction.py + (event.clientY - interaction.sy),
          },
        })
      } else if (interaction.type === "block") {
        const canvas = clientToCanvas(event.clientX, event.clientY)
        let nextX = canvas.x - interaction.ox
        let nextY = canvas.y - interaction.oy
        if (event.shiftKey) {
          nextX = Math.round(nextX / 22) * 22
          nextY = Math.round(nextY / 22) * 22
        }
        interaction.moved = true
        applySystemJson(
          systemJsonRef.current.map((item) =>
            item.type === "system_block" &&
            item.system_block_id === interaction.id
              ? {
                  ...item,
                  center: {
                    x: nextX + item.size.width / 2,
                    y: nextY + item.size.height / 2,
                  },
                }
              : item,
          ),
        )
      } else if (interaction.type === "connection") {
        setTempConnection({
          fromSystemPortId: interaction.fromSystemPortId,
          to: clientToCanvas(event.clientX, event.clientY),
        })
      }
    },
    [applyView, applySystemJson, clientToCanvas],
  )

  const onUp = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const interaction = interactionRef.current
      interactionRef.current = null
      if (stageRef.current) stageRef.current.style.cursor = ""
      if (!interaction) return

      if (interaction.type === "connection") {
        setTempConnection(null)
        const element = document.elementFromPoint(event.clientX, event.clientY)
        const portElement =
          element instanceof Element ? element.closest("[data-port]") : null
        const targetPortId = portElement?.getAttribute("data-port")
        if (targetPortId && targetPortId !== interaction.fromSystemPortId) {
          const currentSystemJson = systemJsonRef.current
          const current = normalizeSystemJson(currentSystemJson)
          const sourcePort = current.ports.find(
            (port) => port.system_port_id === interaction.fromSystemPortId,
          )
          const targetPort = current.ports.find(
            (port) => port.system_port_id === targetPortId,
          )

          if (
            sourcePort &&
            targetPort &&
            sourcePort.system_block_id !== targetPort.system_block_id
          ) {
            const duplicate = current.connections.some(
              (connection) =>
                connection.source_system_port_id ===
                  interaction.fromSystemPortId &&
                connection.target_system_port_id === targetPortId,
            )

            if (!duplicate) {
              const sourceBlock = current.blocks.find(
                (block) => block.system_block_id === sourcePort.system_block_id,
              )
              const targetBlock = current.blocks.find(
                (block) => block.system_block_id === targetPort.system_block_id,
              )

              if (sourceBlock && targetBlock) {
                const connection: SystemConnection = {
                  type: "system_connection",
                  system_diagram_id: sourcePort.system_diagram_id,
                  system_connection_id: nextId("w"),
                  source_system_port_id: interaction.fromSystemPortId,
                  target_system_port_id: targetPortId,
                  system_port_ids: [interaction.fromSystemPortId, targetPortId],
                  path: routeSystemPathPoints(
                    sourceBlock,
                    sourcePort,
                    targetBlock,
                    targetPort,
                    current.ports,
                  ),
                  label: sourcePort.label ?? "NET",
                }
                mutate([...currentSystemJson, connection])
              }
            }
          }
        }
      } else if (
        interaction.type === "block" &&
        interaction.moved &&
        dragStartSystemJsonRef.current
      ) {
        pastRef.current = [
          dragStartSystemJsonRef.current,
          ...pastRef.current,
        ].slice(0, 100)
        futureRef.current = []
        applySystemJson(updateConnectionPaths(systemJsonRef.current))
        bumpHistory()
      }
      dragStartSystemJsonRef.current = null
    },
    [onMove, mutate, applySystemJson, bumpHistory],
  )

  const beginInteraction = useCallback(() => {
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [onMove, onUp])

  const onSvgPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (editingRef.current) return
      const target = event.target as Element
      const portElement = target.closest("[data-port]")
      if (portElement) {
        const fromSystemPortId = portElement.getAttribute("data-port")
        const port = fromSystemPortId ? portMap.get(fromSystemPortId) : null
        const block = port ? blockMap.get(port.system_block_id) : null
        if (!fromSystemPortId || !port || !block) return
        interactionRef.current = { type: "connection", fromSystemPortId }
        setTempConnection({
          fromSystemPortId,
          to: getSystemPortPosition(block, port, normalized.ports),
        })
        beginInteraction()
        return
      }

      const blockElement = target.closest(".block")
      if (blockElement) {
        const id = blockElement.getAttribute("data-id")!
        const block = blockMap.get(id)
        if (!block) return
        const topLeft = getBlockTopLeft(block)
        applySelection({ kind: "block", id })
        const start = clientToCanvas(event.clientX, event.clientY)
        dragStartSystemJsonRef.current = systemJsonRef.current
        interactionRef.current = {
          type: "block",
          id,
          ox: start.x - topLeft.x,
          oy: start.y - topLeft.y,
          moved: false,
        }
        beginInteraction()
        return
      }

      const connectionHit = target.closest(".connection-hit")
      if (connectionHit) {
        applySelection({
          kind: "connection",
          id: connectionHit.getAttribute("data-connection-id")!,
        })
        return
      }

      applySelection(null)
      const currentView = viewRef.current
      interactionRef.current = {
        type: "pan",
        sx: event.clientX,
        sy: event.clientY,
        px: currentView.pan.x,
        py: currentView.pan.y,
      }
      if (stageRef.current) stageRef.current.style.cursor = "grabbing"
      beginInteraction()
    },
    [
      applySelection,
      beginInteraction,
      blockMap,
      clientToCanvas,
      normalized.ports,
      portMap,
    ],
  )

  const onSvgDoubleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const target = event.target as Element
      const labelHit = target.closest("[data-label-connection-id]")
      if (labelHit) {
        const id = labelHit.getAttribute("data-label-connection-id")!
        const connection = normalizeSystemJson(
          systemJsonRef.current,
        ).connections.find((candidate) => candidate.system_connection_id === id)
        if (!connection) return
        const current = normalizeSystemJson(systemJsonRef.current)
        const currentBlockMap = new Map(
          current.blocks.map((block) => [block.system_block_id, block]),
        )
        const currentPortMap = new Map(
          current.ports.map((port) => [port.system_port_id, port]),
        )
        const { mid } = systemConnectionToSvgPath(
          connection,
          currentBlockMap,
          currentPortMap,
          current.ports,
        )
        setEditing({
          kind: "connection",
          id,
          cx: mid.x,
          cy: mid.y,
          w: 70,
          value: connection.label ?? "",
        })
        return
      }

      const blockElement = target.closest(".block")
      if (blockElement) {
        const id = blockElement.getAttribute("data-id")!
        const block = blockMap.get(id)
        if (!block) return
        setEditing({
          kind: "block",
          id,
          cx: block.center.x,
          cy: block.center.y + block.size.height / 2 - 13,
          w: block.size.width - 16,
          value: block.label ?? "",
        })
      }
    },
    [blockMap],
  )

  const commitEdit = useCallback(() => {
    const edit = editingRef.current
    if (!edit) return
    const value = edit.value.trim()
    const currentSystemJson = systemJsonRef.current
    if (edit.kind === "block") {
      if (value) {
        mutate(
          currentSystemJson.map((item) =>
            item.type === "system_block" && item.system_block_id === edit.id
              ? { ...item, label: value }
              : item,
          ),
        )
      }
    } else {
      mutate(
        currentSystemJson.map((item) =>
          item.type === "system_connection" &&
          item.system_connection_id === edit.id
            ? { ...item, label: value }
            : item,
        ),
      )
    }
    setEditing(null)
  }, [mutate])

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
    [applyView],
  )

  const fitView = useCallback(() => {
    const currentBlocks = normalizeSystemJson(systemJsonRef.current).blocks
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
  }, [applyView])

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
  }, [applyView])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (editingRef.current) return
      const selected = selectionRef.current
      const meta = event.ctrlKey || event.metaKey
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault()
        redo()
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault()
        const currentSystemJson = systemJsonRef.current
        if (selected.kind === "block") {
          const current = normalizeSystemJson(currentSystemJson)
          const selectedPortIds = new Set(
            current.ports
              .filter((port) => port.system_block_id === selected.id)
              .map((port) => port.system_port_id),
          )
          mutate(
            currentSystemJson.filter((item) => {
              if (
                item.type === "system_block" &&
                item.system_block_id === selected.id
              ) {
                return false
              }
              if (
                item.type === "system_port" &&
                item.system_block_id === selected.id
              ) {
                return false
              }
              if (item.type === "system_connection") {
                return !item.system_port_ids?.some((portId) =>
                  selectedPortIds.has(portId),
                )
              }
              return true
            }),
          )
        } else {
          mutate(
            currentSystemJson.filter(
              (item) =>
                item.type !== "system_connection" ||
                item.system_connection_id !== selected.id,
            ),
          )
        }
        applySelection(null)
      }
      if (event.key === "Escape") applySelection(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [mutate, applySelection, undo, redo])

  const onToggleCategory = useCallback((name: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.name === name
          ? { ...category, open: !category.open }
          : category,
      ),
    )
  }, [])

  const onDragItem = useCallback((type: string, event: React.DragEvent) => {
    dragTypeRef.current = type
    event.dataTransfer.setData("text/plain", type)
    event.dataTransfer.effectAllowed = "copy"
  }, [])

  const onResolve = useCallback(() => {
    setResolving(true)
    window.setTimeout(() => setResolving(false), 1100)
  }, [])

  const tempPath = useMemo(() => {
    if (!tempConnection) return null
    const port = portMap.get(tempConnection.fromSystemPortId)
    const block = port ? blockMap.get(port.system_block_id) : null
    if (!port || !block) return null
    const point = getSystemPortPosition(block, port, normalized.ports)
    const direction = SYSTEM_DIR[port.side_of_block]
    return routePath(point, direction, tempConnection.to, {
      x: -direction.x || 1,
      y: 0,
    }).d
  }, [tempConnection, blockMap, normalized.ports, portMap])

  const editWrapper = editing ? canvasToWrapper(editing.cx, editing.cy) : null
  void histVersion

  return {
    activeTab,
    addBlockAt,
    addBlockCentered,
    blockMap,
    blocks: normalized.blocks,
    categories,
    collapsed,
    commitEdit,
    connected,
    connections: normalized.connections,
    dropActive,
    editWrapper,
    editing,
    errors,
    fitView,
    futureRef,
    onDragItem,
    onResolve,
    onSvgDoubleClick,
    onSvgPointerDown,
    onToggleCategory,
    pastRef,
    portMap,
    ports: normalized.ports,
    redo,
    search,
    selection,
    setActiveTab,
    setCollapsed,
    setDropActive,
    setEditing,
    setSearch,
    stageRef,
    svgRef,
    systemJson,
    tempPath,
    undo,
    view,
    warnings,
    zoomBy,
    clientToCanvas,
    dragTypeRef,
    resolving,
  }
}
