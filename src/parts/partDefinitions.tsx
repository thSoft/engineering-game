import { PartDefinitionId, PartDefinitions } from "../engine/parts.tsx";
import { Lightbulb } from "./lightbulb/lightbulb.tsx";
import { OrganKeyboard } from "./organKeyboard/organKeyboard.tsx";
import { Pipe } from "./pipe/pipe.tsx";
import { Plug } from "./plug/plug.tsx";
import { Switch } from "./switch/switch.tsx";
import { Windchest } from "./windchest/windchest.tsx";
import { WindSupply } from "./windSupply/windSupply.tsx";

export const partDefinitions = {
  Plug,
  Switch,
  Lightbulb,
  Pipe,
  WindSupply,
  Windchest,
  OrganKeyboard,
} as const;

export function getPartDefinitionById<Id extends PartDefinitionId>(
  definitionId: Id,
): PartDefinitions[Id] {
  return partDefinitions[definitionId];
}
