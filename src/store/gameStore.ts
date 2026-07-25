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
import { createPart, partDefinitions } from "../engine/parts";
import type {
  AnyPortState,
  PortDefinitionId,
  PortId,
  PortInstance,
  PortPosition,
} from "../engine/ports";
import { getDefinition } from "../engine/ports";
import {
  puzzleDefinitions,
  type PuzzleDefinitionId,
  type PuzzleState,
} from "../engine/puzzles";

export interface GameState {
  puzzleStates: Partial<Record<PuzzleDefinitionId, PuzzleState>>;
  currentPuzzleDefinitionId: PuzzleDefinitionId;

  addPart: (type: PartType, position: NodePosition) => void;
  deletePart: (partId: PartId) => void;
  movePart: (partId: PartId, position: NodePosition) => void;
  movePort: (portId: PortId, position: PortPosition) => void;
  setPortState: (portId: PortId, state: AnyPortState) => void;
  addConnection: (fromPortId: PortId, toPortId: PortId) => void;
  deleteConnection: (connectionId: ConnectionId) => void;
  loadPuzzle: (definitionId: PuzzleDefinitionId) => void;
}

export function getCurrentPuzzle(state: GameState): PuzzleState | undefined {
  return state.puzzleStates[state.currentPuzzleDefinitionId];
}

function createPuzzle(definitionId: PuzzleDefinitionId): PuzzleState {
  return {
    parts: puzzleDefinitions[definitionId].initialPartInstances,
    connections: [],
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => {
      function setCurrentPuzzle(
        computeNewPuzzleState: (
          oldPuzzleState: PuzzleState,
        ) => Partial<PuzzleState>,
      ): void {
        set((state) => {
          if (state.currentPuzzleDefinitionId in state.puzzleStates) {
            return {
              puzzleStates: Object.fromEntries(
                Object.entries(state.puzzleStates).map(
                  ([puzzleDefinitionId, puzzleState]) => {
                    if (
                      state.currentPuzzleDefinitionId === puzzleDefinitionId
                    ) {
                      return [
                        puzzleDefinitionId,
                        {
                          ...puzzleState,
                          ...computeNewPuzzleState(puzzleState),
                        },
                      ];
                    } else {
                      return [puzzleDefinitionId, puzzleState];
                    }
                  },
                ),
              ),
            };
          } else {
            const newPuzzle = createPuzzle(state.currentPuzzleDefinitionId);
            return {
              puzzleStates: {
                ...state.puzzleStates,
                [state.currentPuzzleDefinitionId]: {
                  ...newPuzzle,
                  ...computeNewPuzzleState(newPuzzle),
                },
              },
            };
          }
        });
      }
      const firstPuzzle: PuzzleDefinitionId = "DESK_LAMP";
      return {
        puzzleStates: {
          [firstPuzzle]: createPuzzle(firstPuzzle),
        },
        currentPuzzleDefinitionId: firstPuzzle,

        addPart: (type, position) => {
          const partId = nanoid();
          const definition = partDefinitions[type];
          if (!definition) return;

          const newPart = createPart(partId, type, position);
          setCurrentPuzzle((state) => ({
            parts: [...state.parts, newPart],
          }));
        },

        deletePart: (partId) => {
          setCurrentPuzzle((state) => {
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
          setCurrentPuzzle((state) => ({
            parts: state.parts.map((part) =>
              part.id === partId ? { ...part, position } : part,
            ),
          }));
        },

        movePort: (portId, position) => {
          setCurrentPuzzle((state) => ({
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
          setCurrentPuzzle((state) => {
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
          setCurrentPuzzle((state) => {
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
          setCurrentPuzzle((state) => {
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

        loadPuzzle: (definitionId: PuzzleDefinitionId) => {
          set({
            currentPuzzleDefinitionId: definitionId,
          });
          setCurrentPuzzle((state) => state);
        },
      };
    },
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
