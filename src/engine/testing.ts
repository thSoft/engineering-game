import { evaluateTestCase, getInitialLevelState, LevelDefinition } from "./levels.ts";
import { Connection } from "./connections.ts";
import { expect } from "vitest";
import { PartInstance } from "./parts.tsx";

export function testLevel(
  levelDefinition: LevelDefinition,
  parts: PartInstance[],
  connections: Connection[],
  expectedSuccess: boolean,
) {
  const levelState = getInitialLevelState(levelDefinition);
  levelState.connections = connections;
  levelState.parts = [...levelState.parts, ...parts];
  const result = evaluateTestCase(levelDefinition.testCase, levelState);
  expect(result.assertionResults.every((assertionResult) => assertionResult.success)).toBe(
    expectedSuccess,
  );
}
