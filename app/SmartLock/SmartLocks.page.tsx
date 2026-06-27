import { DesignCanvas } from "../../components/DesignCanvas/DesignCanvas"
import { createSmartLockSystemJson } from "./SmartLocksSeed"

export function SmartLocksPage() {
  return (
    <DesignCanvas
      projectTitle="Smart Lock (UWB Smart Lock)"
      initialSystemJson={createSmartLockSystemJson()}
    />
  )
}

export default SmartLocksPage
