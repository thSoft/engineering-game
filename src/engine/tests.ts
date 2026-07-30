import { PartId, PartInstance } from "./parts";
import { getPortId, PortDefinitionId, PortStateMap } from "./ports";
import { PortInstanceId, PuzzleState } from "./puzzles";
import {
  computePropagatedPortStates,
  updateParts,
  updatePartsWithPortInstanceId,
} from "./simulation";

export interface PortInstanceState<
  T extends PortDefinitionId = PortDefinitionId,
> {
  portInstanceId: PortInstanceId<T>;
  state: PortStateMap[T];
}

export interface TestCase {
  initialState: PortInstanceState[];
  steps: TestStep[];
}

export type TestStep =
  | {
      type: "ACTION";
      action: PortInstanceState;
    }
  | {
      type: "ASSERTION";
      assertion: PortInstanceState;
    };

export function action<T extends PortDefinitionId = PortDefinitionId>(
  partId: PartId,
  portDefinitionId: T,
  state: PortStateMap[T],
): TestStep {
  return {
    type: "ACTION",
    action: {
      portInstanceId: {
        partId,
        portDefinitionId,
      },
      state,
    },
  };
}

export function assertion<T extends PortDefinitionId = PortDefinitionId>(
  partId: PartId,
  portDefinitionId: T,
  state: PortStateMap[T],
): TestStep {
  return {
    type: "ASSERTION",
    assertion: {
      portInstanceId: {
        partId,
        portDefinitionId,
      },
      state,
    },
  };
}

export interface TestResult {
  testCase: TestCase;
  stepResults: TestStepResult[];
}

export interface SimulationState {
  states: PortInstanceState[];
}

export type TestStepResult = {
  step?: TestStep;
  state: SimulationState;
  success: boolean;
};

export function getPortInstanceStates(
  parts: PartInstance[],
): PortInstanceState[] {
  return parts.flatMap((part) =>
    Object.entries(part.ports).map(([portDefinitionId, port]) => ({
      portInstanceId: {
        partId: part.id,
        portDefinitionId: portDefinitionId as PortDefinitionId,
      },
      state: port.state,
    })),
  );
}

export function applyStates(
  initialStates: PortInstanceState[],
  statesToApply: PortInstanceState[],
): PortInstanceState[] {
  return initialStates.map((state) => {
    const stateToApply = findMatchingState(statesToApply, state);
    return {
      portInstanceId: state.portInstanceId,
      state: stateToApply?.state ?? state.state,
    };
  });
}

function findMatchingState(
  states: PortInstanceState<PortDefinitionId>[],
  state: PortInstanceState<PortDefinitionId>,
) {
  return states.find((stateToApply) =>
    deepEqual(stateToApply.portInstanceId, state.portInstanceId),
  );
}

function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function evaluateTestCase(
  puzzleState: PuzzleState,
  testCase: TestCase,
): TestResult {
  const initialStepResults: TestStepResult[] = [
    {
      state: {
        states: applyStates(
          getPortInstanceStates(puzzleState.parts),
          testCase.initialState,
        ),
      },
      success: true,
    },
  ];
  return {
    testCase: testCase,
    stepResults: testCase.steps.reduce((previousResults, step, index) => {
      const previousResult = previousResults[index];
      const statesBeforeStep = previousResult.state.states;
      function computeStatesAfterStep(
        action: PortInstanceState,
      ): PortInstanceState[] {
        const portId = getPortId(puzzleState.parts, action.portInstanceId);
        if (!portId) {
          return statesBeforeStep;
        }
        const partsWithStatesBeforeStep = statesBeforeStep.reduce(
          (previousParts, oldState) =>
            updatePartsWithPortInstanceId(
              previousParts,
              oldState.portInstanceId,
              oldState.state,
            ),
          puzzleState.parts,
        );
        const updatedParts = portId
          ? updateParts(partsWithStatesBeforeStep, portId, action.state)
          : puzzleState.parts;
        const propagatedParts = computePropagatedPortStates(
          portId,
          puzzleState.connections,
          updatedParts,
        );
        return getPortInstanceStates(propagatedParts);
      }
      const stateAfterStep =
        step.type === "ACTION"
          ? {
              states: computeStatesAfterStep(step.action),
            }
          : previousResult.state;
      function checkPortState(assertion: PortInstanceState): boolean {
        const actualState = findMatchingState(statesBeforeStep, assertion);
        return deepEqual(actualState?.state, assertion.state);
      }
      const success =
        step.type === "ASSERTION" ? checkPortState(step.assertion) : true;
      return [
        ...previousResults,
        {
          step: step,
          state: stateAfterStep,
          success: success,
        },
      ];
    }, initialStepResults),
  };
}
