import _ from "lodash";
import { Connection, getConnectionsWithSource, getConnectionsWithTarget } from "./connections";
import { LevelDefinition, LevelDefinitionId } from "./levels";
import {
  getDefinitionOfPart,
  getPart,
  InputPortRef,
  OutputPortRef,
  PartDefinition,
  PartDefinitionId,
  PartDefinitions,
  PartId,
  PartInstance,
  PortRef,
  PortValue,
  refPort,
} from "./parts";

export type SimulationInput = {
  startTime: number;
  actions: Action[];
};

export type Action<
  Id extends PartDefinitionId = any,
  Key extends keyof PartDefinitions[Id]["inputPorts"] & string = any,
> = {
  time: number;
  portRef: InputPortRef<Id, Key>;
  value: PortValue<PartDefinitions[Id]["inputPorts"][Key]>;
};

export function action<
  Id extends PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["inputPorts"] & string,
>(
  time: number,
  portRef: InputPortRef<Id, Key>,
  value: PortValue<PartDefinitions[Id]["inputPorts"][Key]>,
): Action<Id, Key> {
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
  action?: Action;
  state: PortInstanceValue[];
};

export type PortInstanceValue = {
  portRef: PortRef;
  value: PortValue<any>;
};

function computePropagatedState(
  firstPartId: PartId,
  connections: Connection[],
  parts: PartInstance[],
  initialState: PortInstanceValue[],
): PortInstanceValue[] {
  const visitedParts = new Set<PartId>();
  const queue: PartId[] = [firstPartId];
  let state = _.cloneDeep(initialState);

  while (queue.length > 0) {
    const currentPartId = queue.shift();
    if (!currentPartId) continue;
    const currentPart = getPart(parts, currentPartId);
    if (!currentPart) continue;
    const partDefinition = getDefinitionOfPart(currentPartId, parts);
    if (!partDefinition) continue;
    if (visitedParts.has(currentPart.id)) continue;
    visitedParts.add(currentPart.id);

    // Compute input port values from connections
    for (const inputPortKey of Object.keys(partDefinition.inputPorts)) {
      const currentPortRef = refPort(currentPart.id, inputPortKey);
      const incomingConnections = getConnectionsWithTarget(currentPortRef, connections);
      if (incomingConnections.length > 0) {
        const sourcePortRef = incomingConnections[0].source;
        state = setPortValue(currentPortRef, getPortValue(sourcePortRef, state, parts), state);
      }
    }

    // Compute output ports from computed input port values using the part's output computation logic
    state = computeOutputStateForPart(currentPart, partDefinition, state, parts);

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
  return state;
}

function computeOutputStateForPart(
  partInstance: PartInstance,
  partDefinition: PartDefinition<any, any, any>,
  state: PortInstanceValue[],
  parts: PartInstance[],
): PortInstanceValue[] {
  const inputStateRecord = Object.fromEntries(
    Object.keys(partDefinition.inputPorts).map((portKey) => {
      const portRef = refPort(partInstance.id, portKey);
      const portValue = getPortValue(portRef, state, parts);
      return [portKey, portValue];
    }),
  );
  const outputStateRecord = partDefinition.compute(inputStateRecord, partInstance.parameterValues);
  const outputState = Object.entries(outputStateRecord).map(([portKey, value]) => ({
    portRef: refPort(partInstance.id, portKey),
    value,
  }));
  return applyState(outputState, state);
}

function applyState(
  newState: PortInstanceValue[],
  existingState: PortInstanceValue[],
): PortInstanceValue[] {
  return newState.reduce(
    (updatedState, { portRef, value }) => setPortValue(portRef, value, updatedState),
    existingState,
  );
}

function getPortValue(portRef: PortRef, state: PortInstanceValue[], parts: PartInstance[]) {
  const portState = state.find((state) => _.isEqual(state.portRef, portRef));
  if (portState) {
    return portState.value;
  } else {
    const partDefinition = getDefinitionOfPart(portRef.partId, parts);
    if (!partDefinition) return;
    return partDefinition.allPorts[portRef.portKey].defaultValue;
  }
}

function setPortValue(
  portRef: PortRef,
  value: any,
  state: PortInstanceValue[],
): PortInstanceValue[] {
  return [
    ...state.filter((state) => !_.isEqual(state.portRef, portRef)),
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
  initialState: PortInstanceValue[];
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
  overrideInitialState?: PortInstanceValue[],
): SimulationResult {
  const initialState: PortInstanceValue[] = levelState.parts.flatMap((part) => {
    const definition = getDefinitionOfPart(part.id, levelState.parts);
    if (!definition) return [];
    return Object.keys(definition.inputPorts).map((portKey) => {
      const portRef = refPort(part.id, portKey);
      const overridenValue = overrideInitialState
        ? overrideInitialState.find((portInstanceState) =>
            _.isEqual(portInstanceState.portRef, portRef),
          )
        : undefined;
      const value = overridenValue?.value ?? definition.inputPorts[portKey].defaultValue;
      return {
        portRef: refPort(part.id, portKey),
        value,
      };
    });
  });
  const propagatedInitialState = levelState.parts.reduce(
    (state, part) =>
      computePropagatedState(part.id, levelState.connections, levelState.parts, state),
    initialState,
  );
  const actionResults: SimulationActionResult[] = _.sortBy(
    input.actions,
    (action) => action.time,
  ).reduce(
    (previousResults, action, index) => {
      const previousResult = previousResults[index];
      const stateBeforeAction = previousResult.state;
      const updatedState = setPortValue(action.portRef, action.value, stateBeforeAction);
      const stateAfterAction = computePropagatedState(
        action.portRef.partId,
        levelState.connections,
        levelState.parts,
        updatedState,
      );
      return [
        ...previousResults,
        {
          action: action,
          state: stateAfterAction,
        },
      ];
    },
    [
      {
        state: propagatedInitialState,
      },
    ],
  );
  return {
    input: input,
    actionResults: actionResults,
  };
}

export function getPortValueAt<
  Id extends PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["inputPorts"] & string,
>(
  portRef: InputPortRef<Id, Key>,
  time: number,
  simulationResult: SimulationResult,
): PortValue<PartDefinitions[Id]["inputPorts"][Key]> | undefined;
export function getPortValueAt<
  Id extends PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["outputPorts"] & string,
>(
  portRef: OutputPortRef<Id, Key>,
  time: number,
  simulationResult: SimulationResult,
): PortValue<PartDefinitions[Id]["outputPorts"][Key]> | undefined;
export function getPortValueAt(
  portRef: PortRef,
  time: number,
  simulationResult: SimulationResult,
): PortValue<any> | undefined;
export function getPortValueAt(
  portRef: PortRef,
  time: number,
  simulationResult: SimulationResult,
): PortValue<any> | undefined {
  function stateMatches(state: PortInstanceValue) {
    return _.isEqual(state.portRef, portRef);
  }
  const earlierMatchingResults = _.sortBy(
    simulationResult.actionResults.filter(
      (result) => getTime(result) <= time && result.state.some(stateMatches),
    ),
    getTime,
  );
  const latestMatchingResult = _.last(earlierMatchingResults);
  return latestMatchingResult?.state.find(stateMatches)?.value;
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
