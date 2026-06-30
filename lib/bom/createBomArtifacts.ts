import { convertCircuitJsonToBomRows } from "circuit-json-to-bom-csv"
import type { CircuitJson } from "../system-blocks/resolveSystemJsonToCircuitJson"
import type { SystemBlock, SystemJson } from "../system-json/system-json"
import type { BomArtifacts, BomViewRow, SupplierPartDetails } from "./types"

type CircuitElement = Record<string, unknown>

type SourceComponentElement = CircuitElement & {
  type: "source_component"
  source_component_id: string
  source_group_id?: string
  name?: string
  ftype?: string
  manufacturer_part_number?: string
}

type PcbComponentElement = CircuitElement & {
  type: "pcb_component"
  pcb_component_id: string
  source_component_id?: string
  do_not_place?: boolean
}

type SourceGroupElement = CircuitElement & {
  type: "source_group"
  source_group_id: string
  name?: string
}

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
    const value = firstNonEmpty(row.value, row.comment, "—")
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

      if (unitPrice != null && value !== "DNP") {
        totalEstimatedPrice += unitPrice * group.quantity
        hasEstimatedPrice = true
      }

      return {
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
  const blockLabelById = new Map(
    systemJson
      .filter((item): item is SystemBlock => item.type === "system_block")
      .map((block) => [
        block.system_block_id,
        prettifyLabel(block.label ?? block.system_block_id),
      ]),
  )
  const sourceComponents = new Map(
    circuitJson
      .filter(isSourceComponentElement)
      .map((element) => [element.source_component_id, element]),
  )
  const sourceGroups = new Map(
    circuitJson
      .filter(isSourceGroupElement)
      .map((element) => [element.source_group_id, element]),
  )

  return circuitJson.filter(isPcbComponentElement).flatMap((pcbComponent) => {
    const sourceComponentId = asString(pcbComponent.source_component_id)
    if (!sourceComponentId) return []

    const sourceComponent = sourceComponents.get(sourceComponentId)
    if (!sourceComponent) return []

    const sourceGroupId = asString(sourceComponent.source_group_id)
    const sourceGroupName = sourceGroupId
      ? sourceGroups.get(sourceGroupId)?.name
      : undefined

    return [
      {
        componentType: asString(sourceComponent.ftype) ?? "part",
        functionalBlock: resolveFunctionalBlockName(
          sourceGroupName,
          blockLabelById,
        ),
        partNumber: asString(sourceComponent.manufacturer_part_number) ?? "",
      } satisfies PlacementMeta,
    ]
  })
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
): element is PcbComponentElement {
  return element.type === "pcb_component"
}

function isSourceGroupElement(
  element: CircuitElement,
): element is SourceGroupElement {
  return element.type === "source_group"
}

function naturalCompare(left: string, right: string) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}
