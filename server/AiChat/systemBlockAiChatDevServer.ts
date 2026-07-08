import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import { handleSystemBlockAiChatBody } from "./systemBlockAiChatHandler"

interface SystemBlockAiChatDevServerOptions {
  openAiApiKey?: string
  openAiModel?: string
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
            const result = await handleSystemBlockAiChatBody(
              await readRequestBody(request),
              {
                openAiApiKey:
                  options.openAiApiKey ?? process.env.OPENAI_API_KEY,
                openAiModel: options.openAiModel,
              },
            )
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
