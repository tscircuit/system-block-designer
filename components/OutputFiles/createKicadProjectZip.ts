import {
  CircuitJsonToKicadLibraryConverter,
  CircuitJsonToKicadPcbConverter,
  CircuitJsonToKicadProConverter,
  CircuitJsonToKicadSchConverter,
} from "circuit-json-to-kicad"
import type { CircuitJson } from "../../lib/system-blocks/resolveSystemJsonToCircuitJson"
import { createZip } from "../../lib/utils/createZip"

export function createKicadProjectZip(
  circuitJson: CircuitJson,
  projectName = "system-block-designer",
) {
  const schematicFilename = `${projectName}.kicad_sch`
  const pcbFilename = `${projectName}.kicad_pcb`
  const projectFilename = `${projectName}.kicad_pro`
  const libraryName = `${projectName}-library`
  const files: Record<string, string> = {}

  const schConverter = new CircuitJsonToKicadSchConverter(
    circuitJson as ConstructorParameters<
      typeof CircuitJsonToKicadSchConverter
    >[0],
  )
  schConverter.runUntilFinished()
  files[schematicFilename] = schConverter.getOutputString()

  const pcbConverter = new CircuitJsonToKicadPcbConverter(
    circuitJson as ConstructorParameters<
      typeof CircuitJsonToKicadPcbConverter
    >[0],
    { projectName },
  )
  pcbConverter.runUntilFinished()
  files[pcbFilename] = pcbConverter.getOutputString()

  const proConverter = new CircuitJsonToKicadProConverter(
    circuitJson as ConstructorParameters<
      typeof CircuitJsonToKicadProConverter
    >[0],
    {
      projectName,
      schematicFilename,
      pcbFilename,
    },
  )
  proConverter.runUntilFinished()
  files[projectFilename] = proConverter.getOutputString()

  const libraryConverter = new CircuitJsonToKicadLibraryConverter(
    circuitJson as ConstructorParameters<
      typeof CircuitJsonToKicadLibraryConverter
    >[0],
    {
      libraryName,
      footprintLibraryName: libraryName,
    },
  )
  libraryConverter.runUntilFinished()
  const libraryOutput = libraryConverter.getOutput()
  files[`${libraryName}.kicad_sym`] = libraryOutput.kicadSymString
  files["sym-lib-table"] = libraryOutput.symLibTableString
  files["fp-lib-table"] = libraryOutput.fpLibTableString

  for (const footprint of libraryOutput.footprints) {
    files[`${libraryName}.pretty/${footprint.footprintName}.kicad_mod`] =
      footprint.kicadModString
  }

  return createZip(files)
}
