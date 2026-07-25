import { Connection } from "./connections";
import { createPart, PartId, PartInstance, PartType } from "./parts";
import { PortDefinitionId, PortInstance } from "./ports";

export interface PortInstanceId {
  partId: PartId;
  portDefinitionId: PortDefinitionId;
}

function portOf(
  part: PartInstance,
  portDefinitionId: PortDefinitionId,
): PortInstanceId {
  return {
    partId: part.id,
    portDefinitionId,
  };
}

export interface PuzzleDefinition {
  name: string;
  availablePartTypes: PartType[];
  initialPartInstances: PartInstance[];
  exposedPortInstances: PortInstanceId[];
}

export interface PuzzleState {
  parts: PartInstance[];
  connections: Connection[];
}

export function isExposed(
  port: PortInstance,
  puzzleDefinition: PuzzleDefinition,
) {
  return puzzleDefinition.exposedPortInstances.some(
    (exposedPort) =>
      exposedPort.partId === port.partId &&
      exposedPort.portDefinitionId === port.definitionId,
  );
}

export type PuzzleDefinitionId = "DESK_LAMP";

export const puzzleDefinitions: {
  [K in PuzzleDefinitionId]: PuzzleDefinition;
} = {
  DESK_LAMP: (() => {
    const plug = createPart("plug", "PLUG", { x: 0, y: 0 });
    const switchPart = createPart("switch", "SWITCH", { x: 0, y: 150 });
    const lightbulb = createPart("lightbulb", "LIGHTBULB", { x: 0, y: 300 });
    return {
      name: "Desk Lamp",
      availablePartTypes: ["PLUG", "SWITCH", "LIGHTBULB"],
      initialPartInstances: [plug, switchPart, lightbulb],
      exposedPortInstances: [
        portOf(plug, "PLUGGED"),
        portOf(switchPart, "TOGGLE"),
        portOf(lightbulb, "LIGHT_OUT"),
      ],
    };
  })(),
};
