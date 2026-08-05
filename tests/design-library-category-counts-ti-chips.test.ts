import { expect, test } from "bun:test"
import { LIBRARY } from "../lib/system-block-library/library"

test("design library category counts equal their displayed chip totals", () => {
  expect(
    Object.fromEntries(
      LIBRARY.map((category) => [category.name, category.count]),
    ),
  ).toEqual({
    "Battery Management": 10,
    Communication: 7,
    Memory: 1,
    "Processing & Security": 5,
    Power: 13,
    "Motor Driver": 2,
    Sensor: 5,
  })
})
