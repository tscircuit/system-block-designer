import { expect, test } from "bun:test"
import { createOpenAiSystemBlockChatRequest } from "../components/AiChat"
import type { AiChatDesignContext, AiChatMessage } from "../components/AiChat"

test("AI chat OpenAI request sends design context as JSON", () => {
  const context: AiChatDesignContext = {
    schemaVersion: "system-block-designer.ai-chat.v1",
    project: {
      title: "Door Controller",
      activeTab: "canvas",
    },
    designLibrary: [],
    design: {
      systemJson: [],
    },
    summary: {
      blockCount: 0,
      portCount: 0,
      connectionCount: 0,
      warningCount: 0,
      errorCount: 0,
      selected: null,
      blocks: [],
      connections: [],
    },
  }
  const messages: AiChatMessage[] = [
    {
      id: "message_1",
      role: "user",
      content: "Add a BLE radio.",
      createdAt: "2026-07-07T00:00:00.000Z",
    },
  ]

  const request = createOpenAiSystemBlockChatRequest({
    context,
    messages,
    model: "gpt-test",
  })
  const contextPayload = JSON.parse(request.input[0]!.content)

  expect(request.model).toBe("gpt-test")
  expect(contextPayload).toEqual({
    kind: "system_block_designer_context",
    context,
  })
  expect(request.input[1]).toEqual({
    role: "user",
    content: "Add a BLE radio.",
  })
  expect(request.text.format.type).toBe("json_schema")
})
