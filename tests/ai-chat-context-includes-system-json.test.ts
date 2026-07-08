import { expect, test } from "bun:test"
import { createAiChatDesignContext } from "../components/AiChat"
import type {
  SystemBlock,
  SystemConnection,
  SystemJson,
  SystemPort,
} from "../lib/system-json/system-json"

const blockA: SystemBlock = {
  type: "system_block",
  system_diagram_id: "diagram_1",
  system_block_id: "block_a",
  center: { x: 0, y: 0 },
  size: { width: 120, height: 80 },
  label: "Controller",
  category: ["Embedded Processing and Device Control"],
}

const blockB: SystemBlock = {
  type: "system_block",
  system_diagram_id: "diagram_1",
  system_block_id: "block_b",
  center: { x: 200, y: 0 },
  size: { width: 120, height: 80 },
  label: "Sensor",
  category: ["Measurement and Sensing"],
}

const portA: SystemPort = {
  type: "system_port",
  system_diagram_id: "diagram_1",
  system_port_id: "port_a",
  system_block_id: "block_a",
  side_of_block: "right",
  label: "I2C",
}

const portB: SystemPort = {
  type: "system_port",
  system_diagram_id: "diagram_1",
  system_port_id: "port_b",
  system_block_id: "block_b",
  side_of_block: "left",
  label: "I2C",
}

const connection: SystemConnection = {
  type: "system_connection",
  system_diagram_id: "diagram_1",
  system_connection_id: "connection_1",
  source_system_port_id: "port_a",
  target_system_port_id: "port_b",
  system_port_ids: ["port_a", "port_b"],
  path: [
    { x: 60, y: 0 },
    { x: 140, y: 0 },
  ],
  label: "I2C",
}

test("AI chat context includes raw SystemJson and summarized connectivity", () => {
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: "diagram_1",
      name: "Test diagram",
    },
    blockA,
    blockB,
    portA,
    portB,
    connection,
  ]

  const context = createAiChatDesignContext({
    projectTitle: "Test project",
    activeTab: "canvas",
    systemJson,
    blocks: [blockA, blockB],
    ports: [portA, portB],
    connections: [connection],
    warnings: 1,
    errors: 0,
    selection: { kind: "block", id: "block_a" },
  })

  expect(context.design.systemJson).toEqual(systemJson)
  expect(context.summary.blockCount).toBe(2)
  expect(context.summary.blocks[0]?.connectionIds).toEqual(["connection_1"])
  expect(context.summary.connections[0]?.sourceBlockId).toBe("block_a")
  expect(context.summary.connections[0]?.targetBlockId).toBe("block_b")
})
