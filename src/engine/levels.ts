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
  getPortValueAt,
  LevelState,
  LevelStatus,
  simulate,
  SimulationInput,
  SimulationResult,
  TimelineMode,
} from "./simulation";

// Level definitions

export const plug = Plug.instance("plug-0", { x: 0, y: 0 });
export const switchPart = Switch.instance("switch-0", { x: 0, y: 150 });
export const lightbulb = Lightbulb.instance("lightbulb-0", { x: 0, y: 300 });

export const DeskLamp = defineLevel("DESK_LAMP", {
  label: "Desk Lamp",
  fixedParts: [plug, switchPart, lightbulb],
  exposedPorts: [plug.in("plugged"), switchPart.in("toggle"), lightbulb.out("lit")],
  testCase: {
    input: {
      startTime: 0,
      actions: [action(1, plug.in("plugged"), true), action(2, switchPart.in("toggle"), true)],
    },
    assertions: [assertion(2, lightbulb.out("lit"), true)],
  },
});

export const levelDefinitions = [DeskLamp];

// Level types and functions

export type LevelDefinitionId = string & { __brand: "LevelDefinitionId" };

export type LevelDefinition = {
  id: LevelDefinitionId;
  label: string;
  fixedParts: PartInstance[];
  exposedPorts: PortRef<any, any, any>[];
  testCase: TestCase;
};

export function getLevelDefinitionById(
  levelDefinitionId: LevelDefinitionId,
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

export function getInitialLevelState(levelDefinition: LevelDefinition): LevelState {
  return {
    parts: levelDefinition.fixedParts,
    connections: [],
    simulationInput: { startTime: 0, actions: [] },
    currentTime: 0,
    timelineMode: TimelineMode.TEST,
    levelStatus: LevelStatus.IN_PROGRESS,
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
