const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

interface SystemBlockAiChatOptions {
  openAiApiKey?: string
  openAiModel?: string
}

interface SystemBlockAiChatResult {
  statusCode: number
  payload: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
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
  options: SystemBlockAiChatOptions,
): Promise<SystemBlockAiChatResult> {
  const apiKey = options.openAiApiKey
  if (!apiKey) {
    return {
      statusCode: 501,
      payload: {
        message:
          "AI chat is not configured. Set OPENAI_API_KEY on the server to enable OpenAI responses.",
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

export async function handleSystemBlockAiChatBody(
  body: string,
  options: SystemBlockAiChatOptions,
): Promise<SystemBlockAiChatResult> {
  try {
    return await forwardToOpenAi(parseRequestBody(body), options)
  } catch (error) {
    return {
      statusCode: 400,
      payload: {
        message: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
