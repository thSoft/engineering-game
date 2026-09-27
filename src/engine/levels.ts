import _ from "lodash";
import {
  getDefinitionOfPort,
  OutputPortRef,
  PartDefinitionId,
  PartDefinitions,
  PartInstance,
  PortRef,
  PortValue,
} from "./parts";
import {
  BehaviorMode,
  getPortValueAt,
  LevelPhase,
  LevelState,
  LevelStatus,
  simulate,
  SimulationInput,
  SimulationResult,
} from "./simulation";
import { displayPortValue, getPortRefLabel } from "../components/utils.tsx";

export type LevelDefinitionId = string & { __brand: "LevelDefinitionId" };

export type LevelDefinition = {
  id: LevelDefinitionId;
  label: string;
  availableParts: PartDefinitionId[];
  fixedParts: PartInstance[];
  exposedPorts: PortRef[];
  testCase: TestCase;
  userName: string;
  userNeedQuote: string;
  successQuote: string;
};

export function isExposed(portRef: PortRef, levelDefinition: LevelDefinition) {
  return levelDefinition.exposedPorts.some((exposedPort) => _.isEqual(portRef, exposedPort));
}

export type TestCase = {
  input: SimulationInput;
  assertions: Assertion[];
};

export type Assertion<D = any> = {
  time: number;
  calculate: (simulationResult: SimulationResult) => AssertionResult<D>;
  getStepLabel: (levelState: LevelState) => string;
  getLanePath: (levelState: LevelState) => string[];
  timelineActionLabel: string;
};

export type PortAssertionDebugInfo = {
  actualValue: PortValue<any>;
};

export function portAssertion<
  Id extends PartDefinitionId = any,
  Key extends keyof PartDefinitions[Id]["outputPorts"] & string = any,
>(
  time: number,
  portRef: OutputPortRef<Id, Key>,
  expectedValue: PortValue<PartDefinitions[Id]["outputPorts"][Key]>,
): Assertion<PortAssertionDebugInfo> {
  return {
    time,
    calculate: (simulationResult) => {
      const actualValue = getPortValueAt(portRef, time, simulationResult);
      return {
        success: _.isEqual(actualValue, expectedValue),
        debugInfo: {
          actualValue,
        },
      };
    },
    getStepLabel: (levelState) => {
      const definition = getDefinitionOfPort(portRef, levelState.parts);
      const { partLabel, portLabel } = getPortRefLabel(portRef, levelState.parts);
      const renderer = definition?.renderAssertion;
      return renderer
        ? `${renderer(expectedValue, partLabel)}`
        : `${partLabel}'s ${portLabel} should be ${expectedValue}`;
    },
    getLanePath: (levelState) => {
      const { partLabel, portLabel } = getPortRefLabel(portRef, levelState.parts);
      return [partLabel, portLabel];
    },
    timelineActionLabel: displayPortValue(expectedValue),
  };
}

export type TestCaseResult = {
  testCase: TestCase;
  simulationResult: SimulationResult;
  assertionResults: AssertionResult<any>[];
  success: boolean;
};

export type AssertionResult<D> = {
  success: boolean;
  debugInfo: D;
};

export function defineLevel(id: string, definition: Omit<LevelDefinition, "id">) {
  return { id: id as LevelDefinitionId, ...definition };
}

export function createSimulationInput(startTime: number = 0) {
  return { startTime, actions: [] };
}

export function getInitialLevelState(levelDefinition: LevelDefinition): LevelState {
  return {
    definitionId: levelDefinition.id,
    parts: levelDefinition.fixedParts,
    connections: [],
    experimentData: {
      history: createSimulationInput(),
      initialState: [],
    },
    testCaseData: {
      currentTime: 0,
    },
    customScenarioData: {
      scenario: createSimulationInput(),
      currentTime: 0,
    },
    behaviorMode: BehaviorMode.EXPERIMENT,
    status: LevelStatus.NOT_STARTED,
    phase: LevelPhase.GOAL,
  };
}

export function evaluateTestCase(testCase: TestCase, levelState: LevelState): TestCaseResult {
  const simulationResult = simulate(testCase.input, levelState);
  const assertionResults: AssertionResult<any>[] = testCase.assertions.map((assertion) =>
    assertion.calculate(simulationResult),
  );
  return {
    testCase,
    simulationResult,
    assertionResults,
    success: assertionResults.every((result) => result.success),
  };
}

export function getCurrentTime(levelState: LevelState) {
  switch (levelState.behaviorMode) {
    case BehaviorMode.EXPERIMENT:
      return Date.now();
    case BehaviorMode.TEST_CASE:
      return levelState.testCaseData.currentTime;
    case BehaviorMode.CUSTOM_SCENARIO:
      return levelState.customScenarioData.currentTime;
  }
}
