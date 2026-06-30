import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./browser-tests",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
  },
  // Reuse the app's Vite dev server: it resolves resvg-wasm's `?url` wasm
  // import and serves the harness pages under browser-tests/.
  webServer: {
    command: "bun run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
