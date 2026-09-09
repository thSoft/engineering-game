import { DeskLamp } from "./deskLamp/deskLamp.ts";
import { LevelDefinition, LevelDefinitionId } from "../engine/levels.ts";

export const levelDefinitions = [DeskLamp];

export function getLevelDefinitionById(
  levelDefinitionId: LevelDefinitionId | undefined,
): LevelDefinition | undefined {
  return levelDefinitions.find((def) => def.id === levelDefinitionId);
}
