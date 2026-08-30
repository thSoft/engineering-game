import _ from "lodash";
import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { Connection, ConnectionId } from "../engine/connections";

import {
  createSimulationInput,
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
  getPart,
  getPartDefinitionById,
  InputPortRef,
  PartDefinitionId,
  PartId,
  PartPosition,
  PortInstance,
  PortPosition,
  PortRef,
  refPort,
} from "../engine/parts";
import {
  Action,
  BehaviorMode,
  getTime,
  LevelPhase,
  LevelState,
  LevelStatus,
  simulate,
} from "../engine/simulation";

export function makeLevelAvailable(levelDefinitionId: LevelDefinitionId) {
  useGameStore.setState((state) => {
    const newLevel = getInitialLevelState(getLevelDefinitionById(levelDefinitionId)!);
    return {
      levelStates: {
        ...state.levelStates,
        [levelDefinitionId]: newLevel,
      },
    };
  });
}

export const setShowNewLevels = (showNewLevels: boolean) => {
  useGameStore.setState((_) => ({
    showNewLevels,
  }));
};

function getNewExperimentData(state: LevelState) {
  const newHistory =
    state.behaviorMode === BehaviorMode.EXPERIMENT
      ? createSimulationInput(Date.now())
      : state.experimentData.history;
  const simulationResult =
    state.behaviorMode === BehaviorMode.EXPERIMENT
      ? simulate(state.experimentData.history, state, state.experimentData.initialState)
      : undefined;
  const newExperimentState = simulationResult
    ? (_.maxBy(simulationResult.actionResults, getTime)?.states ??
      state.experimentData.initialState)
    : state.experimentData.initialState;
  return {
    ...state.experimentData,
    initialState: newExperimentState,
    history: newHistory,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => {
      function setCurrentLevel(
        computeNewLevelState: (oldLevelState: LevelState) => Partial<LevelState>,
      ): void {
        set((state) => {
          if (!state.currentLevelDefinitionId) return {};
          const existingLevelState = getLevelStateByDefinitionId(
            state,
            state.currentLevelDefinitionId,
          );
          if (!existingLevelState) {
            makeLevelAvailable(state.currentLevelDefinitionId);
          }
          return {
            levelStates: state.levelStates.map((levelState) => {
              if (levelState.definitionId === state.currentLevelDefinitionId) {
                return {
                  ...levelState,
                  ...computeNewLevelState(levelState),
                };
              } else {
                return levelState;
              }
            }),
          };
        });
      }

      const firstLevel: LevelDefinition = DeskLamp;
      return {
        levelStates: [getInitialLevelState(firstLevel)],
        currentLevelDefinitionId: undefined,
        showNewLevels: true,

        addPart: (definitionId, position) => {
          const partId = nanoid();
          const definition = getPartDefinitionById(definitionId);
          if (!definition) return;

          const newPart = createPartInstance(partId, position, definitionId, definition);
          setCurrentLevel((state) => {
            const newState = { ...state, parts: [...state.parts, newPart] };
            return {
              ...newState,
              experimentData: getNewExperimentData(newState),
            };
          });
        },
        deletePart: (partId) => {
          setCurrentLevel((state) => {
            const removedPortRefs = (getPart(state.parts, partId)?.portInstances ?? []).map(
              (port) => refPort(partId, port.key),
            );

            const newState = {
              ...state,
              parts: state.parts.filter((part) => part.id !== partId),
              connections: state.connections.filter(
                (connection) =>
                  !removedPortRefs.some((ref) => deepEqual(ref, connection.source)) &&
                  !removedPortRefs.some((ref) => deepEqual(ref, connection.target)),
              ),
            };
            return {
              ...newState,
              experimentData: getNewExperimentData(newState),
            };
          });
        },
        movePart: (partId, position) => {
          setCurrentLevel((state) => ({
            parts: state.parts.map((part) => (part.id === partId ? { ...part, position } : part)),
          }));
        },
        movePort: (portRef, position) => {
          setCurrentLevel((state) => ({
            parts: state.parts.map((part) => ({
              ...part,
              portInstances: Object.values(part.portInstances).map((port) =>
                deepEqual(refPort(part.id, port.key), portRef) ? { ...port, position } : port,
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
                deepEqual(connection.source, source) && deepEqual(connection.target, target),
            );
            if (exists) return state;

            const newConnection: Connection = {
              id: nanoid(),
              source,
              target,
            };
            const updatedConnections = [...state.connections, newConnection];
            const newState = { ...state, connections: updatedConnections };
            return { ...newState, experimentData: getNewExperimentData(newState) };
          });
        },
        deleteConnection: (connectionId) => {
          setCurrentLevel((state) => {
            const updatedConnections = state.connections.filter(
              (connection) => connection.id !== connectionId,
            );
            const newState = { ...state, connections: updatedConnections };
            return { ...newState, experimentData: getNewExperimentData(newState) };
          });
        },
        loadLevel: (definitionId) => {
          set({
            currentLevelDefinitionId: definitionId,
          });
          if (definitionId) {
            const levelState = getLevelStateByDefinitionId(useGameStore.getState(), definitionId);
            if (levelState && levelState.levelStatus === LevelStatus.NOT_STARTED) {
              setCurrentLevel((state) => ({ ...state, levelStatus: LevelStatus.IN_PROGRESS }));
            }
          }
        },
        setCurrentTime(currentTime) {
          setCurrentLevel((state) => ({ ...state, currentTime: currentTime }));
        },
        addAction(portRef, value) {
          setCurrentLevel((state) => {
            const time =
              state.behaviorMode === BehaviorMode.EXPERIMENT ? Date.now() : state.currentTime;
            const action: Action<any, any> = {
              time,
              portRef,
              value,
            };
            const newSimulationInput =
              state.behaviorMode === BehaviorMode.SANDBOX
                ? {
                    ...state.simulationInput,
                    actions: _.sortBy(
                      [...deleteAction(state, portRef, time), action],
                      (action) => action.time,
                    ),
                  }
                : state.simulationInput;
            const newHistory =
              state.behaviorMode === BehaviorMode.EXPERIMENT
                ? {
                    ...state.experimentData.history,
                    actions: [...state.experimentData.history.actions, action],
                  }
                : state.experimentData.history;
            return {
              ...state,
              simulationInput: newSimulationInput,
              experimentData: {
                ...state.experimentData,
                history: newHistory,
              },
            };
          });
        },
        deleteAction(portRef, time) {
          setCurrentLevel((state) => ({
            ...state,
            simulationInput: {
              ...state.simulationInput,
              actions: deleteAction(state, portRef, time),
            },
          }));
        },
        setBehaviorMode(mode) {
          setCurrentLevel((state) => ({
            ...state,
            behaviorMode: mode,
          }));
        },
        setLevelStatus(status) {
          setCurrentLevel((state) => ({
            ...state,
            levelStatus: status,
          }));
        },
        setLevelPhase(phase) {
          setCurrentLevel((state) => ({
            ...state,
            phase: phase,
          }));
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

function deleteAction(state: LevelState, portRef: PortRef, time: number): Action<any, any>[] {
  return state.simulationInput.actions.filter(
    (action) => !(action.time === time && deepEqual(action.portRef, portRef)),
  );
}

export function getLevelStateByDefinitionId(
  state: GameState,
  definitionId: LevelDefinitionId,
): LevelState | undefined {
  return state.levelStates.find((levelState) => levelState.definitionId === definitionId);
}

// Game state

export type GameState = {
  levelStates: LevelState[];
  currentLevelDefinitionId: LevelDefinitionId | undefined;
  showNewLevels: boolean;

  addPart: (definitionId: PartDefinitionId, position: PartPosition) => void;
  deletePart: (partId: PartId) => void;
  movePart: (partId: PartId, position: PartPosition) => void;
  movePort: (portRef: PortRef, position: PortPosition) => void;
  addConnection: (source: PortRef, target: PortRef) => void;
  deleteConnection: (connectionId: ConnectionId) => void;
  loadLevel: (definitionId?: LevelDefinitionId) => void;
  setCurrentTime: (currentTime: number) => void;
  addAction: (portRef: InputPortRef<any, any>, value: any) => void;
  deleteAction: (portRef: InputPortRef<any, any>, time: number) => void;
  setBehaviorMode: (mode: BehaviorMode) => void;
  setLevelStatus: (status: LevelStatus) => void;
  setLevelPhase: (phase: LevelPhase) => void;
};
