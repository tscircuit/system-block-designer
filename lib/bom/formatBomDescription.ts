import { formatPackageDisplayName } from "./formatPackageDisplayName"

export function formatBomDescription(
  description: string | null | undefined,
  packageName: string,
) {
  const normalizedDescription = description?.trim()
  if (!normalizedDescription) return null

  const normalizedPackageName = packageName.trim()
  if (!normalizedPackageName || normalizedPackageName === "—") {
    return normalizedDescription
  }

  const displayPackageName = formatPackageDisplayName(normalizedPackageName)
  if (displayPackageName === normalizedPackageName) {
    return normalizedDescription
  }

  return normalizedDescription
    .split(normalizedPackageName)
    .join(displayPackageName)
}
