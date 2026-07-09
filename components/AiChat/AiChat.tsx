import { type FormEvent, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AiSparkleIcon } from "./AiSparkleIcon"
import { Bubble, Marker, Message, MessageScroller } from "./ChatPrimitives"
import { sendAiChatMessage } from "./aiChatClient"
import { createAiChatDesignContext } from "./aiChatContext"
import type {
  AiDesignAction,
  AiChatMessage,
  CreateAiChatDesignContextParams,
} from "./aiChatTypes"
import "./ai-chat.css"

interface AiChatProps {
  contextParams: CreateAiChatDesignContextParams
  onApplyActions?: (actions: AiDesignAction[]) => void
}

function createMessage(
  role: AiChatMessage["role"],
  content: string,
): AiChatMessage {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

export function AiChat({ contextParams, onApplyActions }: AiChatProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<AiChatMessage[]>([])

  const context = useMemo(
    () => createAiChatDesignContext(contextParams),
    [contextParams],
  )

  const startNewChat = () => {
    setMessages([])
    setDraft("")
    setSending(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const prompt = draft.trim()
    if (!prompt || sending) return

    const userMessage = createMessage("user", prompt)
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft("")
    setSending(true)

    try {
      const response = await sendAiChatMessage({
        context,
        messages: nextMessages,
      })
      let applyErrorMessage: string | null = null
      if (response.actions?.length) {
        try {
          onApplyActions?.(response.actions)
        } catch (error) {
          applyErrorMessage =
            error instanceof Error ? error.message : String(error)
        }
      }
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          applyErrorMessage
            ? `${response.message}\n\nI could not apply the generated diagram actions: ${applyErrorMessage}`
            : response.message,
        ),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          `I prepared the prompt with the current design context as JSON, but the AI chat endpoint is not available yet. ${message}`,
        ),
      ])
    } finally {
      setSending(false)
    }
  }

  const showWelcome = messages.length === 0 && !sending

  const panel = open ? (
    <aside className="ai-chat-panel" aria-label="AI chat panel">
      <header className="ai-chat-header">
        <div className="ai-chat-title">
          <AiSparkleIcon />
          <div>
            <strong>Block Diagram Designer</strong>
            <span>AI assistant</span>
          </div>
        </div>
        <div className="ai-chat-header-actions">
          <button
            type="button"
            className="ai-chat-icon-button"
            aria-label="Start new AI chat"
            title="New chat"
            onClick={startNewChat}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            className="ai-chat-icon-button"
            aria-label="Close AI chat"
            title="Close"
            onClick={() => setOpen(false)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </header>
      <MessageScroller
        className={showWelcome ? "ai-message-scroller-empty" : undefined}
      >
        {showWelcome && (
          <div className="ai-chat-welcome">
            <AiSparkleIcon />
            <h2>System block assistant</h2>
            <p>
              Ask for architecture edits, missing connections, BOM alternatives,
              or output preparation.
            </p>
            <small>AI might not always be accurate. Check results.</small>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} role={message.role}>
            <Bubble role={message.role}>{message.content}</Bubble>
          </Message>
        ))}
        {sending && <Marker>Generating response...</Marker>}
      </MessageScroller>
      <form className="ai-chat-composer" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          placeholder="Ask AI to help design this system"
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <button
          type="submit"
          className="ai-chat-send"
          aria-label="Send message"
          title="Send"
          disabled={!draft.trim() || sending}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </button>
      </form>
      <p className="ai-chat-disclaimer">
        Avoid sharing personally identifiable information. Responses may contain
        generated content.
      </p>
    </aside>
  ) : null

  return (
    <>
      <button
        type="button"
        className={`ai-chat-trigger${open ? " active" : ""}`}
        aria-label="Open AI chat"
        title="AI chat"
        onClick={() => setOpen((current) => !current)}
      >
        <AiSparkleIcon />
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  )
}
