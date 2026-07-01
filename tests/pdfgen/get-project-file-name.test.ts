import { expect, test } from "bun:test"
import { createSmartLockSystemJson } from "../../app/SmartLock/createSmartLockSystemJson"
import { getProjectFileName } from "../../components/OutputFiles/createProjectPdf"

test("getProjectFileName produces a filesystem-safe slug", () => {
  const fileName = getProjectFileName(createSmartLockSystemJson())
  expect(fileName).toMatch(/^[a-z0-9-]+$/)
})
