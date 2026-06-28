import type { ReactNode } from "react"

interface TopBarProps {
  projectTitle: string
  activeTab: string
  onTab: (tab: string) => void
  canViewResolvedOutputs: boolean
  resolving: boolean
  onResolve: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  actions?: ReactNode
}

export function TopBar({
  projectTitle,
  activeTab,
  onTab,
  canViewResolvedOutputs,
  resolving,
  onResolve,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  actions,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="mark">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="5" width="6" height="6" rx="1" />
            <rect x="13" y="13" width="6" height="6" rx="1" />
            <path d="M11 8h3a2 2 0 0 1 2 2v3" />
          </svg>
        </div>
        <div className="name">
          Block Designer
          <small>System Architecture Studio</small>
        </div>
      </div>
      <div className="proj">
        <span className="proj-title">{projectTitle}</span>
        <button
          className="iconbtn"
          title="Undo"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
          </svg>
        </button>
        <button
          className="iconbtn"
          title="Redo"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0 0 10h1" />
          </svg>
        </button>
        <button
          className={`resolve${resolving ? " spin" : ""}`}
          onClick={onResolve}
        >
          {resolving ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.2-8.6" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          Resolve
        </button>
      </div>
      <nav className="tabs">
        {[
          ["canvas", "Design Canvas"],
          ["bom", "BOM View"],
          ["out", "Output Files"],
        ].map(([id, label]) => {
          const disabled = id !== "canvas" && !canViewResolvedOutputs

          return (
            <button
              key={id}
              className={`tab${activeTab === id ? " active" : ""}`}
              disabled={disabled}
              title={disabled ? "Resolve before viewing generated outputs" : ""}
              onClick={() => onTab(id)}
            >
              {label}
            </button>
          )
        })}
      </nav>
      <div className="right">
        {actions}
        <button className="pill">Share</button>
        <button className="pill">Settings</button>
        <div className="avatar">SE</div>
      </div>
    </header>
  )
}
