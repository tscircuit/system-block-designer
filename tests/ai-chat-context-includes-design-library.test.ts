import { expect, test } from "bun:test"
import { createAiChatDesignContext } from "../components/AiChat"

test("AI chat context includes available design library blocks", () => {
  const context = createAiChatDesignContext({
    projectTitle: "Test project",
    activeTab: "canvas",
    systemJson: [],
    blocks: [],
    ports: [],
    connections: [],
    warnings: 0,
    errors: 0,
    selection: null,
  })

  expect(
    context.designLibrary.some(
      (item) =>
        item.type === "Environmental Sensor" &&
        item.category.join("/") === "Sensor/Environmental Sensor" &&
        item.icon === "sensor",
    ),
  ).toBe(true)
  expect(
    context.designLibrary.some(
      (item) =>
        item.type === "Power Monitor" &&
        item.category.join("/") === "Power/Power Monitor" &&
        item.icon === "monitor",
    ),
  ).toBe(true)
})
