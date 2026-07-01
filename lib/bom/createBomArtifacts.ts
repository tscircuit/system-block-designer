import { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import type {
  AnyCircuitElement,
  PcbComponent,
  SourceGroup,
  SourceSimpleCapacitor,
  SourceSimpleCurrentSource,
  SourceSimpleInductor,
  SourceSimplePotentiometer,
  SourceSimplePowerSource,
  SourceSimpleResistor,
  SourceSimpleVoltageSource,
} from "circuit-json"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"
import type { CircuitJson } from "../system-blocks/resolveSystemJsonToCircuitJson"
import type { SystemBlock, SystemJson } from "../system-json/system-json"
import type { BomArtifacts, BomViewRow, SupplierPartDetails } from "./types"

type CircuitElement = AnyCircuitElement
type SourceComponentElement = Extract<
  AnyCircuitElement,
  { type: "source_component" }
>

type LibraryBomRow = {
  designator: string
  comment: string
  value: string
  footprint: string
  supplier_part_number_columns?: Record<string, string>
}

interface PlacementMeta {
  componentType: string
  functionalBlock: string
  partNumber: string
  formattedValue: string | null
}

interface BomRowGroup {
  componentType: string
  partNumber: string
  supplierPartNumber: string
  packageName: string
  value: string
  quantity: number
  functionalBlocks: Set<string>
  designators: string[]
}

export async function createBomArtifacts(params: {
  systemJson: SystemJson[]
  circuitJson: CircuitJson
  generatedAt?: Date
  resolveSupplierPartDetails?: (
    supplierPartNumber: string,
  ) => Promise<SupplierPartDetails | null>
}): Promise<BomArtifacts> {
  const placementMetas = createPlacementMetas(
    params.systemJson,
    params.circuitJson,
  )
  const bomRows = (await convertCircuitJsonToBomRows({
    circuitJson: params.circuitJson as never,
  })) as LibraryBomRow[]
  const groups = new Map<string, BomRowGroup>()

  for (const [index, row] of bomRows.entries()) {
    const meta = placementMetas[index]
    if (!meta) continue

    const supplierPartNumber = firstNonEmpty(
      row.supplier_part_number_columns?.["JLCPCB Part #"],
      "—",
    )
    const packageName = firstNonEmpty(row.footprint, "—")
    const libraryValue = firstNonEmpty(row.value, row.comment)
    const value =
      libraryValue === "DNP"
        ? "DNP"
        : firstNonEmpty(meta.formattedValue ?? undefined, libraryValue, "—")
    const isDoNotPlace = value === "DNP"

    const key = createGroupKey({
      componentType: meta.componentType,
      partNumber: meta.partNumber,
      supplierPartNumber,
      packageName,
      value,
      isDoNotPlace,
    })
    let group = groups.get(key)

    if (!group) {
      group = {
        componentType: meta.componentType,
        partNumber: meta.partNumber,
        supplierPartNumber,
        packageName,
        value,
        quantity: 0,
        functionalBlocks: new Set<string>(),
        designators: [],
      }
      groups.set(key, group)
    }

    group.quantity += 1
    group.functionalBlocks.add(meta.functionalBlock)
    group.designators.push(row.designator)
  }

  const resolveSupplierPartDetails =
    params.resolveSupplierPartDetails ?? fetchJlcSupplierPartDetails
  const supplierPartDetails = await createSupplierPartDetailsMap(
    groups,
    resolveSupplierPartDetails,
  )

  let totalEstimatedPrice = 0
  let hasEstimatedPrice = false
  const rows = Array.from(groups.values())
    .map((group): BomViewRow => {
      const details = supplierPartDetails.get(group.supplierPartNumber) ?? null
      const unitPrice = pickUnitPriceForQuantity(
        details?.prices ?? [],
        group.quantity,
      )
      const mpn = resolveDisplayPartNumber(
        group.partNumber,
        details?.mpn ?? null,
        group.supplierPartNumber,
        group.componentType,
        group.value,
        group.packageName,
      )
      const value = group.value
      const description = resolveBomDescription({
        description: details?.description ?? null,
        componentType: group.componentType,
        value,
        packageName: group.packageName,
      })

      if (unitPrice != null && value !== "DNP") {
        totalEstimatedPrice += unitPrice * group.quantity
        hasEstimatedPrice = true
      }

      return {
        referenceDesignators: group.designators.sort(naturalCompare).join(", "),
        manufacturer: "Texas Instruments",
        mpn,
        packageName: group.packageName,
        value,
        quantity: String(group.quantity),
        functionalBlock: Array.from(group.functionalBlocks).sort().join(", "),
        partName: resolvePartName({
          description: details?.description ?? null,
          designators: group.designators,
          mpn,
          value,
          packageName: group.packageName,
        }),
        description,
        lifecycle: formatLifecycle(
          details?.lifecycle ?? null,
          Boolean(details),
        ),
        unitPrice: formatUnitPrice(unitPrice),
        stock: formatStock(details?.stock ?? null),
      }
    })
    .sort((left, right) => {
      return (
        left.functionalBlock.localeCompare(right.functionalBlock) ||
        left.mpn.localeCompare(right.mpn) ||
        naturalCompare(left.partName, right.partName)
      )
    })

  return {
    summary: [
      {
        label: "BOM Last updated",
        value: formatSummaryDate(params.generatedAt ?? new Date()),
      },
      { label: "Unique Components", value: String(rows.length) },
      {
        label: "Est. Price",
        value: hasEstimatedPrice ? formatTotalPrice(totalEstimatedPrice) : "—",
      },
    ],
    rows,
  }
}

function createPlacementMetas(
  systemJson: SystemJson[],
  circuitJson: CircuitJson,
) {
  const circuitElements = circuitJson
  const blockLabelById = new Map(
    systemJson
      .filter((item): item is SystemBlock => item.type === "system_block")
      .map((block) => [
        block.system_block_id,
        prettifyLabel(block.label ?? block.system_block_id),
      ]),
  )
  const sourceComponents = new Map(
    circuitElements
      .filter(isSourceComponentElement)
      .map((element) => [element.source_component_id, element]),
  )
  const sourceGroups = new Map(
    circuitElements
      .filter(isSourceGroupElement)
      .map((element) => [element.source_group_id, element]),
  )

  return circuitElements
    .filter(isPcbComponentElement)
    .flatMap((pcbComponent) => {
      const sourceComponentId = pcbComponent.source_component_id

      const sourceComponent = sourceComponents.get(sourceComponentId)
      if (!sourceComponent) return []

      const sourceGroupId = sourceComponent.source_group_id
      const sourceGroupName = sourceGroupId
        ? sourceGroups.get(sourceGroupId)?.name
        : undefined

      return [
        {
          componentType: sourceComponent.ftype ?? "part",
          functionalBlock: resolveFunctionalBlockName(
            sourceGroupName,
            blockLabelById,
          ),
          partNumber: sourceComponent.manufacturer_part_number ?? "",
          formattedValue: formatSourceComponentValue(sourceComponent),
        } satisfies PlacementMeta,
      ]
    })
}

function formatSourceComponentValue(sourceComponent: SourceComponentElement) {
  if (isSourceSimpleResistor(sourceComponent)) {
    return formatValueWithUnit(
      sourceComponent.resistance,
      "Ω",
      "Ohm",
      sourceComponent.display_resistance,
    )
  }

  if (isSourceSimpleCapacitor(sourceComponent)) {
    return formatValueWithUnit(
      sourceComponent.capacitance,
      "F",
      "F",
      sourceComponent.display_capacitance,
    )
  }

  if (isSourceSimpleInductor(sourceComponent)) {
    return formatValueWithUnit(
      sourceComponent.inductance,
      "H",
      "H",
      sourceComponent.display_inductance,
    )
  }

  if (isSourceSimplePotentiometer(sourceComponent)) {
    return formatValueWithUnit(
      sourceComponent.max_resistance,
      "Ω",
      "Ohm",
      sourceComponent.display_max_resistance,
    )
  }

  if (
    isSourceSimplePowerSource(sourceComponent) ||
    isSourceSimpleVoltageSource(sourceComponent)
  ) {
    return formatValueWithUnit(sourceComponent.voltage, "V", "V")
  }

  if (isSourceSimpleCurrentSource(sourceComponent)) {
    return formatValueWithUnit(sourceComponent.current, "A", "A")
  }

  return null
}

function formatValueWithUnit(
  value: number | undefined,
  unit: "Ω" | "F" | "H" | "V" | "A",
  displayUnit: string,
  fallbackDisplayValue?: string,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return appendSiUnit(formatSiUnit(value), displayUnit)
  }

  const { value: parsedValue } = parseAndConvertSiUnit(
    fallbackDisplayValue,
    unit,
  )
  if (typeof parsedValue === "number" && Number.isFinite(parsedValue)) {
    return appendSiUnit(formatSiUnit(parsedValue), displayUnit)
  }

  return normalizeText(fallbackDisplayValue)
}

