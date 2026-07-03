import type { CSSProperties } from "react"
import { ICON_PATHS, type IconName } from "./iconPaths"

interface IconProps {
  name: IconName | string
  size?: number
  x?: number
  y?: number
  style?: CSSProperties
}

export function Icon({ name, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: getIconPath(name) }}
    />
  )
}

export function BlockIcon({ name, x = 0, y = 0, size = 24, style }: IconProps) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none", ...style }}
      dangerouslySetInnerHTML={{ __html: getIconPath(name) }}
    />
  )
}

function getIconPath(name: IconName | string) {
  return name in ICON_PATHS ? ICON_PATHS[name as IconName] : ICON_PATHS.chip
}
