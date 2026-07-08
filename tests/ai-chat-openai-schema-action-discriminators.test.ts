import { expect, test } from "bun:test"
import { SYSTEM_BLOCK_AI_RESPONSE_SCHEMA } from "../components/AiChat/openAiSystemBlockPrompt"

function visitSchemaNodes(value: unknown, visit: (node: unknown) => void) {
  visit(value)
  if (Array.isArray(value)) {
    for (const item of value) visitSchemaNodes(item, visit)
    return
  }
  if (!value || typeof value !== "object") return
  for (const item of Object.values(value)) visitSchemaNodes(item, visit)
}

test("AI chat OpenAI schema uses supported action discriminator fields", () => {
  let constKeyCount = 0
  const typePropertySchemas: unknown[] = []

  visitSchemaNodes(SYSTEM_BLOCK_AI_RESPONSE_SCHEMA, (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return
    if ("const" in node) constKeyCount += 1
    if (
      "properties" in node &&
      node.properties &&
      typeof node.properties === "object" &&
      !Array.isArray(node.properties) &&
      "type" in node.properties
    ) {
      typePropertySchemas.push(node.properties.type)
    }
  })

  expect(constKeyCount).toBe(0)
  expect(typePropertySchemas.length).toBeGreaterThan(0)
  expect(
    typePropertySchemas.every(
      (schema) =>
        schema &&
        typeof schema === "object" &&
        !Array.isArray(schema) &&
        "type" in schema,
    ),
  ).toBe(true)
})
