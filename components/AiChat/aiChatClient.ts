import type {
  AiChatDesignContext,
  AiChatMessage,
  AiChatResponse,
} from "./aiChatTypes"
import { createOpenAiSystemBlockChatRequest } from "./openAiSystemBlockPrompt"

const DEFAULT_AI_CHAT_ENDPOINT = "/api/ai/system-block-chat"

interface SendAiChatMessageParams {
  context: AiChatDesignContext
  messages: AiChatMessage[]
}

function getAiChatEndpoint() {
  return import.meta.env.VITE_AI_CHAT_ENDPOINT ?? DEFAULT_AI_CHAT_ENDPOINT
}

function normalizeAiChatResponse(response: AiChatResponse): AiChatResponse {
  return {
    ...response,
    actions: response.actions ?? [],
    suggestedActions: response.suggestedActions ?? [],
    systemJsonPatchSummary: response.systemJsonPatchSummary ?? "",
  }
}

function parseAiChatResponse(payload: unknown): AiChatResponse {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return normalizeAiChatResponse(payload as AiChatResponse)
  }

  if (
    payload &&
    typeof payload === "object" &&
    "output_parsed" in payload &&
    payload.output_parsed &&
    typeof payload.output_parsed === "object" &&
    "message" in payload.output_parsed &&
    typeof payload.output_parsed.message === "string"
  ) {
    return normalizeAiChatResponse(payload.output_parsed as AiChatResponse)
  }

  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof payload.output_text === "string"
  ) {
    try {
      const parsed = JSON.parse(payload.output_text)
      if (
        parsed &&
        typeof parsed === "object" &&
        "message" in parsed &&
        typeof parsed.message === "string"
      ) {
        return normalizeAiChatResponse(parsed as AiChatResponse)
      }
    } catch {
      // Plain text responses are still valid for development endpoints.
    }

    return normalizeAiChatResponse({ message: payload.output_text })
  }

  return normalizeAiChatResponse({
    message:
      "I received a response, but it did not match the expected chat format.",
  })
}

export async function sendAiChatMessage({
  context,
  messages,
}: SendAiChatMessageParams): Promise<AiChatResponse> {
  const openAiRequest = createOpenAiSystemBlockChatRequest({
    context,
    messages,
  })

  const response = await fetch(getAiChatEndpoint(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      openAiRequest,
      context,
      messages,
    }),
  })

  if (!response.ok) {
    let errorMessage: string | null = null
    try {
      const payload = await response.json()
      if (
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
      ) {
        errorMessage = payload.message
      }
    } catch {
      errorMessage = null
    }

    if (errorMessage) throw new Error(errorMessage)
    throw new Error(`AI chat request failed with status ${response.status}`)
  }

  return parseAiChatResponse(await response.json())
}
