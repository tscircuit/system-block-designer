import { z } from "zod"

export const Point = z.object({
  x: z.number(),
  y: z.number(),
})
export type Point = z.infer<typeof Point>

export const Size = z.object({
  width: z.number(),
  height: z.number(),
})
export type Size = z.infer<typeof Size>

export const SystemBlockInterface = z.object({
  name: z.string(),
  kind: z.string(),
  i2cPins: z.record(z.string()).optional(),
})
export type SystemBlockInterface = z.infer<typeof SystemBlockInterface>

export const SystemDiagram = z.object({
  type: z.literal("system_diagram"),
  system_diagram_id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})
export type SystemDiagram = z.infer<typeof SystemDiagram>

export const SystemBlock = z.object({
  type: z.literal("system_block"),
  system_diagram_id: z.string(),
  system_block_id: z.string(),
  center: Point,
  size: Size,
  label: z.string().optional(),
  category: z.array(z.string()),
  icon: z.string().optional(),
  part_number: z.string().optional(),
  description: z.string().optional(),
  subcircuit_id: z.string().optional(),
  interfaces: z.array(SystemBlockInterface).optional(),
})
export type SystemBlock = z.infer<typeof SystemBlock>

export const SystemPort = z.object({
  type: z.literal("system_port"),
  system_diagram_id: z.string(),
  system_port_id: z.string(),
  system_block_id: z.string(),
  label: z.string().optional(),
  side_of_block: z.union([
    z.literal("top"),
    z.literal("bottom"),
    z.literal("left"),
    z.literal("right"),
  ]),
})
export type SystemPort = z.infer<typeof SystemPort>

export const SystemConnection = z.object({
  type: z.literal("system_connection"),
  system_diagram_id: z.string(),
  system_connection_id: z.string(),
  source_system_port_id: z.string().optional(),
  target_system_port_id: z.string().optional(),
  system_port_ids: z.array(z.string()).optional(),
  path: z.array(Point),
  label: z.string().optional(),
})
export type SystemConnection = z.infer<typeof SystemConnection>

export const SystemJson = z.union([
  SystemDiagram,
  SystemBlock,
  SystemPort,
  SystemConnection,
])
export type SystemJson = z.infer<typeof SystemJson>

export const SystemJsonArray = z.array(SystemJson)
export type SystemJsonArray = z.infer<typeof SystemJsonArray>
