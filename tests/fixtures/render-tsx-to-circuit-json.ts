import { CircuitRunner } from "@tscircuit/eval"

export async function renderTsxToCircuitJson(tsx: string) {
  const circuitRunner = new CircuitRunner()

  try {
    if (tsx.includes("export default")) {
      await circuitRunner.executeWithFsMap({
        fsMap: { "index.circuit.tsx": tsx },
        mainComponentPath: "index.circuit.tsx",
      })
    } else {
      await circuitRunner.execute(tsx)
    }
    await circuitRunner.renderUntilSettled()
    return await circuitRunner.getCircuitJson()
  } finally {
    await circuitRunner.kill()
  }
}
