const DEFAULT_EXPORT_TIME_ZONE = "America/Los_Angeles"

export function formatProjectPdfExportedOn(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
    timeZone: DEFAULT_EXPORT_TIME_ZONE,
  }).formatToParts(date)

  return `${getDateTimePart(parts, "day")} ${getDateTimePart(parts, "month")} ${getDateTimePart(parts, "year")}, ${getDateTimePart(parts, "hour")}:${getDateTimePart(parts, "minute")} ${getDateTimePart(parts, "timeZoneName")}`
}

function getDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? ""
}
