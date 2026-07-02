import { expect, test } from "bun:test"
import { shouldDrawSharedFooter } from "../../lib/pdfgen/pages"

test("project details pages use the shared footer", () => {
  expect(
    shouldDrawSharedFooter({
      type: "project_details",
    }),
  ).toBe(true)
  expect(
    shouldDrawSharedFooter({
      type: "title",
      projectName: "System Block Design",
    }),
  ).toBe(false)
})
