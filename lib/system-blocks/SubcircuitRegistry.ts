import {
  CommonSubcircuitDefinitions,
  CommonSystemBlockClasses,
} from "./CommonSubcircuits"
import { TiSubcircuitDefinitions, TiSystemBlockClasses } from "./TiSubcircuits"

export const TI_SUBCIRCUIT_IMPORT_PATH = "@tsci/tscircuit.ti"

export const SubcircuitDefinitions = {
  ...TiSubcircuitDefinitions,
  ...CommonSubcircuitDefinitions,
} as const

export const SystemBlockClasses = {
  ...TiSystemBlockClasses,
  ...CommonSystemBlockClasses,
} as const

export type SystemBlockName = keyof typeof SystemBlockClasses

export const SUBCIRCUIT_IMPORT_PATH_BY_COMPONENT_NAME: Record<
  SystemBlockName,
  string
> = {
  ...Object.fromEntries(
    Object.keys(TiSystemBlockClasses).map((componentName) => [
      componentName,
      TI_SUBCIRCUIT_IMPORT_PATH,
    ]),
  ),
  ...Object.fromEntries(
    Object.values(CommonSubcircuitDefinitions).map((definition) => [
      definition.componentName,
      definition.importPath,
    ]),
  ),
} as Record<SystemBlockName, string>