function appendSiUnit(formattedValue: string, unit: string) {
  const normalizedValue = formattedValue.replace(/µ/g, "u")
  const match = normalizedValue.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(.*)$/i,
  )
  if (!match) return `${normalizedValue} ${unit}`

  const [, numericValue, prefix] = match
  return prefix ? `${numericValue} ${prefix}${unit}` : `${numericValue} ${unit}`
}

function resolveFunctionalBlockName(
  sourceGroupName: string | undefined,
  blockLabelById: Map<string, string>,
) {
  if (!sourceGroupName) return "Board"
  return blockLabelById.get(sourceGroupName) ?? prettifyLabel(sourceGroupName)
}

function createGroupKey(params: {
  componentType: string
  partNumber: string
  supplierPartNumber: string
  packageName: string
  value: string
  isDoNotPlace: boolean
}) {
  return [
    params.componentType || "part",
    params.partNumber || "—",
    params.supplierPartNumber,
    params.packageName,
    params.value,
    params.isDoNotPlace ? "dnp" : "place",
  ].join("\u0001")
}

function resolveDisplayPartNumber(
  partNumber: string,
  secondaryPartNumber: string | null | undefined,
  supplierPartNumber: string,
  componentType: string,
  value: string,
  packageName: string,
) {
  return firstNonEmpty(
    partNumber,
    normalizeText(secondaryPartNumber) ?? undefined,
    supplierPartNumber !== "—" ? supplierPartNumber : undefined,
    createFallbackPartNumber(componentType, value, packageName),
    "—",
  )
}

