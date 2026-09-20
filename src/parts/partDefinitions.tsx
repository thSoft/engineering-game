import { PartDefinitionId, PartDefinitionWithHelpers } from "../engine/parts.tsx";
import { Blower } from "./blower/blower.tsx";
import { Lightbulb } from "./lightbulb/lightbulb.tsx";
import { OrganKey } from "./organKey/organKey.tsx";
import { Pipe } from "./pipe/pipe.tsx";
import { Plug } from "./plug/plug.tsx";
import { Switch } from "./switch/switch.tsx";
import { Windchest } from "./windchest/windchest.tsx";

export const partDefinitions = [
  Plug,
  Switch,
  Lightbulb,
  Pipe,
  Blower,
  Windchest,
  OrganKey,
] as const;

export function getPartDefinitionById(
  definitionId: PartDefinitionId,
): PartDefinitionWithHelpers<any, any, any> | undefined {
  return partDefinitions.find((definition) => definition.id === definitionId);
}
