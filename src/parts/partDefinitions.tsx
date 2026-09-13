import { Plug } from "./plug/plug.tsx";
import { PartDefinitionId, PartDefinitionWithHelpers } from "../engine/parts.tsx";
import { Switch } from "./switch/switch.tsx";
import { Lightbulb } from "./lightbulb/lightbulb.tsx";
import { Pipe } from "./pipe/pipe.tsx";

export const partDefinitions: PartDefinitionWithHelpers<any, any, any>[] = [
  Plug,
  Switch,
  Lightbulb,
  Pipe,
];

export function getPartDefinitionById(
  definitionId: PartDefinitionId,
): PartDefinitionWithHelpers<any, any, any> | undefined {
  return partDefinitions.find((definition) => definition.id === definitionId);
}
