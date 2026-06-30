import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  // resvg-wasm is loaded via its wasm asset URL at runtime; keep Vite from
  // trying to pre-bundle the package and let it emit the .wasm as an asset.
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["@resvg/resvg-wasm"],
  },
})
