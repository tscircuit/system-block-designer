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
    ...sensor.getSystemBlockJson(),
    connection(systemDiagramId, "w_scl", "controller_pa0", "sensor_scl", "SCL"),
    connection(systemDiagramId, "w_sda", "controller_pa1", "sensor_sda", "SDA"),
    connection(systemDiagramId, "w_vdd", "controller_vdd", "sensor_vdd", "VDD"),
    connection(systemDiagramId, "w_gnd", "controller_gnd", "sensor_gnd", "GND"),
  ])
}

function connection(
  systemDiagramId: string,
  id: string,
  sourcePortId: string,
  targetPortId: string,
  label: string,
): SystemConnection {
  return {
    type: "system_connection",
    system_diagram_id: systemDiagramId,
    system_connection_id: id,
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label,
  }
}
