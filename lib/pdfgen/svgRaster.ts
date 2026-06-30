import { type ResvgRenderOptions, Resvg, initWasm } from "@resvg/resvg-wasm"
import liberationSansFont from "./assets/liberation-sans-font"
import type { RasterizedImage } from "./types"

// resvg runs in the browser via WebAssembly. Unlike the native build it must be
// initialized once and has no system fonts, so we bundle one (Liberation Sans).
const FONT_FAMILY = "Liberation Sans"
let wasmReady: Promise<unknown> | null = null
let fontBuffer: Uint8Array | null = null

/**
 * Node/tests initialize with explicit wasm bytes read off disk; the browser
 * auto-initializes from the asset URL the bundler emits.
 */
export function initResvgWasm(input: Parameters<typeof initWasm>[0]) {
  if (!wasmReady) wasmReady = initWasm(input)
  return wasmReady
}

export async function rasterizeSvg(
  svg: string,
  targetWidth: number,
): Promise<RasterizedImage> {
  if (!wasmReady) {
    const wasmUrl = (await import("@resvg/resvg-wasm/index_bg.wasm?url"))
      .default
    wasmReady = initWasm(fetch(wasmUrl))
  }
  await wasmReady
  if (!fontBuffer) {
    fontBuffer = Uint8Array.from(atob(liberationSansFont), (char) =>
      char.charCodeAt(0),
    )
  }

  const options: ResvgRenderOptions = {
    background: "white",
    fitTo: { mode: "width", value: Math.max(1, Math.round(targetWidth)) },
    font: {
      fontBuffers: [fontBuffer],
      defaultFontFamily: FONT_FAMILY,
      sansSerifFamily: FONT_FAMILY,
      monospaceFamily: FONT_FAMILY,
    },
  }

  const rendered = new Resvg(svg, options).render()
  return {
    bytes: rendered.asPng(),
    width: rendered.width,
    height: rendered.height,
  }
}
