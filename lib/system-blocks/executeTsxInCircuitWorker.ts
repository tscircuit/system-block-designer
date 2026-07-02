import type { CircuitWebWorker } from "@tscircuit/eval/worker"

const MAIN_COMPONENT_PATH = "index.circuit.tsx"

export async function executeTsxInCircuitWorker(
  circuitWorker: Pick<CircuitWebWorker, "executeWithFsMap">,
  tsx: string,
) {
  await circuitWorker.executeWithFsMap({
    fsMap: {
      [MAIN_COMPONENT_PATH]: tsx,
    },
    mainComponentPath: MAIN_COMPONENT_PATH,
  })
}
