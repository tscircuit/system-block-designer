import { expect, test } from "bun:test"
import { formatPackageDisplayName } from "../../lib/bom/formatPackageDisplayName"

test("formatPackageDisplayName pascal-cases footprint slugs", () => {
  expect(formatPackageDisplayName("pinrow2_p2.54_female")).toBe(
    "PinHeader_1x02_P2.54_Female",
  )
  expect(formatPackageDisplayName("pinrow5")).toBe("PinHeader_1x05")
  expect(formatPackageDisplayName("pinrow6_rows2_p2.54mm_male")).toBe(
    "PinHeader_2x03_P2.54mm_Male",
  )
  expect(formatPackageDisplayName("res0402")).toBe("Res0402")
  expect(formatPackageDisplayName("0402")).toBe("0402")
  expect(formatPackageDisplayName("QFN-32")).toBe("QFN_32")
  expect(formatPackageDisplayName("WQFN-16")).toBe("WQFN_16")
  expect(formatPackageDisplayName("SOT-223")).toBe("SOT_223")
  expect(
    formatPackageDisplayName(
      "pinrow2_p2.54_female_locking_header_variant_with_extended_alignment_guide",
    ),
  ).toBe(
    "PinHeader_1x02_P2.54_Female_Locking_Header_Variant_With_Extended_Alignment_Guide",
  )
  expect(
    formatPackageDisplayName(
      "kicad:Battery/BatteryHolder_TruPower_BH-331P_3xAA",
    ),
  ).toBe("kicad:Battery/BatteryHolder_TruPower_BH-331P_3xAA")
})
