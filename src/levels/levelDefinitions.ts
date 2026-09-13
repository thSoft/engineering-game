import { DeskLamp } from "./deskLamp/deskLamp.ts";
import { LevelDefinition, LevelDefinitionId } from "../engine/levels.ts";
import { Organ1Stop } from "./organ1stop/organ1stop.ts";

export const levelDefinitions = [DeskLamp, Organ1Stop];

export function getLevelDefinitionById(
  levelDefinitionId: LevelDefinitionId | undefined,
): LevelDefinition | undefined {
  return levelDefinitions.find((def) => def.id === levelDefinitionId);
}
