import _ from "lodash";
import { Connection, getConnectionsWithSource, getConnectionsWithTarget } from "./connections";
import { LevelDefinition, LevelDefinitionId } from "./levels";
import {
  deepEqual,
  getDefinitionOfPart,
  getPart,
  InputPortRef,
  PartDefinition,
  PartId,
  PartInstance,
  PortRef,
  PortValue,
  refPort,
} from "./parts";

export type SimulationInput = {
  startTime: number;
  actions: Action<any, any>[];
};

export type Action<P extends PartDefinition<any, any, any>, K extends keyof P["inputPorts"]> = {
  time: number;
  portRef: InputPortRef<P, K>;
  value: PortValue<P["inputPorts"][K]>;
};

export function action<P extends PartDefinition<any, any, any>, K extends keyof P["inputPorts"]>(
  time: number,
  portRef: InputPortRef<P, K>,
  value: PortValue<P["inputPorts"][K]>,
): Action<P, K> {
  return {
    time,
    portRef,
    value,
  };
}

export type SimulationResult = {
  input: SimulationInput;
  actionResults: SimulationActionResult[];
};

export type SimulationActionResult = {
  action?: Action<any, any>;
  states: PortInstanceState[];
};

export type PortInstanceState<
  P extends PartDefinition<any, any, any> = PartDefinition<any, any, any>,
  IK extends keyof P["inputPorts"] = keyof P["inputPorts"],
  OK extends keyof P["outputPorts"] = keyof P["outputPorts"],
> = {
  portRef: PortRef<P, IK, OK>;
  value: PortValue<P["inputPorts"][IK]> | PortValue<P["outputPorts"][OK]>;
};

function computePropagatedPortStates(
  firstPartId: PartId,
  connections: Connection[],
  parts: PartInstance[],
  initialPortStates: PortInstanceState[],
): PortInstanceState[] {
  const visitedParts = new Set<PartId>();
  const queue: PartId[] = [firstPartId];
  let portStates = _.cloneDeep(initialPortStates);

  while (queue.length > 0) {
    const currentPartId = queue.shift();
    if (!currentPartId) continue;
    const currentPart = getPart(parts, currentPartId);
    if (!currentPart) continue;
    const partDefinition = getDefinitionOfPart(currentPartId, parts);
    if (!partDefinition) continue;
    if (visitedParts.has(currentPart.id)) continue;
    visitedParts.add(currentPart.id);

    // Compute input port states from connections
    for (const inputPortKey of Object.keys(partDefinition.inputPorts)) {
      const currentPortRef = refPort(currentPart.id, inputPortKey);
      const incomingConnections = getConnectionsWithTarget(currentPortRef, connections);
      if (incomingConnections.length > 0) {
        const sourcePortRef = incomingConnections[0].source;
        portStates = setPortValue(
          currentPortRef,
          getPortValue(sourcePortRef, portStates, parts),
          portStates,
        );
      }
    }

    // Compute output ports from computed input port states using the part's output computation logic
    portStates = computeOutputStateForPart(currentPart, partDefinition, portStates, parts);

    // Enqueue connected parts for further propagation
    for (const outputPortKey of Object.keys(partDefinition.outputPorts)) {
      const outputPortRef = refPort(currentPart.id, outputPortKey);
      const outgoingConnections = getConnectionsWithSource(outputPortRef, connections);
      for (const connection of outgoingConnections) {
        const nextPartId = connection.target.partId;
        if (!visitedParts.has(nextPartId)) {
          queue.push(nextPartId);
        }
      }
    }
  }
  return portStates;
}

function computeOutputStateForPart(
  partInstance: PartInstance,
  partDefinition: PartDefinition<any, any, any>,
  portStates: PortInstanceState[],
  parts: PartInstance[],
): PortInstanceState[] {
  const inputPortStatesRecord = Object.fromEntries(
    Object.keys(partDefinition.inputPorts).map((portKey) => {
      const portRef = refPort(partInstance.id, portKey);
      const state = getPortValue(portRef, portStates, parts);
      return [portKey, state];
    }),
  );
  const outputPortStatesRecord = partDefinition.compute(
    inputPortStatesRecord,
    partInstance.parameterValues,
  );
  const outputPortStates = Object.entries(outputPortStatesRecord).map(([portKey, value]) => ({
    portRef: refPort(partInstance.id, portKey),
    value,
  }));
  return applyStates(outputPortStates, portStates);
}

function applyStates(
  newStates: PortInstanceState[],
  existingStates: PortInstanceState[],
): PortInstanceState[] {
  return newStates.reduce(
    (updatedPortStates, { portRef, value }) => setPortValue(portRef, value, updatedPortStates),
    existingStates,
  );
}

