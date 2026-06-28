import { OutputFiles } from "../../OutputFiles/OutputFiles"
import { createTiBlocksCircuitJsonSystemJson } from "../DesignCanvas/DesignCanvas01/createTiBlocksCircuitJsonSystemJson"

export function OutputFiles01Page() {
  return <OutputFiles systemJson={createTiBlocksCircuitJsonSystemJson()} />
}

export default OutputFiles01Page
