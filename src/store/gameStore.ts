import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { partDefinitions } from "../engine/parts";
import { getDefinition } from "../engine/ports";
import type {
  Connection,
  PartInstance,
  PartType,
  PortInstance,
  PortPosition,
  Puzzle,
} from "../engine/types";

export interface GameState {
  parts: PartInstance<PartType>[];
  ports: PortInstance[];
  connections: Connection[];
  currentPuzzleName: string;

  addPart: (type: PartType, position: { x: number; y: number }) => void;
  deletePart: (partId: string) => void;
  movePart: (partId: string, position: { x: number; y: number }) => void;
  movePort: (portId: string, position: PortPosition) => void;
  toggleBooleanStatePort: (portId: string) => void;
  addConnection: (fromPortId: string, toPortId: string) => void;
  deleteConnection: (connectionId: string) => void;
  resetPuzzle: () => void;
}

function createEmptyPuzzle(): Puzzle {
  return {
    name: "Empty Puzzle",
    parts: [],
    ports: [],
    connections: [],
  };
}

const initial = createEmptyPuzzle();

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      parts: initial.parts,
      ports: initial.ports,
      connections: initial.connections,
      currentPuzzleName: initial.name,

      addPart: (type, position) => {
        const partId = nanoid();
        const def = partDefinitions[type];
        if (!def) return;

        const newPart: PartInstance<typeof type> = {
          id: partId,
          type,
          position,
          state: { ...(def.defaultState ?? {}) } as PartInstance<
            typeof type
          >["state"],
        };
        const createdPorts = def.createPorts(partId);
        set((state) => ({
          parts: [...state.parts, newPart],
          ports: [...state.ports, ...createdPorts],
        }));
      },

      deletePart: (partId) => {
        set((state) => {
          const removedPortIds = new Set(
            state.ports.filter((p) => p.partId === partId).map((p) => p.id),
          );

          return {
            parts: state.parts.filter((p) => p.id !== partId),
            ports: state.ports.filter((p) => p.partId !== partId),
            connections: state.connections.filter(
              (c) =>
                !removedPortIds.has(c.fromPortId) &&
                !removedPortIds.has(c.toPortId),
            ),
          };
        });
      },

      movePart: (partId, position) => {
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === partId ? { ...p, position } : p,
          ),
        }));
      },

      movePort: (portId, position) => {
        set((state) => ({
          ports: state.ports.map((port) =>
            port.id === portId ? { ...port, position } : port,
          ),
        }));
      },

      toggleBooleanStatePort: (portId) => {
        set((state) => {
          const port = state.ports.find((candidate) => candidate.id === portId);
          if (!port) return state;
          if (getDefinition(port)?.kind !== "state" || !port.stateKey)
            return state;

          return {
            parts: state.parts.map((part) => {
              if (part.id !== port.partId) return part;
              const partState = part.state as Record<string, unknown>;
              const currentValue = partState[port.stateKey!];
              if (typeof currentValue !== "boolean") return part;
              return {
                ...part,
                state: { ...partState, [port.stateKey!]: !currentValue },
              } as PartInstance;
            }),
          };
        });
      },

      addConnection: (fromPortId, toPortId) => {
        set((state) => {
          const fromPort = state.ports.find((port) => port.id === fromPortId);
          const toPort = state.ports.find((port) => port.id === toPortId);
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
            (c) => c.fromPortId === fromPortId && c.toPortId === toPortId,
          );
          if (exists) return state;

          const newConnection: Connection = {
            id: nanoid(),
            fromPortId,
            toPortId,
          };
          return { connections: [...state.connections, newConnection] };
        });
      },

      deleteConnection: (connectionId) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId),
        }));
      },

      resetPuzzle: () => {
        const fresh = createEmptyPuzzle();
        set({
          parts: fresh.parts,
          ports: fresh.ports,
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
