import { useCallback, useRef, useState } from "react"
import type { SystemJson } from "../../../lib/system-json/system-json"
import { SystemJsonArray } from "../../../lib/system-json/system-json"
import type { Selection } from "../DesignCanvas.types"
import {
  createEmptySystemJson,
  getNextUid,
  updateConnectionPaths,
} from "../systemJsonCanvas"

export function useSystemJsonHistory(initialSystemJson?: SystemJson[]) {
  const seed = useRef(
    SystemJsonArray.parse(initialSystemJson ?? createEmptySystemJson()),
  )
  const [systemJson, setSystemJsonState] = useState<SystemJson[]>(seed.current)
  const [selection, setSelectionState] = useState<Selection>(null)
  const [, setHistVersion] = useState(0)

  const systemJsonRef = useRef(systemJson)
  const selectionRef = useRef(selection)
  const pastRef = useRef<SystemJson[][]>([])
  const futureRef = useRef<SystemJson[][]>([])
  const uidRef = useRef(getNextUid(seed.current))

  const bumpHistory = useCallback(
    () => setHistVersion((version) => version + 1),
    [],
  )

  const applySystemJson = useCallback((next: SystemJson[]) => {
    const parsed = SystemJsonArray.parse(next)
    systemJsonRef.current = parsed
    setSystemJsonState(parsed)
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

  return {
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
  }
}
