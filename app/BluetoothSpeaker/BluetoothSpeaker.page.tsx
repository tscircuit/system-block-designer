import { SystemBlockDesigner } from "../../components/SystemBlockDesigner/SystemBlockDesigner"
import { createBluetoothSpeakerSystemJson } from "./createBluetoothSpeakerSystemJson"

interface BluetoothSpeakerPageProps {
  debug?: boolean
}

export function BluetoothSpeakerPage({
  debug = false,
}: BluetoothSpeakerPageProps) {
  return (
    <SystemBlockDesigner
      projectTitle="Bluetooth Speaker — CC2564C + MSP430F5229 + TAS2505"
      initialSystemJson={createBluetoothSpeakerSystemJson()}
      debugOptions={
        debug
          ? {
              showSystemJsonDownload: true,
              systemJsonDownloadFilename: "bluetooth-speaker-system.json",
            }
          : undefined
      }
    />
  )
}

export default BluetoothSpeakerPage
