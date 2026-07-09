import type { AiChatDesignContext, AiChatMessage } from "./aiChatTypes"

const DEFAULT_OPENAI_MODEL = "gpt-5.5"

export const SYSTEM_BLOCK_AI_INSTRUCTIONS = [
  "You are an expert system block diagram design assistant.",
  "Help the user generate, edit, review, and explain system block diagrams.",
  "Use the provided design context JSON as the source of truth.",
  "When adding a block, choose a matching entry from context.designLibrary. Use that entry's category, icon, subcircuitId, and defaultSize unless the existing design context requires a small placement adjustment.",
  "Do not invent new block categories or block families. If no suitable designLibrary entry exists, explain that limitation instead of creating a block action.",
  "When making design changes, return both a concise message and machine-readable actions that can be applied directly to the SystemJson.",
  "Prefer upsert actions for new or replaced blocks, ports, and connections. Use update actions for existing items whose ids are present in the context.",
  "For system-level buses such as I2C or SPI, create one connection between the two blocks, not one connection per signal pin. Include all participating signal port ids in system_port_ids when useful.",
  "Do not include connection path coordinates unless they are already known; the application will route connection paths after applying actions.",
  "Set optional action fields to null when they are not needed.",
  "Do not include block interfaces in action payloads; represent buses with ports and connections.",
  "When explaining design changes, be specific about blocks, ports, connections, interfaces, BOM impact, and validation risks.",
  "Do not invent current diagram state that is not present in the JSON context.",
].join(" ")

const NULLABLE_STRING_SCHEMA = { type: ["string", "null"] } as const

const NULLABLE_STRING_ARRAY_SCHEMA = {
  anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
} as const

const SYSTEM_BLOCK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["system_block"] },
    system_diagram_id: { type: "string" },
    system_block_id: { type: "string" },
    center: {
      type: "object",
      additionalProperties: false,
      properties: {
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["x", "y"],
    },
    size: {
      type: "object",
      additionalProperties: false,
      properties: {
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["width", "height"],
    },
    label: NULLABLE_STRING_SCHEMA,
    category: { type: "array", items: { type: "string" } },
    icon: NULLABLE_STRING_SCHEMA,
    icon_color: {
      type: ["string", "null"],
      enum: [
        "#00A4A4",
        "#0069A4",
        "#0007A4",
        "#6600A4",
        "#A40076",
        "#A49D00",
        "#A48000",
        "#A45900",
        "#000000",
        null,
      ],
    },
    part_number: NULLABLE_STRING_SCHEMA,
    description: NULLABLE_STRING_SCHEMA,
    subcircuit_id: NULLABLE_STRING_SCHEMA,
    interfaces: { type: "null" },
  },
  required: [
    "type",
    "system_diagram_id",
    "system_block_id",
    "center",
    "size",
    "label",
    "category",
    "icon",
    "icon_color",
    "part_number",
    "description",
    "subcircuit_id",
    "interfaces",
  ],
} as const

const SYSTEM_PORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["system_port"] },
    system_diagram_id: { type: "string" },
    system_port_id: { type: "string" },
    system_block_id: { type: "string" },
    label: NULLABLE_STRING_SCHEMA,
    side_of_block: {
      type: "string",
      enum: ["top", "right", "bottom", "left"],
    },
  },
  required: [
    "type",
    "system_diagram_id",
    "system_port_id",
    "system_block_id",
    "label",
    "side_of_block",
  ],
} as const

const POINT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["x", "y"],
} as const

const SYSTEM_CONNECTION_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["system_connection"] },
    system_diagram_id: { type: "string" },
    system_connection_id: { type: "string" },
    source_system_port_id: NULLABLE_STRING_SCHEMA,
    target_system_port_id: NULLABLE_STRING_SCHEMA,
    system_port_ids: NULLABLE_STRING_ARRAY_SCHEMA,
    path: {
      anyOf: [{ type: "array", items: POINT_SCHEMA }, { type: "null" }],
    },
    label: NULLABLE_STRING_SCHEMA,
  },
  required: [
    "type",
    "system_diagram_id",
    "system_connection_id",
    "source_system_port_id",
    "target_system_port_id",
    "system_port_ids",
    "path",
    "label",
  ],
} as const

