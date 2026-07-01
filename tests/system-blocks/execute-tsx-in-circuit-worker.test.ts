import { expect, test } from "bun:test"
import { executeTsxInCircuitWorker } from "../../lib/system-blocks/executeTsxInCircuitWorker"

test("executeTsxInCircuitWorker runs exported TSX through mainComponentPath", async () => {
  const calls: Array<{
    fsMap: Record<string, string>
    mainComponentPath?: string
  }> = []

  await executeTsxInCircuitWorker(
    {
      executeWithFsMap: async (options) => {
        calls.push(options)
      },
    },
    'export default () => <board />',
  )

  expect(calls).toHaveLength(1)
  expect(calls[0]?.mainComponentPath).toBe("index.circuit.tsx")
  expect(calls[0]?.fsMap["index.circuit.tsx"]).toContain("export default")
})
