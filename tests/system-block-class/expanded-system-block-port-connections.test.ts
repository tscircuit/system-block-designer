import { expect, test } from "bun:test"
import { WirelessMCU_CC3235SF } from "../../lib/system-blocks/TiSubcircuits"

test("expanded system block ports connect matching concrete tsx pins", () => {
  const busPortName = "SPI_FLASH"
  const controllerName = "controller"
  const peripheralName = "peripheral"
  const controller = new WirelessMCU_CC3235SF({
    systemBlockId: controllerName,
    tsxInstanceName: controllerName,
  })
  const peripheral = new WirelessMCU_CC3235SF({
    systemBlockId: peripheralName,
    tsxInstanceName: peripheralName,
  })

  peripheral.setConnection(busPortName, [
    { systemBlock: controller, portName: busPortName },
  ])

  expect(peripheral.getTsxFile()).toBe(
    `<WirelessMCU_CC3235SF name="${peripheralName}" connections={${formatConnections(
      peripheral.getTsxPinsForPort(busPortName),
      controller.getTsxPinsForPort(busPortName),
      controllerName,
    )}} />`,
  )
})

function formatConnections(
  sourcePins: string[],
  targetPins: string[],
  targetInstanceName: string,
) {
  const entries = sourcePins.map(
    (sourcePin, index) =>
      `${sourcePin}: "${targetInstanceName}.${targetPins[index]}"`,
  )
  return `{ ${entries.join(", ")} }`
}
