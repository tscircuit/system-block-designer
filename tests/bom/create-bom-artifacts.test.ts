import { expect, test } from "bun:test"
import { createBomArtifacts } from "../../lib/bom/createBomArtifacts"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import type { SystemJson } from "../../lib/system-json/system-json"

const systemJson: SystemJson[] = [
  {
    type: "system_diagram",
    system_diagram_id: "system_diagram_0",
    name: "BOM Test Diagram",
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "sensor_block",
    center: { x: 120, y: 120 },
    size: { width: 120, height: 80 },
    label: "Environmental Sensor",
    category: ["Sensors"],
  },
  {
    type: "system_block",
    system_diagram_id: "system_diagram_0",
    system_block_id: "controller_block",
    center: { x: 320, y: 120 },
    size: { width: 120, height: 80 },
    label: "Microcontroller",
    category: ["Controllers"],
  },
]

const circuitJson: CircuitJson = [
  {
    type: "source_group",
    source_group_id: "source_group_0",
    name: "sensor_block",
    is_subcircuit: true,
  },
  {
    type: "source_group",
    source_group_id: "source_group_1",
    name: "controller_block",
    is_subcircuit: true,
  },
  {
    type: "source_component",
    source_component_id: "source_component_0",
    source_group_id: "source_group_0",
    ftype: "simple_resistor",
    name: "R1",
    resistance: 4700,
    supplier_part_numbers: { jlcpcb: ["C25900"] },
  },
  {
    type: "source_component",
    source_component_id: "source_component_1",
    source_group_id: "source_group_0",
    ftype: "simple_resistor",
    name: "R2",
    resistance: 4700,
    supplier_part_numbers: { jlcpcb: ["C25900"] },
  },
  {
    type: "source_component",
    source_component_id: "source_component_2",
    source_group_id: "source_group_1",
    ftype: "simple_capacitor",
    name: "C1",
    capacitance: 1e-7,
    supplier_part_numbers: { jlcpcb: ["C1525"] },
  },
  {
    type: "source_component",
    source_component_id: "source_component_3",
    source_group_id: "source_group_1",
    ftype: "simple_chip",
    name: "U1",
    manufacturer_part_number: "MSPM0G3507SPMR",
    supplier_part_numbers: { jlcpcb: ["C22389960"] },
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    do_not_place: false,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_1",
    source_component_id: "source_component_1",
    do_not_place: false,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_2",
    source_component_id: "source_component_2",
    do_not_place: false,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_3",
    source_component_id: "source_component_3",
    do_not_place: false,
  },
  {
    type: "cad_component",
    cad_component_id: "cad_component_0",
    pcb_component_id: "pcb_component_0",
    footprinter_string: "res0402",
  },
  {
    type: "cad_component",
    cad_component_id: "cad_component_1",
    pcb_component_id: "pcb_component_1",
    footprinter_string: "res0402",
  },
  {
    type: "cad_component",
    cad_component_id: "cad_component_2",
    pcb_component_id: "pcb_component_2",
    footprinter_string: "0402",
  },
]

test("createBomArtifacts consolidates BOM rows from resolved circuit json", async () => {
  const artifacts = await createBomArtifacts({
    systemJson,
    circuitJson,
    resolveSupplierPartDetails: async (supplierPartNumber) => {
      if (supplierPartNumber === "C25900") {
        return {
          stock: 9379077,
          prices: [{ qFrom: 1, qTo: null, price: 0.000485714 }],
        }
      }
      if (supplierPartNumber === "C22389960") {
        return {
          stock: 15830,
          prices: [{ qFrom: 1, qTo: null, price: 1.607142857 }],
        }
      }
      return null
    },
  })

  expect(artifacts.summary).toEqual([
    { label: "Unique Parts", value: "3" },
    { label: "Placements", value: "4" },
    { label: "Functional Blocks", value: "2" },
    { label: "DNP Parts", value: "0" },
  ])
  expect(artifacts.rows).toContainEqual({
    partNumber: "C25900",
    supplierPartNumber: "C25900",
    packageName: "res0402",
    value: "4.7k",
    quantity: "2",
    functionalBlock: "Environmental Sensor",
    description: "R1, R2",
    unitPrice: "0.000486 USD",
    stock: "9,379,077",
  })
  expect(artifacts.rows).toContainEqual({
    partNumber: "MSPM0G3507SPMR",
    supplierPartNumber: "C22389960",
    packageName: "—",
    value: "—",
    quantity: "1",
    functionalBlock: "Microcontroller",
    description: "U1",
    unitPrice: "1.6071 USD",
    stock: "15,830",
  })
})
