import { expect, test } from "bun:test"
import { routeTemporaryConnectionPath } from "../components/DesignCanvas/systemJsonCanvas"

test("temporary connection from a vertical port keeps forward direction into the target", () => {
  expect(
    routeTemporaryConnectionPath(
      { x: 100, y: 100 },
      { x: 0, y: 1 },
      { x: 200, y: 200 },
    ),
  ).toBe(
    "M 100 100 L 100 115 Q 100 124 100 133 L 100 141 Q 100 150 109 150 L 191 150 Q 200 150 200 159 L 200 167 Q 200 176 200 185 L 200 200",
  )
})