const SYSTEM_BLOCK_PATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    center: {
      anyOf: [SYSTEM_BLOCK_SCHEMA.properties.center, { type: "null" }],
    },
    size: {
      anyOf: [SYSTEM_BLOCK_SCHEMA.properties.size, { type: "null" }],
    },
    label: NULLABLE_STRING_SCHEMA,
    category: NULLABLE_STRING_ARRAY_SCHEMA,
    icon: NULLABLE_STRING_SCHEMA,
    icon_color: SYSTEM_BLOCK_SCHEMA.properties.icon_color,
    part_number: NULLABLE_STRING_SCHEMA,
    description: NULLABLE_STRING_SCHEMA,
    subcircuit_id: NULLABLE_STRING_SCHEMA,
    interfaces: { type: "null" },
  },
  required: [
    "center",
    "size",
    "label",
    "category",
    "icon",
    "icon_color",
    "part_number",
    "description",
    "subcircuit_id",
    "interfaces",
  ],
} as const

export const SYSTEM_BLOCK_AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: {
      type: "string",
      description: "A concise assistant response to show in the chat UI.",
    },
    actions: {
      type: "array",
      description:
        "Machine-readable SystemJson edit actions to apply immediately. Use an empty array when no diagram edit is requested.",
      items: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["upsert_block"] },
              block: SYSTEM_BLOCK_SCHEMA,
            },
            required: ["type", "block"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["upsert_port"] },
              port: SYSTEM_PORT_SCHEMA,
            },
            required: ["type", "port"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["upsert_connection"] },
              connection: SYSTEM_CONNECTION_INPUT_SCHEMA,
            },
            required: ["type", "connection"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["update_block"] },
              blockId: { type: "string" },
              patch: SYSTEM_BLOCK_PATCH_SCHEMA,
            },
            required: ["type", "blockId", "patch"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["update_port"] },
              portId: { type: "string" },
              patch: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: NULLABLE_STRING_SCHEMA,
                  side_of_block: {
                    type: ["string", "null"],
                    enum: ["top", "right", "bottom", "left", null],
                  },
                },
                required: ["label", "side_of_block"],
              },
            },
            required: ["type", "portId", "patch"],
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["update_connection"] },
              connectionId: { type: "string" },
              patch: {
                type: "object",
                additionalProperties: false,
                properties: {
                  source_system_port_id: NULLABLE_STRING_SCHEMA,
                  target_system_port_id: NULLABLE_STRING_SCHEMA,
                  system_port_ids: NULLABLE_STRING_ARRAY_SCHEMA,
                  path: {
                    anyOf: [
                      { type: "array", items: POINT_SCHEMA },
                      { type: "null" },
                    ],
                  },
                  label: NULLABLE_STRING_SCHEMA,
                },
                required: [
                  "source_system_port_id",
                  "target_system_port_id",
                  "system_port_ids",
                  "path",
                  "label",
                ],
              },
            },
            required: ["type", "connectionId", "patch"],
          },
        ],
      },
    },
    suggestedActions: {
      type: "array",
      description: "Optional follow-up actions the user may take.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          description: { type: "string" },
        },
        required: ["label", "description"],
      },
    },
    systemJsonPatchSummary: {
      type: "string",
      description:
        "Plain-language summary of any suggested SystemJson changes. Empty string when no edit is suggested.",
    },
  },
  required: [
    "message",
    "actions",
    "suggestedActions",
    "systemJsonPatchSummary",
  ],
} as const

export interface CreateOpenAiSystemBlockChatRequestParams {
  context: AiChatDesignContext
  messages: AiChatMessage[]
  model?: string
}

export function createOpenAiSystemBlockChatRequest({
  context,
  messages,
  model = DEFAULT_OPENAI_MODEL,
}: CreateOpenAiSystemBlockChatRequestParams) {
  return {
    model,
    instructions: SYSTEM_BLOCK_AI_INSTRUCTIONS,
    input: [
      {
        role: "developer",
        content: JSON.stringify(
          {
            kind: "system_block_designer_context",
            context,
          },
          null,
          2,
        ),
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
    text: {
      format: {
        type: "json_schema",
        name: "system_block_design_chat_response",
        strict: true,
        schema: SYSTEM_BLOCK_AI_RESPONSE_SCHEMA,
      },
    },
  }
}
