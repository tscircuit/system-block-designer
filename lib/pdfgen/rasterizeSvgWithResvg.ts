import { Resvg } from "@resvg/resvg-js"
import type { RasterizedImage } from "./types"

/**
 * Node/test SVG rasterizer backed by the `@resvg/resvg-js` native module.
 *
 * This file must never be imported by browser-bundled code: resvg ships a
 * platform-specific native binary that cannot be loaded in a browser. Pass it
 * to `createPdf` via `options.rasterizeSvg` from Node (e.g. snapshot tests).
 */
export function rasterizeSvgWithResvg(
  svg: string,
  targetWidth: number,
): RasterizedImage {
  const rendered = new Resvg(svg, {
    background: "white",
    fitTo: {
      mode: "width",
      value: Math.max(1, Math.round(targetWidth)),
    },
    font: {
      loadSystemFonts: true,
    },
    logLevel: "error",
  }).render()

  return {
    bytes: rendered.asPng(),
    width: rendered.width,
    height: rendered.height,
  }
}
