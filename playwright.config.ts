import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  // Reuse the app's Vite dev server: it resolves resvg-wasm's `?url` wasm
  // import and serves the harness pages under browser-tests/.
  webServer: {
    command: "bun run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
