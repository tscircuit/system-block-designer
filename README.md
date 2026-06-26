# System block designer

### SystemConnection

Defines a connection between ports of blocks in a system diagram

```
interface SystemConnection {
  type: "system_connection"
  system_diagram_id: string
  system_connection_id: string
  source_system_port_id?: string
  target_system_port_id?: string
  system_port_ids?: string[]
  path: Point[]
  label?: string
}
```

### SystemPort

Defines a port on a system diagram block

```
interface SystemPort {
  type: "system_port"
  system_diagram_id: string
  system_port_id: string
  system_block_id: string
  label?: string
  side_of_block: "top" | "bottom" | "left" | "right"
}
```

### SystemBlock

Defines a block in a system diagram

```
interface SystemBlock {
  type: "system_block"
  system_diagram_id: string
  system_block_id: string
  center: Point
  size: Size
  label?: string
  category: Category[] // Battery, Voltage regulator, .... etc
  icon?: string
  part_number?: string
  description?: string
  subcircuit_id?: string
}
```

### SystemDiagram
Defines a system block diagram
```
interface SystemDiagram {
  type: "system_diagram"
  system_diagram_id: string
  name?: string
  description?: string
  width?: Length
  height?: Length
}
```
