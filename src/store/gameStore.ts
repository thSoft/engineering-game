import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { Connection, ConnectionId } from "../engine/connections";
import type {
  NodePosition,
  PartId,
  PartInstance,
  PartParametersMap,
  PartType,
} from "../engine/parts";
import { partDefinitions } from "../engine/parts";
import type {
  AnyPortState,
  PortDefinitionId,
  PortId,
  PortInstance,
  PortPosition,
} from "../engine/ports";
import { getDefinition } from "../engine/ports";
import type { Puzzle } from "../engine/puzzles";

export interface GameState {
  parts: PartInstance<PartType>[];
  connections: Connection[];
  currentPuzzleName: string;

  addPart: (type: PartType, position: NodePosition) => void;
  deletePart: (partId: PartId) => void;
  movePart: (partId: PartId, position: NodePosition) => void;
  movePort: (portId: PortId, position: PortPosition) => void;
  setPortState: (portId: PortId, state: AnyPortState) => void;
  addConnection: (fromPortId: PortId, toPortId: PortId) => void;
  deleteConnection: (connectionId: ConnectionId) => void;
  resetPuzzle: () => void;
}

function createEmptyPuzzle(): Puzzle {
  return {
    name: "Lamp",
    parts: [],
    connections: [],
  };
}

const initial = createEmptyPuzzle();

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      parts: initial.parts,
      connections: initial.connections,
      currentPuzzleName: initial.name,

      addPart: (type, position) => {
        const partId = nanoid();
        const definition = partDefinitions[type];
        if (!definition) return;

        const newPart: PartInstance<typeof type> = {
          id: partId,
          type,
          position,
          parameters: definition.defaultParameters,
          ports: Object.fromEntries(
            Object.entries(definition.createPorts(partId)).map(
              ([definitionId, port]) => [
                definitionId,
                {
                  ...port,
                  state: getDefinition(port).defaultState,
                },
              ],
            ),
          ),
        };
        set((state) => ({
          parts: [...state.parts, newPart],
        }));
      },

      deletePart: (partId) => {
        set((state) => {
          const removedPortIds = new Set(
            Array.from(
              Object.values(
                state.parts.find((port) => port.id === partId)?.ports ?? {},
              ),
            ).map((port) => port.id),
          );

          return {
            parts: state.parts.filter((port) => port.id !== partId),
            connections: state.connections.filter(
              (connection) =>
                !removedPortIds.has(connection.fromPortId) &&
                !removedPortIds.has(connection.toPortId),
            ),
          };
        });
      },

      movePart: (partId, position) => {
        set((state) => ({
          parts: state.parts.map((part) =>
            part.id === partId ? { ...part, position } : part,
          ),
        }));
      },

      movePort: (portId, position) => {
        set((state) => ({
          parts: state.parts.map((part) => ({
            ...part,
            ports: Object.fromEntries(
              Object.entries(part.ports).map(([definitionId, port]) =>
                port.id === portId
                  ? [definitionId, { ...port, position }]
                  : [definitionId, port],
              ),
            ),
          })),
        }));
      },

      setPortState: (portId, newState) => {
        set((state) => {
          const updatedParts = state.parts.map((part) => ({
            ...part,
            ports: Object.fromEntries(
              Object.entries(part.ports).map(([definitionId, port]) =>
                port.id === portId
                  ? [definitionId, { ...port, state: newState }]
                  : [definitionId, port],
              ),
            ),
          }));
          const propagatedParts = computePropagatedPortStates(
            portId,
            state.connections,
            updatedParts,
          );
          return {
            parts: propagatedParts,
          };
        });
      },

      addConnection: (fromPortId, toPortId) => {
        set((state) => {
          let fromPort: PortInstance | undefined;
          let toPort: PortInstance | undefined;
          for (const part of state.parts) {
            for (const port of Object.values(part.ports)) {
              if (port.id === fromPortId) {
                fromPort = port;
              } else if (port.id === toPortId) {
                toPort = port;
              }
            }
          }
          if (
            !fromPort ||
            !toPort ||
            getDefinition(fromPort).direction !== "output" ||
            getDefinition(toPort).direction !== "input" ||
            getDefinition(fromPort).kind !== getDefinition(toPort).kind
          ) {
            return state;
          }
          const exists = state.connections.some(
            (connection) =>
              connection.fromPortId === fromPortId &&
              connection.toPortId === toPortId,
          );
          if (exists) return state;

          const newConnection: Connection = {
            id: nanoid(),
            fromPortId,
            toPortId,
          };
          const updatedConnections = [...state.connections, newConnection];
          const propagatedParts = computePropagatedPortStates(
            fromPortId,
            updatedConnections,
            state.parts,
          );
          return { connections: updatedConnections, parts: propagatedParts };
        });
      },

      deleteConnection: (connectionId) => {
        set((state) => {
          const updatedConnections = state.connections.filter(
            (connection) => connection.id !== connectionId,
          );
          const connection = state.connections.find(
            (connection) => connection.id === connectionId,
          );
          const toPortId = connection?.toPortId;
          const propagatedParts = toPortId
            ? computePropagatedPortStates(
                toPortId,
                updatedConnections,
                state.parts,
              )
            : state.parts;
          return { connections: updatedConnections, parts: propagatedParts };
        });
      },

      resetPuzzle: () => {
        const fresh = createEmptyPuzzle();
        set({
          parts: fresh.parts,
          connections: fresh.connections,
          currentPuzzleName: fresh.name,
        });
      },
    }),
    {
      name: "engineering-game",
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          return raw ? (JSON.parse(raw) as StorageValue<GameState>) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);

function computePropagatedPortStates(
  portId: string,
  connections: Connection[],
  parts: PartInstance[],
): PartInstance[] {
  const portToPartMap = new Map<PortId, PartInstance>();
  for (const part of parts) {
    for (const port of Object.values(part.ports)) {
      portToPartMap.set(port.id, part);
    }
  }
  const partId = portToPartMap.get(portId)?.id;
  if (!partId) return parts;

  const visitedParts = new Set<PartId>();
  const queue: PartId[] = [partId];
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
        }
        if (
          inputPortStates.get(definitionId) === undefined &&
          definition.kind === "flow"
        ) {
          inputPortStates.set(definitionId, getDefinition(port).defaultState);
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
