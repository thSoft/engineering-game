import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { Connection, ConnectionId } from "../engine/connections";
import {
  DeskLamp,
  getInitialLevelState,
  getLevelDefinitionById,
  LevelDefinition,
  LevelDefinitionId,
} from "../engine/levels";
import {
  createPartInstance,
  deepEqual,
  getDefinitionOfPort,
  getPartDefinitionById,
  PartDefinitionId,
  PartId,
  PartPosition,
  PortInstance,
  PortPosition,
  PortRef,
  refPort,
} from "../engine/parts";
import { LevelState } from "../engine/simulation";

export const useGameStore = create<GameState>()(
  persist(
    (set) => {
      function setCurrentLevel(
        computeNewLevelState: (
          oldLevelState: LevelState,
        ) => Partial<LevelState>,
      ): void {
        set((state) => {
          if (state.currentLevelDefinitionId in state.levelStates) {
            return {
              levelStates: Object.fromEntries(
                Object.entries(state.levelStates).map(
                  ([levelDefinitionId, levelState]) => {
                    if (
                      state.currentLevelDefinitionId === levelDefinitionId &&
                      levelState
                    ) {
                      return [
                        levelDefinitionId,
                        {
                          ...levelState,
                          ...computeNewLevelState(levelState),
                        },
                      ];
                    } else {
                      return [levelDefinitionId, levelState];
                    }
                  },
                ),
              ),
            };
          } else {
            const newLevel = getInitialLevelState(
              getLevelDefinitionById(state.currentLevelDefinitionId)!,
            );
            return {
              levelStates: {
                ...state.levelStates,
                [state.currentLevelDefinitionId]: {
                  ...newLevel,
                  ...computeNewLevelState(newLevel),
                },
              },
            };
          }
        });
      }

      const firstLevel: LevelDefinition = DeskLamp;
      return {
        levelStates: {
          [firstLevel.id]: getInitialLevelState(firstLevel),
        },
        currentLevelDefinitionId: firstLevel.id,

        addPart: (definitionId, position) => {
          const partId = nanoid();
          const definition = getPartDefinitionById(definitionId);
          if (!definition) return;

          const newPart = createPartInstance(
            partId,
            position,
            definitionId,
            definition,
          );
          setCurrentLevel((state) => ({
            parts: [...state.parts, newPart],
          }));
        },
        deletePart: (partId) => {
          setCurrentLevel((state) => {
            const removedPortRefs = (
              state.parts.find((part) => part.id === partId)?.portInstances ??
              []
            ).map((port) => refPort(partId, port.key));
            return {
              parts: state.parts.filter((part) => part.id !== partId),
              connections: state.connections.filter(
                (connection) =>
                  !removedPortRefs.some((ref) =>
                    deepEqual(ref, connection.source),
                  ) &&
                  !removedPortRefs.some((ref) =>
                    deepEqual(ref, connection.target),
                  ),
              ),
            };
          });
        },
        movePart: (partId, position) => {
          setCurrentLevel((state) => ({
            parts: state.parts.map((part) =>
              part.id === partId ? { ...part, position } : part,
            ),
          }));
        },
        movePort: (portRef, position) => {
          setCurrentLevel((state) => ({
            parts: state.parts.map((part) => ({
              ...part,
              portInstances: Object.values(part.portInstances).map((port) =>
                deepEqual(refPort(part.id, port.key), portRef)
                  ? { ...port, position }
                  : port,
              ),
            })),
          }));
        },
        addConnection: (source, target) => {
          setCurrentLevel((state) => {
            const sourceDefinition = getDefinitionOfPort(source, state.parts);
            const targetDefinition = getDefinitionOfPort(target, state.parts);
            if (!sourceDefinition || !targetDefinition) {
              return state;
            }

            let sourcePortInstance: PortInstance | undefined;
            let targetPortInstance: PortInstance | undefined;
            for (const part of state.parts) {
              for (const port of part.portInstances) {
                if (deepEqual(refPort(part.id, port.key), source)) {
                  sourcePortInstance = port;
                } else if (deepEqual(refPort(part.id, port.key), target)) {
                  targetPortInstance = port;
                }
              }
            }

            if (
              !sourcePortInstance ||
              !targetPortInstance ||
              sourceDefinition.direction !== "output" ||
              targetDefinition.direction !== "input" ||
              sourceDefinition.kind !== targetDefinition.kind
            ) {
              return state;
            }
            const exists = state.connections.some(
              (connection) =>
                deepEqual(connection.source, source) &&
                deepEqual(connection.target, target),
            );
            if (exists) return state;

            const newConnection: Connection = {
              id: nanoid(),
              source,
              target,
            };
            const updatedConnections = [...state.connections, newConnection];
            return { connections: updatedConnections };
          });
        },
        deleteConnection: (connectionId) => {
          setCurrentLevel((state) => {
            const updatedConnections = state.connections.filter(
              (connection) => connection.id !== connectionId,
            );
            return { connections: updatedConnections };
          });
        },
        loadLevel: (definitionId) => {
          set({
            currentLevelDefinitionId: definitionId,
          });
          setCurrentLevel((state) => state);
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

export function getCurrentLevel(state: GameState): LevelState | undefined {
  return state.levelStates[state.currentLevelDefinitionId];
}

// Game state

export type GameState = {
  levelStates: Partial<Record<LevelDefinitionId, LevelState>>;
  currentLevelDefinitionId: LevelDefinitionId;

  addPart: (definitionId: PartDefinitionId, position: PartPosition) => void;
  deletePart: (partId: PartId) => void;
  movePart: (partId: PartId, position: PartPosition) => void;
  movePort: (portRef: PortRef, position: PortPosition) => void;
  addConnection: (source: PortRef, target: PortRef) => void;
  deleteConnection: (connectionId: ConnectionId) => void;
  loadLevel: (definitionId: LevelDefinitionId) => void;
};
