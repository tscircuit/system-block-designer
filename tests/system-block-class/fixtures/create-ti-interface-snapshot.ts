import { convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"
import { systemJsonToTsx } from "../../../lib/system-blocks/systemJsonToTsx"
import { systemJsonToSvgSnapshot } from "../../../lib/system-json/system-json-to-svg"
import type { SystemJson } from "../../../lib/system-json/system-json"
import { renderTsxToCircuitJson } from "../../fixtures/render-tsx-to-circuit-json"

export async function createTiInterfaceSnapshot(systemJson: SystemJson[]) {
  const tsx = systemJsonToTsx(systemJson)
  const circuitJson = await renderTsxToCircuitJson(tsx)

  return {
    blockDiagramSvg: systemJsonToSvgSnapshot(systemJson),
    schematicSvg: convertCircuitJsonToStackedSchematicSheetsSvg(
      circuitJson as any,
    ),
    tsx,
  }
}
