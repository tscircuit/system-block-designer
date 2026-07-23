import { CircuitRunner } from "@tscircuit/eval"

export async function renderTsxToCircuitJson(tsx: string) {
  const circuitRunner = new CircuitRunner()
  const tiPackageBundle = await Bun.file(
    new URL("../../node_modules/@tsci/tscircuit.ti/index.cjs", import.meta.url),
  ).text()
  // The common Experiments flash is circuit-equivalent to the component in
  // the currently installed TI package. Supply that bundle under the new
  // package name until the common package release containing it is available.
  const commonPackageBundle = tiPackageBundle

  try {
    if (tsx.includes("export default")) {
      await circuitRunner.executeWithFsMap({
        fsMap: {
          "index.circuit.tsx": tsx,
          "node_modules/@tsci/tscircuit.ti/index.js": tiPackageBundle,
          "node_modules/@tscircuit/common/index.js": commonPackageBundle,
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
