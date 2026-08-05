import { expect, test } from "vitest";
import {
  connect,
  Connection,
  DeskLamp,
  getInitialLevelState,
  LevelDefinition,
  lightbulb,
  plug,
  switchPart,
} from "./new";
import { evaluateTestCase } from "./newSimulation";

// Test desk lamp puzzle in the following cases:
// - no connections
// - connection between plug and switch, switch and lightbulb
test("Desk lamp", () => {
  testPuzzleWithConnections(DeskLamp, [], false);
  testPuzzleWithConnections(
    DeskLamp,
    [
      connect(plug.out("powerOut"), switchPart.in("powerIn")),
      connect(switchPart.out("powerOut"), lightbulb.in("powerIn")),
    ],
    true,
  );
});

function testPuzzleWithConnections(
  levelDefinition: LevelDefinition,
  connections: Connection[],
  expectedSuccess: boolean,
) {
  const puzzleState = getInitialLevelState(levelDefinition);
  puzzleState.connections = connections;
  const result = evaluateTestCase(puzzleState, levelDefinition.testCase);
  expect(result.stepResults.every((stepResult) => stepResult.success)).toBe(
    expectedSuccess,
  );
}
