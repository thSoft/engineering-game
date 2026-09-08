import {
  deepEqual,
  Lightbulb,
  OutputPortRef,
  PartDefinition,
  PartInstance,
  Plug,
  PortRef,
  PortValue,
  Switch,
} from "./parts";
import {
  action,
  BehaviorMode,
  getPortValueAt,
  LevelPhase,
  LevelState,
  LevelStatus,
  simulate,
  SimulationInput,
  SimulationResult,
} from "./simulation";

// Level definitions

export const plug = Plug.instance("plug-0", { x: -150, y: 4 });
export const switchPart = Switch.instance("switch-0", { x: 5.5, y: 4 });
export const lightbulb = Lightbulb.instance("lightbulb-0", { x: 150, y: -42 });

export const DeskLamp = defineLevel("deskLamp", {
  label: "Desk Lamp",
  availableParts: [],
  fixedParts: [plug, switchPart, lightbulb],
  exposedPorts: [plug.in("plugged"), switchPart.in("toggle"), lightbulb.out("lit")],
  testCase: {
    input: {
      startTime: 0,
      actions: [
        action(1, plug.in("plugged"), true),
        action(2, switchPart.in("toggle"), true),
        action(3, switchPart.in("toggle"), false),
      ],
    },
    assertions: [
      assertion(2, lightbulb.out("lit"), true),
      assertion(3, lightbulb.out("lit"), false),
    ],
  },
  userName: "Ada",
  userNeedQuote: "I can't read when it's dark.",
  successQuote: "Nothing is better than reading my favorite book before bed.",
});

export const levelDefinitions = [DeskLamp];

// Level types and functions

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

export function getLevelDefinitionById(
  levelDefinitionId: LevelDefinitionId | undefined,
): LevelDefinition | undefined {
  return levelDefinitions.find((def) => def.id === levelDefinitionId);
}

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
    levelStatus: LevelStatus.NOT_STARTED,
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
