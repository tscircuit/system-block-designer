import { expect, test } from "bun:test"
import { formatBomDescription } from "../../lib/bom/formatBomDescription"

test("formatBomDescription replaces raw package slugs with the display package name", () => {
  expect(
    formatBomDescription(
      "2-pin female pin header using package pinrow2_p2.54_female",
      "pinrow2_p2.54_female",
    ),
  ).toBe("2-pin female pin header using package PinHeader_1x02_P2.54_Female")

  expect(formatBomDescription("Resistor, 100k, 0402", "0402")).toBe(
    "Resistor, 100k, 0402",
  )

  expect(
    formatBomDescription(
      "Package pinrow6_rows2_p2.54mm_male matches pinrow6_rows2_p2.54mm_male",
      "pinrow6_rows2_p2.54mm_male",
    ),
  ).toBe(
    "Package PinHeader_2x03_P2.54mm_Male matches PinHeader_2x03_P2.54mm_Male",
  )
})
