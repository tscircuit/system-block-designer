import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { systemBlockAiChatDevServer } from "./server/AiChat/systemBlockAiChatDevServer"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      systemBlockAiChatDevServer({
        openAiApiKey: env.OPENAI_API_KEY,
        openAiModel: env.OPENAI_MODEL,
      }),
    ],
    // resvg-wasm is loaded via its wasm asset URL at runtime; keep Vite from
    // trying to pre-bundle the package and let it emit the .wasm as an asset.
    assetsInclude: ["**/*.wasm"],
    optimizeDeps: {
      exclude: ["@resvg/resvg-wasm"],
    },
  }
})