function getPortValue(
  portRef: PortRef<any, any>,
  portStates: PortInstanceState[],
  parts: PartInstance[],
) {
  const portState = portStates.find((state) => deepEqual(state.portRef, portRef));
  if (portState) {
    return portState.value;
  } else {
    const partDefinition = getDefinitionOfPart(portRef.partId, parts);
    if (!partDefinition) return;
    return partDefinition.allPorts[portRef.portKey].defaultValue;
  }
}

function setPortValue(
  portRef: PortRef<any, any>,
  value: any,
  portStates: PortInstanceState[],
): PortInstanceState[] {
  return [
    ...portStates.filter((state) => !deepEqual(state.portRef, portRef)),
    {
      portRef,
      value,
    },
  ];
}

export type LevelState = {
  definitionId: LevelDefinitionId;
  parts: PartInstance[];
  connections: Connection[];
  behaviorMode: BehaviorMode;
  experimentData: ExperimentData;
  testCaseData: TestCaseData;
  customScenarioData: CustomScenarioData;
  status: LevelStatus;
  phase: LevelPhase;
};

export enum BehaviorMode {
  EXPERIMENT,
  TEST_CASE,
  CUSTOM_SCENARIO,
}

export type ExperimentData = {
  history: SimulationInput;
  initialState: PortInstanceState[];
};

export type TestCaseData = {
  currentTime: number;
};

export type CustomScenarioData = {
  scenario: SimulationInput;
  currentTime: number;
};

export enum LevelStatus {
  NOT_STARTED,
  IN_PROGRESS,
  COMPLETED,
}

export enum LevelPhase {
  GOAL,
  BUILD,
  SUCCESS,
}

export function simulate(
  input: SimulationInput,
  levelState: LevelState,
  overrideInitialState?: PortInstanceState[],
): SimulationResult {
  const initialStates: PortInstanceState[] = levelState.parts.flatMap((part) => {
    const definition = getDefinitionOfPart(part.id, levelState.parts);
    if (!definition) return [];
    return Object.keys(definition.inputPorts).map((portKey) => {
      const portRef = refPort(part.id, portKey);
      const overridenValue = overrideInitialState
        ? overrideInitialState.find((portInstanceState) =>
            deepEqual(portInstanceState.portRef, portRef),
          )
        : undefined;
      const value = overridenValue?.value ?? definition.inputPorts[portKey].defaultValue;
      return {
        portRef: refPort(part.id, portKey),
        value,
      };
    });
  });
  const propagatedInitialStates = levelState.parts.reduce(
    (states, part) =>
      computePropagatedPortStates(part.id, levelState.connections, levelState.parts, states),
    initialStates,
  );
  const actionResults: SimulationActionResult[] = _.sortBy(
    input.actions,
    (action) => action.time,
  ).reduce(
    (previousResults, action, index) => {
      const previousResult = previousResults[index];
      const statesBeforeAction = previousResult.states;
      const updatedStates = setPortValue(action.portRef, action.value, statesBeforeAction);
      const statesAfterAction = computePropagatedPortStates(
        action.portRef.partId,
        levelState.connections,
        levelState.parts,
        updatedStates,
      );
      return [
        ...previousResults,
        {
          action: action,
          states: statesAfterAction,
        },
      ];
    },
    [
      {
        states: propagatedInitialStates,
      },
    ],
  );
  return {
    input: input,
    actionResults: actionResults,
  };
}

export function getPortValueAt(
  portRef: PortRef<any, any>,
  time: number,
  simulationResult: SimulationResult,
): PortValue<any> | undefined {
  function stateMatches(state: PortInstanceState) {
    return deepEqual(state.portRef, portRef);
  }
  const earlierMatchingResults = _.sortBy(
    simulationResult.actionResults.filter(
      (result) => getTime(result) <= time && result.states.some(stateMatches),
    ),
    getTime,
  );
  const latestMatchingResult = _.last(earlierMatchingResults);
  return latestMatchingResult?.states.find(stateMatches)?.value;
}

export function getTime(result: SimulationActionResult) {
  return result.action?.time ?? -Infinity;
}

export function getSimulationInput(
  behaviorMode: BehaviorMode,
  levelState: LevelState,
  levelDefinition: LevelDefinition,
): SimulationInput {
  switch (behaviorMode) {
    case BehaviorMode.CUSTOM_SCENARIO:
      return levelState.customScenarioData.scenario;
    case BehaviorMode.TEST_CASE:
      return levelDefinition.testCase.input;
    case BehaviorMode.EXPERIMENT:
      return levelState.experimentData.history;
  }
}
