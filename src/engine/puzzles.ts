import { Connection } from "./connections";
import { createPart, PartId, PartInstance, PartType } from "./parts";
import { PortDefinitionId, PortInstance } from "./ports";
import { action, assertion, TestCase } from "./tests";

export interface PortInstanceId<T extends PortDefinitionId = PortDefinitionId> {
  partId: PartId;
  portDefinitionId: T;
}

function portOf<T extends PortDefinitionId = PortDefinitionId>(
  part: PartInstance,
  portDefinitionId: T,
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
  testCase: TestCase;
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

export const DESK_LAMP_PLUG = "plug";
export const DESK_LAMP_SWITCH = "switch";
export const DESK_LAMP_LIGHTBULB = "lightbulb";

export const puzzleDefinitions: {
  [K in PuzzleDefinitionId]: PuzzleDefinition;
} = {
  DESK_LAMP: (() => {
    const plug = createPart(DESK_LAMP_PLUG, "PLUG", { x: 0, y: 0 });
    const switchPart = createPart(DESK_LAMP_SWITCH, "SWITCH", { x: 0, y: 150 });
    const lightbulb = createPart(DESK_LAMP_LIGHTBULB, "LIGHTBULB", {
      x: 0,
      y: 300,
    });
    return {
      name: "Desk Lamp",
      availablePartTypes: ["PLUG", "SWITCH", "LIGHTBULB"],
      initialPartInstances: [plug, switchPart, lightbulb],
      exposedPortInstances: [
        portOf(plug, "PLUGGED"),
        portOf(switchPart, "TOGGLE"),
        portOf(lightbulb, "LIGHT_OUT"),
      ],
      testCase: {
        initialState: [],
        steps: [
          action(plug.id, "PLUGGED", { on: true }),
          action(switchPart.id, "TOGGLE", { on: true }),
          assertion(lightbulb.id, "LIGHT_OUT", { on: true }),
        ],
      },
    };
  })(),
};

export function createPuzzle(definitionId: PuzzleDefinitionId): PuzzleState {
  return {
    parts: puzzleDefinitions[definitionId].initialPartInstances,
    connections: [],
  };
}
