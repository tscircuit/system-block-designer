import { expect, test } from "@playwright/test"

test("rasterizeSvgInBrowser produces PNG bytes in the browser", async ({
  page,
}) => {
  await page.goto("http://localhost:3070")
  await expect(page.locator("#output")).toContainText("Success", {
    timeout: 30000,
  })
})

test("the real system-diagram SVG rasterizes in the browser", async ({
  page,
}) => {
  await page.goto("http://localhost:3070?test_to_run=system_diagram")
  await expect(page.locator("#output")).toContainText("Success", {
    timeout: 30000,
  })
})

test("createPdf builds a PDF in the browser with no rasterizer passed", async ({
  page,
}) => {
  await page.goto("http://localhost:3070?test_to_run=create_pdf")
  await expect(page.locator("#output")).toContainText("Success", {
    timeout: 30000,
  })
})
