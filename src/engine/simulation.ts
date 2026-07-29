import type { Connection } from "./connections";
import {
  type PartId,
  type PartInstance,
  type PartParametersMap,
  partDefinitions,
} from "./parts";
import {
  type AnyPortState,
  type PortDefinitionId,
  type PortId,
  type PortInstance,
  getDefinition,
} from "./ports";
import type { PuzzleState } from "./puzzles";

export function computePropagatedPortStates(
  sourcePortId: string,
  connections: Connection[],
  parts: PartInstance[],
): PartInstance[] {
  const portToPartMap = new Map<PortId, PartInstance>();
  for (const part of parts) {
    for (const port of Object.values(part.ports)) {
      portToPartMap.set(port.id, part);
    }
  }
  const sourcePartId = portToPartMap.get(sourcePortId)?.id;
  if (!sourcePartId) return parts;

  const visitedParts = new Set<PartId>();
  const queue: PartId[] = [sourcePartId];
  const updatedParts = structuredClone(parts);

  while (queue.length > 0) {
    const currentPartId = queue.shift()!;
    const currentPart = parts.find((part) => part.id === currentPartId);
    if (!currentPart) continue;
    if (visitedParts.has(currentPart.id)) continue;
    visitedParts.add(currentPart.id);

    // Compute input port states from connections
    const inputPortStates = new Map<PortDefinitionId, AnyPortState>();
    const entries = Object.entries(currentPart.ports) as [
      [PortDefinitionId, PortInstance],
    ];
    for (const [definitionId, port] of entries) {
      const definition = getDefinition(port);
      if (definition.direction === "input") {
        const incomingConnections = connections.filter(
          (connection) => connection.toPortId === port.id,
        );
        if (incomingConnections.length > 0) {
          const fromPortId = incomingConnections[0].fromPortId;
          const fromPort = updatedParts
            .flatMap((part) => Array.from(Object.values(part.ports)))
            .find((port) => port.id === fromPortId);
          if (fromPort) {
            inputPortStates.set(definitionId, fromPort.state);
          }
        } else {
          if (
            inputPortStates.get(definitionId) === undefined &&
            definition.kind === "flow"
          ) {
            inputPortStates.set(definitionId, getDefinition(port).defaultState);
          } else {
            inputPortStates.set(definitionId, port.state);
          }
        }
      }
    }

    // Compute output ports from computed input port states using the part's output computation logic
    const outputPortStates = computeOutputStateForPart(
      currentPart,
      inputPortStates,
    );

    // Update the current part's ports with the new states
    const partIndex = updatedParts.findIndex(
      (part) => part.id === currentPart.id,
    );
    if (partIndex !== -1) {
      const updatedPart = { ...updatedParts[partIndex] };
      for (const [definitionId, newState] of [
        ...inputPortStates.entries(),
        ...outputPortStates.entries(),
      ]) {
        const port = updatedPart.ports[definitionId];
        if (port) {
          updatedPart.ports[definitionId] = { ...port, state: newState };
        }
      }
      updatedParts[partIndex] = updatedPart;
    }

    // Enqueue connected parts for further propagation
    for (const connection of connections) {
      if (
        updatedParts
          .filter((part) => part.id === currentPartId)
          .flatMap((part) =>
            Object.values(part.ports)
              .filter((port) => getDefinition(port).direction === "output")
              .map((port) => port.id),
          )
          .includes(connection.fromPortId)
      ) {
        const nextPartId = portToPartMap.get(connection.toPortId)?.id;
        if (nextPartId && !visitedParts.has(nextPartId)) {
          queue.push(nextPartId);
        }
      }
    }
  }
  return updatedParts;
}

function computeOutputStateForPart<K extends keyof PartParametersMap>(
  part: PartInstance<K>,
  inputPortStates: Map<PortDefinitionId, AnyPortState>,
): Map<PortDefinitionId, AnyPortState> {
  const definition = partDefinitions[part.type];
  if (!definition) return new Map();
  return definition.computeOutputState(part, inputPortStates);
}

export function updateParts(
  state: PuzzleState,
  portId: PortId,
  newState: AnyPortState,
) {
  return state.parts.map((part) => ({
    ...part,
    ports: Object.fromEntries(
      Object.entries(part.ports).map(([definitionId, port]) =>
        port.id === portId
          ? [definitionId, { ...port, state: newState }]
          : [definitionId, port],
      ),
    ),
  }));
}
