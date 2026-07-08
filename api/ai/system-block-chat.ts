import type { IncomingMessage, ServerResponse } from "node:http"

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

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

function getOpenAiRequest(body: string) {
  const payload = JSON.parse(body) as { openAiRequest?: unknown }
  if (!isRecord(payload.openAiRequest)) {
    throw new Error("Missing openAiRequest payload")
  }
  return payload.openAiRequest
}

function getOpenAiErrorMessage(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.error)) return null
  return typeof payload.error.message === "string"
    ? payload.error.message
    : null
}

function withConfiguredModel(openAiRequest: Record<string, unknown>) {
  if (!process.env.OPENAI_MODEL) return openAiRequest
  return { ...openAiRequest, model: process.env.OPENAI_MODEL }
}

async function forwardToOpenAi(openAiRequest: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 501,
      payload: {
        message:
          "AI chat is not configured. Set OPENAI_API_KEY on the server to enable OpenAI responses.",
      },
    }
  }

  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(withConfiguredModel(openAiRequest)),
  })
  const payload = await openAiResponse.json()

  return {
    statusCode: openAiResponse.status,
    payload: openAiResponse.ok
      ? payload
      : {
          message:
            getOpenAiErrorMessage(payload) ??
            `OpenAI request failed with status ${openAiResponse.status}`,
        },
  }
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed" })
    return
  }

  try {
    const result = await forwardToOpenAi(
      getOpenAiRequest(await readRequestBody(request)),
    )
    sendJson(response, result.statusCode, result.payload)
  } catch (error) {
    sendJson(response, 400, {
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
