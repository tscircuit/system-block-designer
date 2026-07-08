import { handleSystemBlockAiChatBody } from "../../server/AiChat/systemBlockAiChatHandler"

declare const process: {
  env: Record<string, string | undefined>
}

interface VercelRequest {
  method?: string
  body?: unknown
}

interface VercelResponse {
  status(statusCode: number): VercelResponse
  json(payload: unknown): void
}

function stringifyBody(body: unknown) {
  return typeof body === "string" ? body : JSON.stringify(body ?? {})
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    response.status(405).json({ message: "Method not allowed" })
    return
  }

  const result = await handleSystemBlockAiChatBody(
    stringifyBody(request.body),
    {
      openAiApiKey: process.env.OPENAI_API_KEY,
      openAiModel: process.env.OPENAI_MODEL,
    },
  )

  response.status(result.statusCode).json(result.payload)
}