function createFallbackPartNumber(
  componentType: string,
  value: string,
  packageName: string,
) {
  const parts = [
    prettifyLabel(componentType).replace(/^simple\s+/i, ""),
    value !== "—" ? value : "",
    packageName !== "—" ? packageName : "",
  ].filter(Boolean)
  return parts.join(" ").trim()
}

async function createSupplierPartDetailsMap(
  groups: Map<string, BomRowGroup>,
  resolveSupplierPartDetails: (
    supplierPartNumber: string,
  ) => Promise<SupplierPartDetails | null>,
) {
  const supplierPartNumbers = Array.from(
    new Set(
      Array.from(groups.values())
        .map((group) => group.supplierPartNumber)
        .filter((supplierPartNumber) => supplierPartNumber !== "—"),
    ),
  )
  const detailsByPartNumber = new Map<string, SupplierPartDetails | null>()

  await Promise.all(
    supplierPartNumbers.map(async (supplierPartNumber) => {
      try {
        detailsByPartNumber.set(
          supplierPartNumber,
          await resolveSupplierPartDetails(supplierPartNumber),
        )
      } catch {
        detailsByPartNumber.set(supplierPartNumber, null)
      }
    }),
  )

  return detailsByPartNumber
}

async function fetchJlcSupplierPartDetails(
  supplierPartNumber: string,
): Promise<SupplierPartDetails | null> {
  const response = await fetch(
    `https://jlcsearch.tscircuit.com/components/list.json?search=${encodeURIComponent(
      supplierPartNumber,
    )}&full=true`,
  )
  if (!response.ok) return null

  const data = (await response.json()) as {
    components?: Array<{
      lcsc?: number
      mfr?: string
      description?: string
      stock?: number
      price?: string
    }>
  }
  const supplierPartNumberAsNumber = Number(
    supplierPartNumber.replace(/^C/i, ""),
  )
  const component =
    data.components?.find(
      (candidate) => candidate.lcsc === supplierPartNumberAsNumber,
    ) ?? data.components?.[0]

  if (!component) return null

  return {
    mpn: normalizeText(component.mfr),
    description: normalizeText(component.description),
    lifecycle: null,
    stock: typeof component.stock === "number" ? component.stock : null,
    prices: parsePriceBreaks(component.price),
  }
}

