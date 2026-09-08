import _ from "lodash";
import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { Connection, ConnectionId } from "../engine/connections";

import {
  createSimulationInput,
  DeskLamp,
  getCurrentTime,
  getInitialLevelState,
  getLevelDefinitionById,
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
import { Draft, produce } from "immer";

function setGameState(recipe: (state: Draft<GameState>) => void) {
  useGameStore.setState(produce(recipe));
}

function makeLevelAvailable(levelDefinitionId: LevelDefinitionId) {
  setGameState((state) => {
    const newLevel = getInitialLevelState(getLevelDefinitionById(levelDefinitionId)!);
    state.levelStates.push(newLevel);
  });
}

export const setShowNewLevels = (showNewLevels: boolean) => {
  useGameStore.setState({
    showNewLevels,
  });
};

function updateExperimentData(state: Draft<LevelState>) {
  if (state.behaviorMode === BehaviorMode.EXPERIMENT) {
    // Run a simulation to get the new experiment state
    if (state.behaviorMode === BehaviorMode.EXPERIMENT) {
      const simulationResult = simulate(
        state.experimentData.history,
        state,
        state.experimentData.initialState,
      );
      const values = _.maxBy(simulationResult.actionResults, getTime)?.states;
      if (values !== undefined) {
        state.experimentData.initialState = values.filter((value) => {
          const portDefinition = getDefinitionOfPort(value.portRef, state.parts);
          return portDefinition?.kind === "state";
        });
      }
    }
    // Reset the experiment history
    state.experimentData.history = createSimulationInput(Date.now());
  }
}

function setCurrentLevel(mutateLevelState: (draft: Draft<LevelState>) => void): void {
  setGameState((state) => {
    if (!state.currentLevelDefinitionId) return;
    const existingLevelState = getLevelStateByDefinitionId(state, state.currentLevelDefinitionId);
    if (!existingLevelState) {
      makeLevelAvailable(state.currentLevelDefinitionId);
    }
    state.levelStates.forEach((levelState) => {
      if (levelState.definitionId === state.currentLevelDefinitionId) {
        mutateLevelState(levelState);
      }
    });
  });
}

export function addPart(definitionId: PartDefinitionId, position: PartPosition) {
  const partId = nanoid();
  const definition = getPartDefinitionById(definitionId);
  if (!definition) return;

  const newPart = createPartInstance(partId, position, definitionId, definition);
  setCurrentLevel((state) => {
    state.parts.push(newPart);
    updateExperimentData(state);
  });
}

export function deletePart(partId: PartId): void {
  setCurrentLevel((state) => {
    const removedPortRefs = (getPart(state.parts, partId)?.portInstances ?? []).map((port) =>
      refPort(partId, port.key),
    );

    state.parts = state.parts.filter((part) => part.id !== partId);
    state.connections = state.connections.filter(
      (connection) =>
        !removedPortRefs.some((ref) => deepEqual(ref, connection.source)) &&
        !removedPortRefs.some((ref) => deepEqual(ref, connection.target)),
    );
    updateExperimentData(state);
  });
}

export function movePart(partId: PartId, position: PartPosition): void {
  setCurrentLevel((state) => {
    state.parts.forEach((part) => {
      if (part.id === partId) {
        part.position = position;
      }
    });
  });
}

export function addConnection(source: PortRef, target: PortRef) {
  setCurrentLevel((state) => {
    const sourceDefinition = getDefinitionOfPort(source, state.parts);
    const targetDefinition = getDefinitionOfPort(target, state.parts);
    if (!sourceDefinition || !targetDefinition) {
      return;
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
      return;
    }
    const exists = state.connections.some(
      (connection) => deepEqual(connection.source, source) && deepEqual(connection.target, target),
    );
    if (exists) return;

    const newConnection: Connection = {
      id: nanoid(),
      source,
      target,
    };
    state.connections.push(newConnection);
    updateExperimentData(state);
  });
}

export function deleteConnection(connectionId: ConnectionId) {
  setCurrentLevel((state) => {
    _.remove(state.connections, (connection) => connection.id === connectionId);
    updateExperimentData(state);
  });
}

export function loadLevel(definitionId?: LevelDefinitionId) {
  useGameStore.setState({
    currentLevelDefinitionId: definitionId,
  });
  if (definitionId) {
    const levelState = getLevelStateByDefinitionId(useGameStore.getState(), definitionId);
    if (levelState && levelState.status === LevelStatus.NOT_STARTED) {
      setLevelStatus(LevelStatus.IN_PROGRESS);
    }
  }
}

export function setCurrentTime(currentTime: number) {
  setCurrentLevel((state) => {
    switch (state.behaviorMode) {
      case BehaviorMode.TEST_CASE:
        state.testCaseData.currentTime = currentTime;
        break;
      case BehaviorMode.CUSTOM_SCENARIO:
        state.customScenarioData.currentTime = currentTime;
        break;
      case BehaviorMode.EXPERIMENT:
        // In experiment mode, current time is always the current system time
        break;
    }
  });
}

export function addAction(portRef: InputPortRef<any, any>, value: any) {
  setCurrentLevel((state) => {
    const time = getCurrentTime(state);
    const action: Action<any, any> = {
      time,
      portRef,
      value,
    };
    if (state.behaviorMode === BehaviorMode.CUSTOM_SCENARIO) {
      state.customScenarioData.scenario.actions = _.sortBy(
        [...getActionsAfterDelete(state, portRef, time), action],
        (action) => action.time,
      );
    }
    if (state.behaviorMode === BehaviorMode.EXPERIMENT) {
      state.experimentData.history.actions.push(action);
    }
  });
}

export function setBehaviorMode(mode: BehaviorMode) {
  setCurrentLevel((state) => {
    state.behaviorMode = mode;
  });
}

export function setLevelStatus(status: LevelStatus) {
  setCurrentLevel((state) => {
    state.status = status;
  });
}

export function setLevelPhase(phase: LevelPhase) {
  setCurrentLevel((state) => {
    state.phase = phase;
  });
}

export const useGameStore = create<GameState>()(
  persist(
    (_) => {
      return {
        levelStates: [getInitialLevelState(DeskLamp)],
        currentLevelDefinitionId: undefined,
        showNewLevels: true,
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

function getActionsAfterDelete(
  state: LevelState,
  portRef: PortRef,
  time: number,
): Action<any, any>[] {
  return state.customScenarioData.scenario.actions.filter(
    (action) => !(action.time === time && deepEqual(action.portRef, portRef)),
  );
}

export function deleteAction(portRef: PortRef, time: number) {
  setCurrentLevel((state) => {
    state.customScenarioData.scenario.actions = getActionsAfterDelete(state, portRef, time);
  });
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
};

export function setPortValue(portRef: PortRef, value: any) {
  addAction(portRef, value);
}
