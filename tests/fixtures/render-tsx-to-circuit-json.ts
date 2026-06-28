import { CircuitRunner } from "@tscircuit/eval"

export async function renderTsxToCircuitJson(tsx: string) {
  const circuitRunner = new CircuitRunner()

  try {
    await circuitRunner.execute(tsx)
    await circuitRunner.renderUntilSettled()
    return await circuitRunner.getCircuitJson()
  } finally {
    await circuitRunner.kill()
  }
}
