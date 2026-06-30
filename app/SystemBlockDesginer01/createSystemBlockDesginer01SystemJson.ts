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
    ...sensor.getSystemBlockJson(),
    ...powerMonitor.getSystemBlockJson(),
    connection(
      systemDiagramId,
      "w_i2c_sensor",
      "controller_pa0",
      "sensor_scl",
      "i2c",
    ),
    connection(
      systemDiagramId,
      "w_i2c_power_monitor",
      "controller_pa1",
      "power_monitor_scl",
      "i2c",
    ),
    connection(
      systemDiagramId,
      "w_monitor_vs",
      "controller_vdd",
      "power_monitor_vs",
      "VDD",
    ),
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
