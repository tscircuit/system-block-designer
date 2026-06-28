import { DesignCanvas } from "../../../DesignCanvas/DesignCanvas"
import { createTiBlocksCircuitJsonSystemJson } from "./createTiBlocksCircuitJsonSystemJson"

export function TiBlocksCircuitJsonPage() {
  return (
    <DesignCanvas
      projectTitle="TI Blocks Circuit JSON"
      initialSystemJson={createTiBlocksCircuitJsonSystemJson()}
      debugOptions={{
        showSystemJsonDownload: true,
        systemJsonDownloadFilename: "ti-blocks-system.json",
        showCircuitJsonDownload: true,
        circuitJsonDownloadFilename: "ti-blocks-circuit.json",
      }}
    />
  )
}

export default TiBlocksCircuitJsonPage
