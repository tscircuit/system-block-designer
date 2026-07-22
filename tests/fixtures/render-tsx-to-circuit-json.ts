import { CircuitRunner } from "@tscircuit/eval"

export async function renderTsxToCircuitJson(tsx: string) {
  const circuitRunner = new CircuitRunner()
  const tiPackageBundle = await Bun.file(
    new URL("../../node_modules/@tsci/tscircuit.ti/index.cjs", import.meta.url),
  ).text()

  try {
    if (tsx.includes("export default")) {
      await circuitRunner.executeWithFsMap({
        fsMap: {
          "index.circuit.tsx": tsx,
          "node_modules/@tsci/tscircuit.ti/index.js": tiPackageBundle,
        },
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
