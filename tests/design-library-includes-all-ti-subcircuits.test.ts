import { expect, test } from "bun:test"
import { TiSubcircuitComponents } from "@tsci/tscircuit.ti"
import { LIBRARY } from "../lib/system-block-library/library"
import {
  TiSubcircuitDefinitions,
  TiSystemBlockClasses,
} from "../lib/system-blocks/TiSubcircuits"

test("the design library includes every TI subcircuit", () => {
  const tiComponentNames = Object.keys(TiSubcircuitComponents).filter(
    (componentName) => componentName !== "FlashMemory_W25Q128JVSIQ",
  )

  for (const componentName of tiComponentNames) {
    const definition =
      TiSubcircuitDefinitions[
        componentName as keyof typeof TiSubcircuitDefinitions
      ]

    expect(definition, `${componentName} definition`).toBeDefined()
    expect(
      TiSystemBlockClasses[componentName as keyof typeof TiSystemBlockClasses],
      `${componentName} system block class`,
    ).toBeDefined()

    const [categoryName, itemType] = definition.category
    const category = LIBRARY.find(({ name }) => name === categoryName)
    expect(category, `${componentName} category`).toBeDefined()
    expect(
      category?.items.some(({ type }) => type === itemType),
      `${componentName} library item`,
    ).toBe(true)
  }

  expect(TiSubcircuitDefinitions).not.toHaveProperty("FlashMemory_W25Q128JVSIQ")
  expect(TiSystemBlockClasses).not.toHaveProperty("FlashMemory_W25Q128JVSIQ")
})
