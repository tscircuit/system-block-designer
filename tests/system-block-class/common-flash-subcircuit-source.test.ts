import { expect, test } from "bun:test"
import {
  COMMON_SUBCIRCUIT_IMPORT_PATH,
  COMMON_SUBCIRCUIT_SOURCE_DIRECTORY,
  CommonSubcircuitDefinitions,
  CommonSystemBlockClasses,
} from "../../lib/system-blocks/CommonSubcircuits"
import { SUBCIRCUIT_IMPORT_PATH_BY_COMPONENT_NAME } from "../../lib/system-blocks/SubcircuitRegistry"
import {
  TiSubcircuitDefinitions,
  TiSystemBlockClasses,
} from "../../lib/system-blocks/TiSubcircuits"

test("the Winbond flash subcircuit comes from tscircuit common Experiments", () => {
  expect(COMMON_SUBCIRCUIT_SOURCE_DIRECTORY).toBe("Experiments")
  expect(COMMON_SUBCIRCUIT_IMPORT_PATH).toBe("@tscircuit/common")
  expect(CommonSubcircuitDefinitions).toHaveProperty("FlashMemory_W25Q128JVSIQ")
  expect(CommonSubcircuitDefinitions.FlashMemory_W25Q128JVSIQ).toMatchObject({
    importPath: "@tscircuit/common",
    sourceDirectory: "Experiments",
  })
  expect(CommonSystemBlockClasses).toHaveProperty("FlashMemory_W25Q128JVSIQ")
  expect(TiSubcircuitDefinitions).not.toHaveProperty("FlashMemory_W25Q128JVSIQ")
  expect(TiSystemBlockClasses).not.toHaveProperty("FlashMemory_W25Q128JVSIQ")
  expect(
    SUBCIRCUIT_IMPORT_PATH_BY_COMPONENT_NAME.FlashMemory_W25Q128JVSIQ,
  ).toBe("@tscircuit/common")
})
