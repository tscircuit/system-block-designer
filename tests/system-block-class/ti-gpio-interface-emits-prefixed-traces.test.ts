import { expect, test } from "bun:test"
import {
  Microcontroller_MSPM0G3507,
  WirelessMCU_CC2340R5,
} from "../../lib/system-blocks/TiSubcircuits"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createTiInterfaceSnapshot } from "./fixtures/create-ti-interface-snapshot"

test("TI GPIO connection renders block diagram and schematic snapshots", async () => {
  const systemDiagramId = "system_diagram_0"
  const source = new Microcontroller_MSPM0G3507({
    systemDiagramId,
    systemBlockId: "controller_a",
    center: { x: 180, y: 180 },
  })
  const target = new WirelessMCU_CC2340R5({
    systemDiagramId,
    systemBlockId: "wireless_mcu",
    center: { x: 580, y: 180 },
  })
  const systemJson: SystemJson[] = [
    {
      type: "system_diagram",
      system_diagram_id: systemDiagramId,
      name: "GPIO interface test",
      width: 760,
      height: 360,
    },
    ...source.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "controller_gpio1",
      system_block_id: "controller_a",
      label: "GPIO1",
      side_of_block: "right",
    },
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "controller_gpio2",
      system_block_id: "controller_a",
      label: "GPIO2",
      side_of_block: "right",
    },
    ...target.getSystemBlockJson(),
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "wireless_mcu_gpio1",
      system_block_id: "wireless_mcu",
      label: "GPIO1",
      side_of_block: "left",
    },
    {
      type: "system_port",
      system_diagram_id: systemDiagramId,
      system_port_id: "wireless_mcu_gpio2",
      system_block_id: "wireless_mcu",
      label: "GPIO2",
      side_of_block: "left",
    },
    {
      type: "system_connection",
      system_diagram_id: systemDiagramId,
      system_connection_id: "gpio1_connection",
      source_system_port_id: "controller_gpio1",
      target_system_port_id: "wireless_mcu_gpio1",
      system_port_ids: ["controller_gpio1", "wireless_mcu_gpio1"],
      path: [
        { x: 290, y: 154 },
        { x: 326, y: 154 },
        { x: 364, y: 133.333 },
        { x: 400, y: 133.333 },
      ],
      label: "GPIO1",
    },
    {
      type: "system_connection",
      system_diagram_id: systemDiagramId,
      system_connection_id: "gpio2_connection",
      source_system_port_id: "controller_gpio2",
      target_system_port_id: "wireless_mcu_gpio2",
      system_port_ids: ["controller_gpio2", "wireless_mcu_gpio2"],
      path: [
        { x: 290, y: 206 },
        { x: 326, y: 206 },
        { x: 364, y: 226.667 },
        { x: 400, y: 226.667 },
      ],
      label: "GPIO2",
    },
  ]

  const { blockDiagramSvg, schematicSvg, tsx } =
    await createTiInterfaceSnapshot(systemJson)

  expect(tsx.match(/<trace /g)).toHaveLength(2)
  expect(tsx).toContain(
    '<trace from=".controller_a > .U1 > .GPIO_PA0" to=".wireless_mcu > .U1 > .GPIO_DIO3" />',
  )
  expect(tsx).toContain(
    '<trace from=".controller_a > .U1 > .GPIO_PA1" to=".wireless_mcu > .U1 > .GPIO_DIO4" />',
  )
  await expect(blockDiagramSvg).toMatchSvgSnapshot(
    import.meta.path,
    "block-diagram",
  )
  await expect(schematicSvg).toMatchSvgSnapshot(import.meta.path, "schematic")
}, 60_000)