function parsePriceBreaks(price: string | undefined) {
  if (!price) return []

  try {
    const rows = JSON.parse(price) as Array<{
      qFrom?: number
      qTo?: number | null
      price?: number
    }>

    return rows.flatMap((row) => {
      if (
        typeof row.qFrom !== "number" ||
        typeof row.price !== "number" ||
        Number.isNaN(row.price)
      ) {
        return []
      }

      return [
        {
          qFrom: row.qFrom,
          qTo: typeof row.qTo === "number" ? row.qTo : null,
          price: row.price,
        },
      ]
    })
  } catch {
    return []
  }
}

function pickUnitPriceForQuantity(
  prices: SupplierPartDetails["prices"],
  quantity: number,
) {
  if (prices.length === 0) return null

  const matchingPrice = prices.find(
    (price) =>
      quantity >= price.qFrom && (price.qTo === null || quantity <= price.qTo),
  )

  return matchingPrice?.price ?? prices[0]?.price ?? null
}

function formatUnitPrice(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—"

  if (value >= 0.01) {
    return `${trimTrailingZeros(value.toFixed(4))} USD`
  }

  return `${trimTrailingZeros(value.toFixed(6))} USD`
}

function formatStock(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toLocaleString("en-US")
}

function formatLifecycle(value: string | null, hasSupplierDetails: boolean) {
  if (value && value.trim().length > 0) return value
  if (hasSupplierDetails) return "Active"
  return "—"
}

function formatTotalPrice(value: number) {
  if (Number.isNaN(value)) return "—"

  if (value >= 1) {
    return `${trimTrailingZeros(value.toFixed(2))} USD`
  }

  return `${trimTrailingZeros(value.toFixed(4))} USD`
}

function formatSummaryDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value)
}

function resolvePartName(params: {
  description: string | null
  designators: string[]
  mpn: string
  value: string
  packageName: string
}) {
  const normalizedDescription = normalizeText(params.description)
  if (normalizedDescription) return normalizedDescription

  const partName = [
    params.mpn !== "—" ? params.mpn : "",
    params.value !== "—" && params.value !== "DNP" ? params.value : "",
    params.packageName !== "—" ? params.packageName : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  if (partName) return partName

  return params.designators.sort(naturalCompare).join(", ")
}

function resolveBomDescription(params: {
  description: string | null
  componentType: string
  value: string
  packageName: string
}) {
  const normalizedDescription = normalizeText(params.description)
  if (normalizedDescription) return normalizedDescription

  return [
    prettifyComponentType(params.componentType),
    params.value !== "—" && params.value !== "DNP" ? params.value : "",
    params.packageName !== "—" ? params.packageName : "",
  ]
    .filter(Boolean)
    .join(", ")
}

function prettifyComponentType(value: string) {
  const normalized = value.replace(/^simple_/u, "").replace(/^source_/u, "")

  switch (normalized) {
    case "resistor":
      return "Resistor"
    case "capacitor":
      return "Capacitor"
    case "inductor":
      return "Inductor"
    case "chip":
      return "Integrated circuit"
    case "part":
      return "Part"
    default:
      return prettifyLabel(normalized)
  }
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function trimTrailingZeros(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "")
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0) ?? ""
}

function prettifyLabel(value: string) {
  return value.replace(/[_-]+/g, " ").trim()
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function isSourceComponentElement(
  element: CircuitElement,
): element is SourceComponentElement {
  return element.type === "source_component"
}

function isPcbComponentElement(
  element: CircuitElement,
): element is PcbComponent {
  return element.type === "pcb_component"
}

function isSourceGroupElement(element: CircuitElement): element is SourceGroup {
  return element.type === "source_group"
}

function isSourceSimpleResistor(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimpleResistor {
  return sourceComponent.ftype === "simple_resistor"
}

function isSourceSimpleCapacitor(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimpleCapacitor {
  return sourceComponent.ftype === "simple_capacitor"
}

function isSourceSimpleInductor(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimpleInductor {
  return sourceComponent.ftype === "simple_inductor"
}

function isSourceSimplePotentiometer(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimplePotentiometer {
  return sourceComponent.ftype === "simple_potentiometer"
}

function isSourceSimplePowerSource(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimplePowerSource {
  return sourceComponent.ftype === "simple_power_source"
}

function isSourceSimpleVoltageSource(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimpleVoltageSource {
  return sourceComponent.ftype === "simple_voltage_source"
}

function isSourceSimpleCurrentSource(
  sourceComponent: SourceComponentElement,
): sourceComponent is SourceSimpleCurrentSource {
  return sourceComponent.ftype === "simple_current_source"
}

function naturalCompare(left: string, right: string) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}
