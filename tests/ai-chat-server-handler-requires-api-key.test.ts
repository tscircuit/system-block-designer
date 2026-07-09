import { expect, test } from "bun:test"
import { handleSystemBlockAiChatBody } from "../server/AiChat/systemBlockAiChatHandler"

test("AI chat server handler requires an OpenAI API key", async () => {
  const result = await handleSystemBlockAiChatBody(
    JSON.stringify({
      openAiRequest: {
        model: "gpt-test",
        input: [],
      },
    }),
    {},
  )

  expect(result.statusCode).toBe(501)
  expect(result.payload).toEqual({
    message:
      "AI chat is not configured. Set OPENAI_API_KEY on the server to enable OpenAI responses.",
  })
})
