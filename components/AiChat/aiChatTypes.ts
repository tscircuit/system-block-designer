import type {
  Point,
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../../lib/system-json/system-json"
import type { Selection } from "../DesignCanvas/DesignCanvas.types"

export type AiChatRole = "user" | "assistant"

export interface AiChatMessage {
  id: string
  role: AiChatRole
  content: string
  createdAt: string
}

export interface AiChatDesignContext {
  schemaVersion: "system-block-designer.ai-chat.v1"
  project: {
    title: string
    activeTab: string
  }
  designLibrary: Array<{
    type: string
    category: string[]
    icon: string
    count: number
    subcircuitId: string | null
    defaultSize: {
      width: number | null
      height: number | null
    }
  }>
  design: {
    systemJson: SystemJson[]
  }
  summary: {
    blockCount: number
    portCount: number
    connectionCount: number
    warningCount: number
    errorCount: number
    selected: Selection
    blocks: Array<{
      id: string
      label: string | null
      category: string[]
      partNumber: string | null
      subcircuitId: string | null
      portIds: string[]
      connectionIds: string[]
    }>
    connections: Array<{
      id: string
      label: string | null
      sourcePortId: string | null
      targetPortId: string | null
      sourceBlockId: string | null
      targetBlockId: string | null
    }>
  }
}

export interface CreateAiChatDesignContextParams {
  projectTitle: string
  activeTab: string
  systemJson: SystemJson[]
  blocks: SystemBlock[]
  ports: SystemPort[]
  connections: SystemConnection[]
  warnings: number
  errors: number
  selection: Selection
}

export type AiSystemBlockInput = SystemBlock

export type AiSystemPortInput = SystemPort

export interface AiSystemConnectionInput {
  type: "system_connection"
  system_diagram_id: string
  system_connection_id: string
  source_system_port_id?: string
  target_system_port_id?: string
  system_port_ids?: string[]
  path?: Point[]
  label?: string
}

export type AiDesignAction =
  | {
      type: "upsert_block"
      block: AiSystemBlockInput
    }
  | {
      type: "upsert_port"
      port: AiSystemPortInput
    }
  | {
      type: "upsert_connection"
      connection: AiSystemConnectionInput
    }
  | {
      type: "update_block"
      blockId: string
      patch: Partial<
        Pick<
          SystemBlock,
          | "center"
          | "size"
          | "label"
          | "category"
          | "icon"
          | "icon_color"
          | "part_number"
          | "description"
          | "subcircuit_id"
          | "interfaces"
        >
      >
    }
  | {
      type: "update_port"
      portId: string
      patch: Partial<Pick<SystemPort, "label" | "side_of_block">>
    }
  | {
      type: "update_connection"
      connectionId: string
      patch: Partial<
        Pick<
          AiSystemConnectionInput,
          | "source_system_port_id"
          | "target_system_port_id"
          | "system_port_ids"
          | "path"
          | "label"
        >
      >
    }

export interface AiChatResponse {
  message: string
  actions?: AiDesignAction[]
  suggestedActions?: Array<{
    label: string
    description: string
  }>
  systemJsonPatchSummary?: string
}
