import { SystemBlockDesigner } from "../../components/SystemBlockDesigner/SystemBlockDesigner"
import type { SystemJson } from "../../lib/system-json/system-json"
import { createSystemBlockDesigner01SystemJson } from "./createSystemBlockDesigner01SystemJson"

interface SystemBlockDesigner01PageProps {
  debug?: boolean
  initialSystemJson?: SystemJson[]
}

export function SystemBlockDesigner01Page({
  debug = false,
  initialSystemJson = createSystemBlockDesigner01SystemJson(),
}: SystemBlockDesigner01PageProps) {
  return (
    <SystemBlockDesigner
      projectTitle="System Block Designer 01"
      initialSystemJson={initialSystemJson}
      debugOptions={
        debug
          ? {
              showSystemJsonDownload: true,
              systemJsonDownloadFilename: "system-block-designer-01.json",
              showCircuitJsonDownload: true,
              circuitJsonDownloadFilename:
                "system-block-designer-01-circuit.json",
              showSchematicSnapshotPreview: true,
            }
          : undefined
      }
    />
  )
}

export default SystemBlockDesigner01Page
