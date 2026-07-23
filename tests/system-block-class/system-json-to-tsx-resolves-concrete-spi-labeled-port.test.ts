import { expect, test } from "bun:test"
import { WirelessMCU_CC3235SF } from "../../lib/system-blocks/TiSubcircuits"
import { systemJsonToTsxProject } from "../../lib/system-blocks/systemJsonToTsx"
import type {
  SystemConnection,
  SystemJson,
} from "../../lib/system-json/system-json"

test("systemJsonToTsxProject resolves a concrete SPI-labeled port without expanding its bus", () => {
  const systemDiagramId = "system_diagram_0"
  const wifiA = new WirelessMCU_CC3235SF({
    systemDiagramId,
    systemBlockId: "wifi_a",
    tsxInstanceName: "wifi_a",
    subcircuitId: "WirelessMCU_CC3235SF",
    center: { x: 100, y: 100 },
  })
  const wifiB = new WirelessMCU_CC3235SF({
    systemDiagramId,
    systemBlockId: "wifi_b",
    tsxInstanceName: "wifi_b",
    subcircuitId: "WirelessMCU_CC3235SF",
    center: { x: 500, y: 100 },
  })
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "SPI Subcircuit System",
    },
    ...wifiA.getSystemBlockJson(),
    ...wifiA.getSystemPortJson(["wifi_a_sfl_clk"]),
    ...wifiB.getSystemBlockJson(),
    ...wifiB.getSystemPortJson(["wifi_b_sfl_clk"]),
    connection({
      systemDiagramId,
      sourcePortId: "wifi_a_sfl_clk",
      targetPortId: "wifi_b_sfl_clk",
    }),
  ]

  const { files } = systemJsonToTsxProject(systemJson)
  const tsx = files["index.circuit.tsx"]

  expect(tsx).toContain(
    '<trace from=".wifi_a > .U2 > .FLASH_SPI_CLK" to=".wifi_b > .U2 > .FLASH_SPI_CLK" />',
  )
  expect(tsx.match(/<trace /g)).toHaveLength(1)
})

function connection({
  systemDiagramId,
  sourcePortId,
  targetPortId,
}: {
  systemDiagramId: string
  sourcePortId: string
  targetPortId: string
}): SystemConnection {
  return {
    type: "system_connection",
    system_diagram_id: systemDiagramId,
    system_connection_id: "w_spi",
    source_system_port_id: sourcePortId,
    target_system_port_id: targetPortId,
    system_port_ids: [sourcePortId, targetPortId],
    path: [],
    label: "spi",
  }
}
