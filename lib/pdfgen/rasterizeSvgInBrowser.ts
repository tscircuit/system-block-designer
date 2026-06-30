import type { RasterizedImage } from "./types"

/**
 * Browser SVG rasterizer that uses the platform `<canvas>` instead of the
 * Node-only resvg native module, so `createPdf` can run fully in the browser.
 *
 * The SVG is loaded into an `<img>` via a blob URL, painted onto a canvas at
 * the requested width (aspect-ratio preserved), and read back as PNG bytes that
 * `pdf-lib`'s `embedPng` accepts.
 */
export async function rasterizeSvgInBrowser(
  svg: string,
  targetWidth: number,
): Promise<RasterizedImage> {
  if (typeof document === "undefined") {
    throw new Error(
      "rasterizeSvgInBrowser requires a DOM environment (document is undefined)",
    )
  }

  const intrinsic = getSvgIntrinsicSize(svg)
  const width = Math.max(1, Math.round(targetWidth))
  const height = Math.max(
    1,
    Math.round((width / intrinsic.width) * intrinsic.height),
  )

  const image = await loadSvgImage(svg, width, height)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error(
      "Failed to acquire a 2D canvas context for SVG rasterization",
    )
  }

  // resvg renders onto an opaque white background; match it so the embedded
  // PNG looks the same as the Node-generated output.
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const bytes = await canvasToPngBytes(canvas)
  return { bytes, width, height }
}

function loadSvgImage(
  svg: string,
  width: number,
  height: number,
): Promise<HTMLImageElement> {
  const sizedSvg = ensureSvgSize(svg, width, height)
  const blob = new Blob([sizedSvg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const image = new Image(width, height)

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG into an image for rasterization"))
    }
    image.src = url
  })
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("canvas.toBlob returned null while encoding PNG"))
        return
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject)
    }, "image/png")
  })
}

/**
 * Some browsers refuse to decode an SVG `<img>` that has no intrinsic size, so
 * inject width/height onto the root `<svg>` when they are missing.
 */
function ensureSvgSize(svg: string, width: number, height: number): string {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0]
  if (!tag) return svg

  const inserts: string[] = []
  if (!/\bwidth\s*=/i.test(tag)) inserts.push(`width="${width}"`)
  if (!/\bheight\s*=/i.test(tag)) inserts.push(`height="${height}"`)
  if (inserts.length === 0) return svg

  const sizedTag = tag.replace(/^<svg/i, `<svg ${inserts.join(" ")}`)
  return svg.replace(tag, sizedTag)
}

function getSvgIntrinsicSize(svg: string): { width: number; height: number } {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? ""
  const width = parseLength(tag.match(/\bwidth\s*=\s*["']?([\d.]+)/i)?.[1])
  const height = parseLength(tag.match(/\bheight\s*=\s*["']?([\d.]+)/i)?.[1])
  if (width && height) return { width, height }

  const viewBox = tag.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] }
    }
  }

  return { width: width || 800, height: height || 600 }
}

function parseLength(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}
