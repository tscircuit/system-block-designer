import {
  EnvironmentalSensor_HDC3020,
  Microcontroller_MSPM0G3507,
  PowerMonitor_INA237,
} from "../../lib/system-blocks/TiSubcircuits"
import type {
  SystemConnection,
  SystemJson,
} from "../../lib/system-json/system-json"
import { updateConnectionPaths } from "../../components/DesignCanvas/systemJsonCanvas"

export function createSystemBlockDesginer01SystemJson(): SystemJson[] {
  const systemDiagramId = "system_diagram_0"
  const controller = new Microcontroller_MSPM0G3507({
    systemDiagramId,
    systemBlockId: "controller",
    tsxInstanceName: "controller",
    subcircuitId: "Microcontroller_MSPM0G3507",
    center: { x: 100, y: 330 },
  })
  const sensor = new EnvironmentalSensor_HDC3020({
    systemDiagramId,
    systemBlockId: "sensor",
    tsxInstanceName: "sensor",
    subcircuitId: "EnvironmentalSensor_HDC3020",
    center: { x: 550, y: 600 },
  })
  const powerMonitor = new PowerMonitor_INA237({
    systemDiagramId,
    systemBlockId: "power_monitor",
    tsxInstanceName: "power_monitor",
    subcircuitId: "PowerMonitor_INA237",
    center: { x: 620, y: 340 },
  })

  return updateConnectionPaths([
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "System Block Desginer 01",
    },
    ...controller.getSystemBlockJson(),
    ...controller.getSystemPortJson(["controller_pa0", "controller_pa1"]),
    ...sensor.getSystemBlockJson(),
    ...sensor.getSystemPortJson(["sensor_scl"]),
    ...powerMonitor.getSystemBlockJson(),
    ...powerMonitor.getSystemPortJson(["power_monitor_scl"]),
    connection({
      systemDiagramId,
      systemConnectionId: "w_i2c_sensor",
      sourcePortId: "controller_pa0",
      targetPortId: "sensor_scl",
      label: "i2c",
    }),
    connection({
      systemDiagramId,
      systemConnectionId: "w_i2c_power_monitor",
      sourcePortId: "controller_pa1",
      targetPortId: "power_monitor_scl",
      label: "i2c",
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
