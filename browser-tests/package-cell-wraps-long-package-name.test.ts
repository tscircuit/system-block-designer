import { expect, test } from "@playwright/test"

test("keeps long package names inside the package cell", async ({ page }) => {
  await page.setViewportSize({ width: 1504, height: 720 })
  await page.goto("/browser-tests/bom-package-cell-wrap.html")

  const packageCell = page.locator("tbody tr").first().locator("td").nth(2)
  const packageValue = page.locator(".bom-package-value")

  await expect(packageValue).toContainText("pinrow2_p2.54_female")

  const [cellBox, valueBox] = await Promise.all([
    packageCell.boundingBox(),
    packageValue.boundingBox(),
  ])

  expect(cellBox).not.toBeNull()
  expect(valueBox).not.toBeNull()
  expect(valueBox!.x).toBeGreaterThanOrEqual(cellBox!.x - 1)
  expect(valueBox!.x + valueBox!.width).toBeLessThanOrEqual(
    cellBox!.x + cellBox!.width + 1,
  )
})
