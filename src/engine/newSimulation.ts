import {
  Connection,
  deepEqual,
  getDefinitionOfPart,
  LevelState,
  PartDefinition,
  PartId,
  PartInstance,
  PortInstanceState,
  PortRef,
  processTestStep,
  refPort,
  TestCase,
  TestResult,
  TestStepResult,
} from "./new";

export function computePropagatedPortStates(
  firstPortRef: PortRef,
  connections: Connection[],
  parts: PartInstance[],
  initialPortStates: PortInstanceState[],
): PortInstanceState[] {
  const firstPartId = firstPortRef.partId;

  const visitedParts = new Set<PartId>();
  const queue: PartId[] = [firstPartId];
  var portStates = structuredClone(initialPortStates);

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
      const incomingConnections = getConnectionsWithTarget(
        currentPortRef,
        connections,
      );
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
    portStates = computeOutputStateForPart(
      currentPart,
      partDefinition,
      portStates,
      parts,
    );

    // Enqueue connected parts for further propagation
    for (const outputPortKey of Object.keys(partDefinition.outputPorts)) {
      const outputPortRef = refPort(currentPart.id, outputPortKey);
      const outgoingConnections = getConnectionsWithSource(
        outputPortRef,
        connections,
      );
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

function getPart(parts: PartInstance[], partId: string) {
  return parts.find((part) => part.id === partId);
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
  const outputPortStates = Object.entries(outputPortStatesRecord).map(
    ([portKey, value]) => ({
      portRef: refPort(partInstance.id, portKey),
      value,
    }),
  );
  return applyStates(outputPortStates, portStates);
}

function applyStates(
  newStates: PortInstanceState[],
  existingStates: PortInstanceState[],
): PortInstanceState[] {
  return newStates.reduce(
    (updatedPortStates, { portRef, value }) =>
      setPortValue(portRef, value, updatedPortStates),
    existingStates,
  );
}

function getPortValue(
  portRef: PortRef<any, any>,
  portStates: PortInstanceState[],
  parts: PartInstance[],
) {
  const portState = portStates.find((state) =>
    deepEqual(state.portRef, portRef),
  );
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

function getConnectionsWithTarget(
  targetPortRef: PortRef<any, any>,
  connections: Connection[],
) {
  return connections.filter((connection) =>
    deepEqual(connection.target, targetPortRef),
  );
}

function getConnectionsWithSource(
  sourcePortRef: PortRef<any, any>,
  connections: Connection[],
) {
  return connections.filter((connection) =>
    deepEqual(connection.source, sourcePortRef),
  );
}

export function evaluateTestCase(
  levelState: LevelState,
  testCase: TestCase,
): TestResult {
  const initialStepResults: TestStepResult[] = [
    {
      states: applyStates(levelState.actions, testCase.initialState),
      success: true,
    },
  ];
  const stepResults = testCase.steps.reduce((previousResults, step, index) => {
    const previousResult = previousResults[index];
    const statesBeforeStep = previousResult.states;
    const statesAfterStep = processTestStep(
      step,
      (action) => {
        const updatedStates = setPortValue(
          action.portRef,
          action.value,
          statesBeforeStep,
        );
        return computePropagatedPortStates(
          action.portRef,
          levelState.connections,
          levelState.parts,
          updatedStates,
        );
      },
      () => previousResult.states,
    );
    const success = processTestStep(
      step,
      () => true,
      (assertion) =>
        deepEqual(
          getPortValue(assertion.portRef, statesBeforeStep, levelState.parts),
          assertion.value,
        ),
    );
    return [
      ...previousResults,
      {
        step: step,
        states: statesAfterStep,
        success: success,
      },
    ];
  }, initialStepResults);
  return {
    testCase: testCase,
    stepResults: stepResults,
    success: stepResults.every((result) => result.success),
  };
}
