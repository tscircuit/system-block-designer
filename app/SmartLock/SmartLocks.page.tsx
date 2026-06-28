import { SystemBlockDesigner } from "../../components/SystemBlockDesigner/SystemBlockDesigner"
import { createSmartLockSystemJson } from "./createSmartLockSystemJson"

interface SmartLocksPageProps {
  debug?: boolean
}

export function SmartLocksPage({ debug = false }: SmartLocksPageProps) {
  return (
    <SystemBlockDesigner
      projectTitle="Smart Lock (UWB Smart Lock)"
      initialSystemJson={createSmartLockSystemJson()}
      debugOptions={
        debug
          ? {
              showSystemJsonDownload: true,
              systemJsonDownloadFilename: "smart-lock-system.json",
            }
          : undefined
      }
    />
  )
}

export default SmartLocksPage
