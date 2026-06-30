import { expect, test } from "@playwright/test"

test("generates a project PDF in the browser", async ({ page }) => {
  await page.goto("/browser-tests/generate-pdf-in-browser.html")
  await expect(page.locator("#output")).toContainText("Success", {
    timeout: 30000,
  })
})
