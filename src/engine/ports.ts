import { PartId, PartInstance } from "./parts";
import { PortInstanceId } from "./puzzles";

export type PortSide = "top" | "right" | "bottom" | "left";

/** A normalized position along one edge of its owning part node. */
export interface PortPosition {
  side: PortSide;
  offset: number;
}

export type PortDirection = "input" | "output";

export type PortKind = "state" | "flow" | "event";

export type PortId = string;

export interface PortInstance<T extends PortDefinitionId = PortDefinitionId> {
  id: PortId;
  partId: PartId;
  definitionId: PortDefinitionId;
  state: PortStateMap[T]; // TODO remove, use only PortInstanceState instead
  position: PortPosition;
}

export interface PortDefinition<T extends PortDefinitionId = PortDefinitionId> {
  label: string;
  direction: PortDirection;
  kind: PortKind;
  defaultState: PortStateMap[T];
}

export type AnyPortState = PortStateMap[PortDefinitionId];

export function getDefinition(
  port: Omit<PortInstance, "state">,
): PortDefinition {
  return portDefinitions[port.definitionId];
}

export function getPortId(
  parts: PartInstance[],
  instanceId: PortInstanceId,
): PortId | undefined {
  const part = parts.find((part) => part.id === instanceId.partId);
  if (!part) return;
  return part.ports[instanceId.portDefinitionId]?.id;
}

export type PortDefinitionId =
  | "PLUGGED"
  | "POWER_IN"
  | "POWER_OUT"
  | "TOGGLE"
  | "LIGHT_OUT";

export type PortStateMap = {
  PLUGGED: { on: boolean };
  POWER_OUT: { on: boolean };
  POWER_IN: { on: boolean };
  TOGGLE: { on: boolean };
  LIGHT_OUT: { on: boolean };
};

export const portDefinitions: { [K in PortDefinitionId]: PortDefinition } = {
  PLUGGED: {
    label: "plugged",
    direction: "input",
    kind: "state",
    defaultState: { on: false },
  },
  POWER_OUT: {
    label: "power out",
    direction: "output",
    kind: "flow",
    defaultState: { on: false },
  },
  POWER_IN: {
    label: "power in",
    direction: "input",
    kind: "flow",
    defaultState: { on: false },
  },
  TOGGLE: {
    label: "toggle",
    direction: "input",
    kind: "state",
    defaultState: { on: false },
  },
  LIGHT_OUT: {
    label: "light",
    direction: "output",
    kind: "flow",
    defaultState: { on: false },
  },
};
