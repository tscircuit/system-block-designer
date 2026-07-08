import type { IncomingMessage, ServerResponse } from "node:http"
import { handleSystemBlockAiChatBody } from "../../server/AiChat/systemBlockAiChatHandler"

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ""
    request.setEncoding("utf8")
    request.on("data", (chunk) => {
      body += chunk
    })
    request.on("end", () => resolve(body))
    request.on("error", reject)
  })
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.statusCode = statusCode
  response.setHeader("content-type", "application/json")
  response.end(JSON.stringify(payload))
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed" })
    return
  }

  const result = await handleSystemBlockAiChatBody(
    await readRequestBody(request),
    {
      openAiApiKey: process.env.OPENAI_API_KEY,
      openAiModel: process.env.OPENAI_MODEL,
    },
  )
  sendJson(response, result.statusCode, result.payload)
}
