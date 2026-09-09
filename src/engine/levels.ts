import {
  deepEqual,
  OutputPortRef,
  PartDefinition,
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

export type LevelDefinitionId = string & { __brand: "LevelDefinitionId" };

export type LevelDefinition = {
  id: LevelDefinitionId;
  label: string;
  availableParts: PartDefinition<any, any, any>[];
  fixedParts: PartInstance[];
  exposedPorts: PortRef<any, any, any>[];
  testCase: TestCase;
  userName: string;
  userNeedQuote: string;
  successQuote: string;
};

export function isExposed(portRef: PortRef<any, any, any>, levelDefinition: LevelDefinition) {
  return levelDefinition.exposedPorts.some((exposedPort) => deepEqual(portRef, exposedPort));
}

export type TestCase = {
  input: SimulationInput;
  assertions: Assertion<any, any>[];
};

export type Assertion<P extends PartDefinition<any, any, any>, K extends keyof P["outputPorts"]> = {
  time: number;
  portRef: OutputPortRef<P, K>;
  value: PortValue<P["outputPorts"][K]>;
};

export function assertion<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["outputPorts"],
>(
  time: number,
  portRef: OutputPortRef<P, K>,
  value: PortValue<P["outputPorts"][K]>,
): Assertion<P, K> {
  return {
    time,
    portRef,
    value,
  };
}

export type TestCaseResult = {
  testCase: TestCase;
  simulationResult: SimulationResult;
  assertionResults: AssertionResult[];
  success: boolean;
};

export type AssertionResult = {
  assertion: Assertion<any, any>;
  actualValue: PortValue<any>;
  success: boolean;
  // TODO trace
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
  const assertionResults = testCase.assertions.map((assertion) => {
    const actualValue = getPortValueAt(assertion.portRef, assertion.time, simulationResult);
    return {
      assertion,
      actualValue,
      success: deepEqual(actualValue, assertion.value),
    };
  });
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
