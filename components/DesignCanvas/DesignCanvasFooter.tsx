interface DesignCanvasFooterProps {
  errors: number
  warnings: number
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

export function DesignCanvasFooter({
  errors,
  warnings,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: DesignCanvasFooterProps) {
  return (
    <footer className="footer">
      <div className="status-grp">
        <div className={`stat err${errors === 0 ? " zero" : ""}`}>
          <span className="dot" />
          {errors} Errors
        </div>
        <div className={`stat warn${warnings === 0 ? " zero" : ""}`}>
          <span className="dot" />
          {warnings} Warnings
        </div>
      </div>
      <div className="zoom-grp">
        <span className="ztip">
          Scroll to zoom · drag canvas to pan · Del to delete
        </span>
        <button className="iconbtn" title="Zoom out" onClick={onZoomOut}>
          -
        </button>
        <span className="zlevel">{Math.round(zoom * 100)}%</span>
        <button className="iconbtn" title="Zoom in" onClick={onZoomIn}>
          +
        </button>
        <button className="iconbtn" title="Fit to view" onClick={onFit}>
          []
        </button>
      </div>
    </footer>
  )
}
