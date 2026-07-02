import { expect, test } from "bun:test"
import { formatPackageDisplayName } from "../../lib/bom/formatPackageDisplayName"

test("formatPackageDisplayName converts footprinter slugs into readable labels", () => {
  expect(formatPackageDisplayName("pinrow2_p2.54_female")).toBe(
    "PinHeader_1x02_P2.54mm_Vertical_Female",
  )
  expect(formatPackageDisplayName("pinrow5")).toBe(
    "PinHeader_1x05_P2.54mm_Vertical",
  )
  expect(formatPackageDisplayName("pinrow6_rows2_p2.54mm_male")).toBe(
    "PinHeader_2x03_P2.54mm_Vertical",
  )
  expect(formatPackageDisplayName("res0402")).toBe("Res0402")
  expect(formatPackageDisplayName("0402")).toBe("0402")
  expect(formatPackageDisplayName("QFN-32")).toBe("QFN_32")
  expect(formatPackageDisplayName("WQFN-16")).toBe("WQFN_16")
  expect(formatPackageDisplayName("SOT-223")).toBe("SOT_223")
  expect(
    formatPackageDisplayName(
      "kicad:Battery/BatteryHolder_TruPower_BH-331P_3xAA",
    ),
  ).toBe("kicad:Battery/BatteryHolder_TruPower_BH-331P_3xAA")
})
