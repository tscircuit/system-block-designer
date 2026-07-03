export const DEFAULT_ICON_COLOR = "#1f2733"

export const ICON_COLOR_PALETTE = [
  "#00A4A4",
  "#0069A4",
  "#0007A4",
  "#6600A4",
  "#A40076",
  "#A49D00",
  "#A48000",
  "#A45900",
  "#000000",
] as const

export type IconColor = (typeof ICON_COLOR_PALETTE)[number]

const ICON_COLOR_SET = new Set<string>(ICON_COLOR_PALETTE)

export function normalizeIconColor(color: string | undefined) {
  if (!color) return DEFAULT_ICON_COLOR
  const normalized = color.toUpperCase()
  return ICON_COLOR_SET.has(normalized) ? normalized : DEFAULT_ICON_COLOR
}
