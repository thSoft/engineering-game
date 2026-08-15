import { expect, test } from "vitest";
import { connect, Connection } from "./connections";
import {
  DeskLamp,
  evaluateTestCase,
  getInitialLevelState,
  LevelDefinition,
  lightbulb,
  plug,
  switchPart,
} from "./levels";

// Test desk lamp level in the following cases:
// - no connections
// - connection between plug and switch, switch and lightbulb
test("Desk lamp", () => {
  testLevel(DeskLamp, [], false);
  testLevel(
    DeskLamp,
    [
      connect(plug.out("powerOut"), switchPart.in("powerIn")),
      connect(switchPart.out("powerOut"), lightbulb.in("powerIn")),
    ],
    true,
  );
});

function testLevel(
  levelDefinition: LevelDefinition,
  connections: Connection[],
  expectedSuccess: boolean,
) {
  const levelState = getInitialLevelState(levelDefinition);
  levelState.connections = connections;
  const result = evaluateTestCase(levelDefinition.testCase, levelState);
  expect(result.assertionResults.every((assertionResult) => assertionResult.success)).toBe(
    expectedSuccess,
  );
}
