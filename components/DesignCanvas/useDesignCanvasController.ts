import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { routeOrthogonalPath } from "../../lib/design-system/routeOrthogonalPath"
import { LIBRARY } from "../../lib/design-system/library"
import type { LibraryCategory } from "../../lib/design-system/types"
import {
  type CircuitJson,
  resolveSystemJsonToCircuitJson,
} from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import type {
  Point,
  SystemConnection,
  SystemJson,
} from "../../lib/system-json/system-json"
import type { BlockContextMenu, Editing } from "./DesignCanvas.types"
import {
  duplicateBlockInSystemJson,
  removeBlockFromSystemJson,
  replaceBlockSubcircuitInSystemJson,
} from "./utils/designCanvasBlockMutations"
import {
  countDisconnectedBlocks,
  countMissingSupplyConnections,
  getConnectedBlockIds,
} from "./utils/designCanvasMetrics"
import {
  createSystemJsonForLibraryBlock,
  getBlockTopLeft,
  getSystemPortPosition,
  normalizeSystemJson,
  routeSystemPathPoints,
  systemConnectionToSvgPath,
  SYSTEM_DIR,
  updateConnectionPaths,
} from "./systemJsonCanvas"
import { useCanvasViewport } from "./hooks/useCanvasViewport"
import { useSystemJsonHistory } from "./hooks/useSystemJsonHistory"

type ConnectionInteraction = {
  type: "connection"
  fromSystemPortId: string
}

