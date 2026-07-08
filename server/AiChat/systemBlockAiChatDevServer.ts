import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

interface SystemBlockAiChatDevServerOptions {
  openAiApiKey?: string
  openAiModel?: string
}

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

function parseRequestBody(body: string) {
  const payload = JSON.parse(body) as { openAiRequest?: unknown }
  if (!payload.openAiRequest || typeof payload.openAiRequest !== "object") {
    throw new Error("Missing openAiRequest payload")
  }
  return payload.openAiRequest
}

function extractOpenAiErrorMessage(payload: unknown) {
  if (!isRecord(payload)) return null
  const error = payload.error
  if (!isRecord(error)) return null
  return typeof error.message === "string" ? error.message : null
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) return null
  if (typeof payload.output_text === "string") return payload.output_text

  const output = payload.output
  if (!Array.isArray(output)) return null

  for (const outputItem of output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) continue

    for (const contentItem of outputItem.content) {
      if (!isRecord(contentItem)) continue
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text
      }
    }
  }

  return null
}

function normalizeOpenAiPayload(payload: unknown) {
  const outputText = extractOutputText(payload)
  if (!outputText) return payload

  try {
    const parsed = JSON.parse(outputText)
    if (
      isRecord(parsed) &&
      "message" in parsed &&
      typeof parsed.message === "string"
    ) {
      return parsed
    }
  } catch {
    return { message: outputText }
  }

  return { message: outputText }
}

function applyConfiguredModel(openAiRequest: unknown, model?: string) {
  if (!model || !isRecord(openAiRequest)) return openAiRequest
  return {
    ...openAiRequest,
    model,
  }
}

async function forwardToOpenAi(
  openAiRequest: unknown,
  options: SystemBlockAiChatDevServerOptions,
) {
  const apiKey = options.openAiApiKey ?? process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 501,
      payload: {
        message:
          "AI chat is not configured. Set OPENAI_API_KEY on the dev server to enable OpenAI responses.",
      },
    }
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(
      applyConfiguredModel(openAiRequest, options.openAiModel),
    ),
  })

  const payload = await response.json()

  if (!response.ok) {
    return {
      statusCode: response.status,
      payload: {
        message:
          extractOpenAiErrorMessage(payload) ??
          `OpenAI request failed with status ${response.status}`,
      },
    }
  }

  return {
    statusCode: response.status,
    payload: normalizeOpenAiPayload(payload),
  }
}

export function systemBlockAiChatDevServer(
  options: SystemBlockAiChatDevServerOptions = {},
): Plugin {
  return {
    name: "system-block-ai-chat-dev-server",
    configureServer(server) {
      server.middlewares.use(
        "/api/ai/system-block-chat",
        async (request, response) => {
          if (request.method !== "POST") {
            sendJson(response, 405, { message: "Method not allowed" })
            return
          }

          try {
            const openAiRequest = parseRequestBody(
              await readRequestBody(request),
            )
            const result = await forwardToOpenAi(openAiRequest, options)
            sendJson(response, result.statusCode, result.payload)
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error)
            sendJson(response, 400, { message })
          }
        },
      )
    },
  }
}
