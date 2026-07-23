import { lightBulb } from "./lightBulb";
import { powerSource } from "./powerSource";
import { switchPart } from "./switch";
import type { PartDefinition, PartType } from "./types";

export const partDefinitions: { [K in PartType]: PartDefinition<K> } = {
  POWER_SOURCE: powerSource,
  SWITCH: switchPart,
  LIGHT_BULB: lightBulb,
};

export function getPartDefinition<T extends PartType>(
  type: T,
): PartDefinition<T> | undefined {
  return partDefinitions[type];
}

export function getPartLabel(type: PartType): string {
  return partDefinitions[type]?.label ?? type;
}

export const partPalette: { type: PartType; label: string }[] = Object.values(
  partDefinitions,
).map((def) => ({ type: def.type, label: def.label }));
