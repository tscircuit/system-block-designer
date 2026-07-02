import { createCircuitWebWorker } from "@tscircuit/eval/worker"
import workerEntrypointUrl from "@tscircuit/eval/worker-entrypoint?url"
import type { CircuitJson } from "circuit-json"
import type { SystemJson } from "../system-json/system-json"
import { executeTsxInCircuitWorker } from "./executeTsxInCircuitWorker"
import { systemJsonToTsx } from "./systemJsonToTsx"

export type { CircuitJson }

export interface ResolvedCircuitJson {
  tsx: string
  circuitJson: CircuitJson
}

export async function resolveSystemJsonToCircuitJson(
  systemJson: SystemJson[],
): Promise<ResolvedCircuitJson> {
  const tsx = systemJsonToTsx(systemJson)
  const circuitWorker = await createCircuitWebWorker({
    webWorkerBlobUrl: workerEntrypointUrl,
  })

  try {
    await executeTsxInCircuitWorker(circuitWorker, tsx)
    await circuitWorker.renderUntilSettled()
    return {
      tsx,
      circuitJson: (await circuitWorker.getCircuitJson()) as CircuitJson,
    }
  } finally {
    await circuitWorker.kill()
  }
}
