interface ResvgRenderResult {
  asPng(): Uint8Array
  width: number
  height: number
}

interface ResvgModuleLike {
  Resvg: new (
    svg: string,
    options: {
      background: string
      fitTo: { mode: "width"; value: number }
      font: { loadSystemFonts: boolean }
      logLevel: "error"
    },
  ) => {
    render(): ResvgRenderResult
  }
}

export async function rasterizeSvg(svg: string, targetWidth: number) {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return rasterizeSvgInBrowser(svg, targetWidth)
  }

  const { Resvg } = await importNodeResvg()
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

async function importNodeResvg(): Promise<ResvgModuleLike> {
  // Keep the native `@resvg/resvg-js` dependency out of the browser bundle.
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<ResvgModuleLike>

  return dynamicImport("@resvg/resvg-js")
}

async function rasterizeSvgInBrowser(svg: string, targetWidth: number) {
  const image = await loadSvgImage(svg)
  const width = Math.max(1, Math.round(targetWidth))
  const height = Math.max(
    1,
    Math.round((image.naturalHeight / image.naturalWidth) * width),
  )
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Unable to create canvas context for PDF export")
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const pngBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  )
  if (!pngBlob) {
    throw new Error("Unable to encode PDF export image")
  }

  return {
    bytes: new Uint8Array(await pngBlob.arrayBuffer()),
    width,
    height,
  }
}

async function loadSvgImage(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.decoding = "async"

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () =>
        reject(new Error("Unable to decode schematic SVG for PDF export"))
      image.src = url
    })

    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}
