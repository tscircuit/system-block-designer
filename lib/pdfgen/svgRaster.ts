import { Resvg } from "@resvg/resvg-js"

export function rasterizeSvg(svg: string, targetWidth: number) {
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
