import { SystemBlockDesigner } from "../../components/SystemBlockDesigner/SystemBlockDesigner"
import type { SystemJson } from "../../lib/system-json/system-json"

interface EmptyBlockDesignerPageProps {
  debug?: boolean
  initialSystemJson?: SystemJson[]
}

export function EmptyBlockDesignerPage({
  debug = false,
}: EmptyBlockDesignerPageProps) {
  return (
    <SystemBlockDesigner
      projectTitle="Empty Block Designer"
      initialSystemJson={[]}
      debugOptions={
        debug
          ? {
              showSystemJsonDownload: true,
              systemJsonDownloadFilename: "empty-block-designer.json",
              showCircuitJsonDownload: true,
              circuitJsonDownloadFilename: "empty-block-designer-circuit.json",
              showSchematicSnapshotPreview: true,
            }
          : undefined
      }
    />
  )
}

export default EmptyBlockDesignerPage
