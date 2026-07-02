const DEFAULT_PIN_HEADER_PITCH = "P2.54mm"
const PINROW_PATTERN = /^pinrow(?<pinCount>\d+)$/u
const PINROW_ROWS_PATTERN = /^rows(?<value>\d+)$/u
const PINROW_PITCH_PATTERN = /^p(?<value>\d+(?:\.\d+)?)(?<unit>mm|in)?$/u

export function formatPackageDisplayName(packageName: string) {
  const normalizedPackageName = packageName.trim()
  if (!normalizedPackageName || normalizedPackageName === "—") {
    return packageName
  }

  const pinHeaderDisplayName = formatPinHeaderDisplayName(normalizedPackageName)
  if (pinHeaderDisplayName) return pinHeaderDisplayName

  if (shouldPreservePackageName(normalizedPackageName)) {
    return normalizedPackageName
  }

  return normalizedPackageName
    .split(/[_-]+/u)
    .map(formatPackageElement)
    .join("_")
}

function formatPinHeaderDisplayName(packageName: string) {
  const [baseElement, ...suffixElements] = packageName.split("_")
  const baseMatch = baseElement.match(PINROW_PATTERN)
  if (!baseMatch?.groups?.pinCount) return null

  const pinCount = Number.parseInt(baseMatch.groups.pinCount, 10)
  if (!Number.isFinite(pinCount) || pinCount < 1) return null

  let rowCount = 1
  let pitch = DEFAULT_PIN_HEADER_PITCH
  let orientation = "Vertical"
  let includeGender = false
  let gender = "Male"
  let smd = false

  for (const element of suffixElements) {
    const rowMatch = element.match(PINROW_ROWS_PATTERN)
    if (rowMatch?.groups?.value) {
      const parsedRowCount = Number.parseInt(rowMatch.groups.value, 10)
      if (Number.isFinite(parsedRowCount) && parsedRowCount > 0) {
        rowCount = parsedRowCount
      }
      continue
    }

    const pitchMatch = element.match(PINROW_PITCH_PATTERN)
    if (pitchMatch?.groups?.value) {
      pitch = formatPitch({
        value: pitchMatch.groups.value,
        unit: pitchMatch.groups.unit ?? "mm",
      })
      continue
    }

    if (element === "female" || element === "unpopulated") {
      gender = formatPackageElement(element)
      includeGender = true
      continue
    }

    if (element === "male") {
      gender = "Male"
      continue
    }

    if (element === "rightangle") {
      orientation = "Horizontal"
      continue
    }

    if (element === "smd") {
      smd = true
    }
  }

  const pinsPerRow = pinCount / rowCount
  const matrixLabel = Number.isInteger(pinsPerRow)
    ? `${rowCount}x${String(pinsPerRow).padStart(2, "0")}`
    : `${rowCount}x${pinCount}`
  const parts = ["PinHeader", matrixLabel, pitch, orientation]

  if (smd) parts.push("SMD")
  if (includeGender) parts.push(gender)

  return parts.join("_")
}

function formatPitch(params: { value: string; unit: string }) {
  return `P${trimTrailingZeros(params.value)}${params.unit}`
}

function trimTrailingZeros(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "")
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
