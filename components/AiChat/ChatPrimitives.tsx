import { useEffect, useRef, type ReactNode } from "react"
import type { AiChatRole } from "./aiChatTypes"

export function MessageScroller({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollTop = scroller.scrollHeight
  }, [children])

  return (
    <div
      className={`ai-message-scroller${className ? ` ${className}` : ""}`}
      ref={scrollerRef}
    >
      {children}
    </div>
  )
}

export function Message({
  role,
  children,
}: {
  role: AiChatRole
  children: ReactNode
}) {
  return <div className={`ai-message ai-message-${role}`}>{children}</div>
}

export function Bubble({
  role,
  children,
}: {
  role: AiChatRole
  children: ReactNode
}) {
  return <div className={`ai-bubble ai-bubble-${role}`}>{children}</div>
}

export function Marker({ children }: { children: ReactNode }) {
  return <div className="ai-marker">{children}</div>
}
