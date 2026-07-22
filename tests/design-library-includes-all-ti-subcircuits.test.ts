import { expect, test } from "bun:test"
import { TiSubcircuitComponents } from "@tsci/tscircuit.ti"
import { LIBRARY } from "../lib/system-block-library/library"
import {
  TiSubcircuitDefinitions,
  TiSystemBlockClasses,
} from "../lib/system-blocks/TiSubcircuits"

test("the design library includes every TI subcircuit", () => {
  for (const componentName of Object.keys(TiSubcircuitComponents)) {
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
})
