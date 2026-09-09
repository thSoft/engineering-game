import { evaluateTestCase, getInitialLevelState, LevelDefinition } from "./levels.ts";
import { Connection } from "./connections.ts";
import { expect } from "vitest";

export function testLevel(
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
