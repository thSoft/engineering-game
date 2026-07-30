import { nanoid } from "nanoid/non-secure";
import { expect, test } from "vitest";
import { Connection } from "./connections";
import { PartId, PartInstance } from "./parts";
import { getPortId, PortDefinitionId } from "./ports";
import {
  createPuzzle,
  DESK_LAMP_LIGHTBULB,
  DESK_LAMP_PLUG,
  DESK_LAMP_SWITCH,
  PortInstanceId,
  PuzzleDefinitionId,
  puzzleDefinitions,
} from "./puzzles";
import { evaluateTestCase } from "./tests";

// Test evaluateTestCase for the desk lamp puzzle in the following cases:
// - no connections
// - connection between plug and switch, switch and lightbulb
test("Desk lamp", () => {
  testPuzzleWithConnections("DESK_LAMP", [], false);
  testPuzzleWithConnections(
    "DESK_LAMP",
    [
      connect(DESK_LAMP_PLUG, "POWER_OUT", DESK_LAMP_SWITCH, "POWER_IN"),
      connect(DESK_LAMP_SWITCH, "POWER_OUT", DESK_LAMP_LIGHTBULB, "POWER_IN"),
    ],
    true,
  );
});

type ConnectionDefinition = {
  from: PortInstanceId;
  to: PortInstanceId;
};

function connect(
  fromPartId: PartId,
  fromPortDefinitionId: PortDefinitionId,
  toPartId: PartId,
  toPortDefinitionId: PortDefinitionId,
): ConnectionDefinition {
  return {
    from: { partId: fromPartId, portDefinitionId: fromPortDefinitionId },
    to: { partId: toPartId, portDefinitionId: toPortDefinitionId },
  };
}

function testPuzzleWithConnections(
  puzzleDefinitionId: PuzzleDefinitionId,
  connectionDefinitions: ConnectionDefinition[],
  expectedSuccess: boolean,
) {
  const puzzleState = createPuzzle(puzzleDefinitionId);
  puzzleState.connections = connectionDefinitions.map((definition) =>
    makeConnection(puzzleState.parts, definition),
  );
  const testCase = puzzleDefinitions[puzzleDefinitionId].testCase;
  const result = evaluateTestCase(puzzleState, testCase);
  expect(result.stepResults.every((stepResult) => stepResult.success)).toBe(
    expectedSuccess,
  );
}

function makeConnection(
  parts: PartInstance[],
  connectionDefinition: ConnectionDefinition,
): Connection {
  return {
    id: nanoid(),
    fromPortId: getPortId(parts, connectionDefinition.from)!,
    toPortId: getPortId(parts, connectionDefinition.to)!,
  };
}
