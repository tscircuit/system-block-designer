const PINROW_PATTERN = /^pinrow(?<pinCount>\d+)$/u
const PINROW_ROWS_PATTERN = /^rows(?<value>\d+)$/u

export function formatPackageDisplayName(packageName: string) {
  const normalizedPackageName = packageName.trim()
  if (!normalizedPackageName || normalizedPackageName === "—") {
    return packageName
  }

  if (shouldPreservePackageName(normalizedPackageName)) {
    return normalizedPackageName
  }

  const pinrowDisplayName = formatPinrowDisplayName(normalizedPackageName)
  if (pinrowDisplayName) return pinrowDisplayName

  return normalizedPackageName
    .split(/[_-]+/u)
    .map(formatPackageElement)
    .join("_")
}

function formatPinrowDisplayName(packageName: string) {
  const [baseElement, ...suffixElements] = packageName.split("_")
  const baseMatch = baseElement.match(PINROW_PATTERN)
  if (!baseMatch?.groups?.pinCount) return null

  const pinCount = Number.parseInt(baseMatch.groups.pinCount, 10)
  if (!Number.isFinite(pinCount) || pinCount < 1) return null

  let rowCount = 1
  const displayParts = ["PinHeader"]

  for (const element of suffixElements) {
    const rowMatch = element.match(PINROW_ROWS_PATTERN)
    if (rowMatch?.groups?.value) {
      const parsedRowCount = Number.parseInt(rowMatch.groups.value, 10)
      if (Number.isFinite(parsedRowCount) && parsedRowCount > 0) {
        rowCount = parsedRowCount
      }
      continue
    }

    displayParts.push(formatPackageElement(element))
  }

  const pinsPerRow = pinCount / rowCount
  const matrixLabel = Number.isInteger(pinsPerRow)
    ? `${rowCount}x${String(pinsPerRow).padStart(2, "0")}`
    : `${rowCount}x${pinCount}`
  displayParts.splice(1, 0, matrixLabel)

  return displayParts.join("_")
}

function shouldPreservePackageName(packageName: string) {
  return (
    packageName.includes("/") ||
    packageName.includes(":") ||
    packageName.includes(" ")
  )
}

function formatPackageElement(element: string) {
  return element.replace(
    /^[a-z]+/u,
    (prefix) => prefix.charAt(0).toUpperCase() + prefix.slice(1),
  )
}
