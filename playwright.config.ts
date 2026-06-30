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
  reporter: "html",
  use: {
    actionTimeout: 0,
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run start:browser-test-server",
    port: 3070,
    reuseExistingServer: !process.env.CI,
  },
})