export function useDesignCanvasController(initialSystemJson?: SystemJson[]) {
  const {
    applySelection,
    applySystemJson,
    bumpHistory,
    futureRef,
    mutate,
    pastRef,
    redo,
    selection,
    selectionRef,
    systemJson,
    systemJsonRef,
    uidRef,
    undo,
  } = useSystemJsonHistory(initialSystemJson)

  const editingRef = useRef<Editing>(null)
  const interactionRef = useRef<
    | { type: "pan"; sx: number; sy: number; px: number; py: number }
    | { type: "block"; id: string; ox: number; oy: number; moved: boolean }
    | ConnectionInteraction
    | null
  >(null)
  const dragStartSystemJsonRef = useRef<SystemJson[] | null>(null)
  const dragTypeRef = useRef<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const {
    applyView,
    canvasToWrapper,
    clientToCanvas,
    fitView,
    view,
    viewRef,
    zoomBy,
  } = useCanvasViewport({
    svgRef,
    stageRef,
    getBlocks: useCallback(
      () => normalizeSystemJson(systemJsonRef.current).blocks,
      [systemJsonRef],
    ),
  })

  const [categories, setCategories] = useState<LibraryCategory[]>(LIBRARY)
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("canvas")
  const [resolving, setResolving] = useState(false)
  const [resolvedCircuitJson, setResolvedCircuitJson] =
    useState<CircuitJson | null>(null)
  const [resolvedTsx, setResolvedTsx] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [contextMenu, setContextMenu] = useState<BlockContextMenu>(null)
  const [tempConnection, setTempConnection] = useState<{
    fromSystemPortId: string
    to: Point
  } | null>(null)
  const [dropActive, setDropActive] = useState(false)

  const nextId = (prefix: string) => `${prefix}_${uidRef.current++}`

  useEffect(() => {
    editingRef.current = editing
  }, [editing])

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
  const connected = useMemo(
    () => getConnectedBlockIds(normalized, portMap),
    [normalized, portMap],
  )

  const warnings = useMemo(
    () => countDisconnectedBlocks(normalized.blocks, connected),
    [normalized.blocks, connected],
  )
  const errors = useMemo(
    () => countMissingSupplyConnections(normalized),
    [normalized],
  )

  const addBlockAt = useCallback(
    (type: string, cx: number, cy: number) => {
      const currentSystemJson = systemJsonRef.current
      const diagram = currentSystemJson.find(
        (item) => item.type === "system_diagram",
      )
      const system_diagram_id = diagram?.system_diagram_id ?? "system_diagram_0"
      const id = nextId("b")
      const blockSystemJson = createSystemJsonForLibraryBlock(
        system_diagram_id,
        id,
        type,
        { x: cx, y: cy },
      )
      if (!blockSystemJson) return

      mutate([...currentSystemJson, ...blockSystemJson])
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
      if (event.button !== 0) return
      setContextMenu(null)
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

  const onSvgContextMenu = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const target = event.target as Element
      const blockElement = target.closest(".block")
      if (!blockElement) {
        setContextMenu(null)
        return
      }

      event.preventDefault()
      const blockId = blockElement.getAttribute("data-id")
      const stageRect = stageRef.current?.getBoundingClientRect()
      if (!blockId || !stageRect) return

      applySelection({ kind: "block", id: blockId })
      setContextMenu({
        blockId,
        x: event.clientX - stageRect.left,
        y: event.clientY - stageRect.top,
      })
    },
    [applySelection],
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

  const deleteBlock = useCallback(
    (blockId: string) => {
      mutate(removeBlockFromSystemJson(systemJsonRef.current, blockId))
      applySelection(null)
      setContextMenu(null)
    },
    [applySelection, mutate],
  )

  const applyBlockSubcircuit = useCallback(
    (blockId: string, subcircuitId: string) => {
      const next = replaceBlockSubcircuitInSystemJson(
        systemJsonRef.current,
        blockId,
        subcircuitId,
      )
      if (!next) return
      mutate(next)
      applySelection({ kind: "block", id: blockId })
    },
    [applySelection, mutate],
  )

  const deleteConnection = useCallback(
    (connectionId: string) => {
      mutate(
        systemJsonRef.current.filter(
          (item) =>
            item.type !== "system_connection" ||
            item.system_connection_id !== connectionId,
        ),
      )
      applySelection(null)
      setContextMenu(null)
    },
    [applySelection, mutate],
  )

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const currentSystemJson = systemJsonRef.current
      const current = normalizeSystemJson(currentSystemJson)
      const block = current.blocks.find(
        (candidate) => candidate.system_block_id === blockId,
      )
      if (!block) return

      const newBlockId = nextId("b")
      mutate(duplicateBlockInSystemJson(currentSystemJson, block, newBlockId))
      applySelection({ kind: "block", id: newBlockId })
      setContextMenu(null)
    },
    [applySelection, mutate],
  )

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
        if (selected.kind === "block") deleteBlock(selected.id)
        else deleteConnection(selected.id)
      }
      if (event.key === "Escape") {
        applySelection(null)
        setContextMenu(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [applySelection, deleteBlock, deleteConnection, undo, redo])

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

  const onResolve = useCallback(async () => {
    if (resolving) return
    setResolving(true)
    setResolveError(null)
    try {
      const result = await resolveSystemJsonToCircuitJson(systemJsonRef.current)
      setResolvedTsx(result.tsx)
      setResolvedCircuitJson(result.circuitJson)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setResolveError(message)
      console.error(error)
    } finally {
      setResolving(false)
    }
  }, [resolving])

  const tempPath = useMemo(() => {
    if (!tempConnection) return null
    const port = portMap.get(tempConnection.fromSystemPortId)
    const block = port ? blockMap.get(port.system_block_id) : null
    if (!port || !block) return null
    const point = getSystemPortPosition(block, port, normalized.ports)
    const direction = SYSTEM_DIR[port.side_of_block]
    return routeOrthogonalPath(point, direction, tempConnection.to, {
      x: -direction.x || 1,
      y: 0,
    }).d
  }, [tempConnection, blockMap, normalized.ports, portMap])

  const editWrapper = editing ? canvasToWrapper(editing.cx, editing.cy) : null

  return {
    activeTab,
    addBlockAt,
    addBlockCentered,
    applyBlockSubcircuit,
    blockMap,
    blocks: normalized.blocks,
    categories,
    collapsed,
    commitEdit,
    connected,
    connections: normalized.connections,
    contextMenu,
    deleteBlock,
    dropActive,
    duplicateBlock,
    editWrapper,
    editing,
    errors,
    fitView,
    futureRef,
    onDragItem,
    onResolve,
    onSvgContextMenu,
    onSvgDoubleClick,
    onSvgPointerDown,
    onToggleCategory,
    pastRef,
    portMap,
    ports: normalized.ports,
    redo,
    resolvedCircuitJson,
    resolvedTsx,
    resolveError,
    search,
    selection,
    setActiveTab,
    setCollapsed,
    setDropActive,
    setEditing,
    setContextMenu,
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
    clearSelection: () => applySelection(null),
    dragTypeRef,
    resolving,
  }
}
