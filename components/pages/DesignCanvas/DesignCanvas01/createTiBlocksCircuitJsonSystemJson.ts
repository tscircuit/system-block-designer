import {
  EnvironmentalSensor_HDC3020,
  Microcontroller_MSPM0G3507,
} from "../../../../lib/system-blocks/TiSubcircuits"
import type {
  SystemConnection,
  SystemJson,
} from "../../../../lib/system-json/system-json"
import { updateConnectionPaths } from "../../../DesignCanvas/systemJsonCanvas"

export function createTiBlocksCircuitJsonSystemJson(): SystemJson[] {
  const systemDiagramId = "system_diagram_0"
  const controller = new Microcontroller_MSPM0G3507({
    systemDiagramId,
    systemBlockId: "controller",
    tsxInstanceName: "controller",
    subcircuitId: "Microcontroller_MSPM0G3507",
    center: { x: 210, y: 210 },
  })
  const sensor = new EnvironmentalSensor_HDC3020({
    systemDiagramId,
    systemBlockId: "sensor",
    tsxInstanceName: "sensor",
    subcircuitId: "EnvironmentalSensor_HDC3020",
    center: { x: 560, y: 210 },
  })

  return updateConnectionPaths([
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "TI I2C Sensor System",
    },
    ...controller.getSystemBlockJson(),
    ...controller.getSystemPortJson([
      "controller_pa0",
      "controller_pa1",
      "controller_vdd",
      "controller_gnd",
    ]),
    ...sensor.getSystemBlockJson(),
    ...sensor.getSystemPortJson([
      "sensor_scl",
      "sensor_sda",
      "sensor_vdd",
      "sensor_gnd",
    ]),
    connection({
      systemDiagramId,
      systemConnectionId: "w_scl",
      sourcePortId: "controller_pa0",
      targetPortId: "sensor_scl",
      label: "SCL",
    }),
    connection({
      systemDiagramId,
      systemConnectionId: "w_sda",
      sourcePortId: "controller_pa1",
      targetPortId: "sensor_sda",
      label: "SDA",
    }),
    connection({
      systemDiagramId,
      systemConnectionId: "w_vdd",
      sourcePortId: "controller_vdd",
      targetPortId: "sensor_vdd",
      label: "VDD",
    }),
    connection({
      systemDiagramId,
      systemConnectionId: "w_gnd",
      sourcePortId: "controller_gnd",
      targetPortId: "sensor_gnd",
      label: "GND",
    }),
  ])
}

function connection({
  systemDiagramId,
  systemConnectionId,
  sourcePortId,
  targetPortId,
  label,
}: {
  systemDiagramId: string
  systemConnectionId: string
  sourcePortId: string
  targetPortId: string
  label: string
}): SystemConnection {
  return {
    type: "system_connection",
    system_diagram_id: systemDiagramId,
    system_connection_id: systemConnectionId,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label,
  }
}
