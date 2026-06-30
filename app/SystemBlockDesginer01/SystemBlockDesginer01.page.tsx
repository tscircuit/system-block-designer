import { SystemBlockDesigner } from "../../components/SystemBlockDesigner/SystemBlockDesigner"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createSystemBlockDesginer01SystemJson } from "./createSystemBlockDesginer01SystemJson"

interface SystemBlockDesginer01PageProps {
  debug?: boolean
  initialSystemJson?: SystemJson[]
}

export function SystemBlockDesginer01Page({
  debug = false,
  initialSystemJson = createSystemBlockDesginer01SystemJson(),
}: SystemBlockDesginer01PageProps) {
  return (
    <SystemBlockDesigner
      projectTitle="System Block Desginer 01"
      initialSystemJson={initialSystemJson}
      debugOptions={
        debug
          ? {
              showSystemJsonDownload: true,
              systemJsonDownloadFilename: "system-block-desginer-01.json",
              showCircuitJsonDownload: true,
              circuitJsonDownloadFilename:
                "system-block-desginer-01-circuit.json",
              showSchematicSnapshotPreview: true,
            }
          : undefined
      }
    />
  )
}

export default SystemBlockDesginer01Page
