import { DesignCanvas } from "../../components/DesignCanvas/DesignCanvas"
import { createSmartLockSystemJson } from "./SmartLocksSeed"

interface SmartLocksPageProps {
  debug?: boolean
}

export function SmartLocksPage({ debug = false }: SmartLocksPageProps) {
  return (
    <DesignCanvas
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
