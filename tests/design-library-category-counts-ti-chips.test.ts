import { expect, test } from "bun:test"
import { LIBRARY } from "../lib/system-block-library/library"

test("design library category counts equal their displayed chip totals", () => {
  expect(
    Object.fromEntries(
      LIBRARY.map((category) => [category.name, category.count]),
    ),
  ).toEqual({
    "Battery Management": 6,
    Communication: 6,
    Memory: 1,
    "Processing & Security": 3,
    Power: 9,
    "Motor Driver": 2,
    Sensor: 5,
  })
})
