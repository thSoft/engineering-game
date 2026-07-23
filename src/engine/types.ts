export type PartId = string;
export type PortId = string;
export type ConnectionId = string;

export type PortDirection = "input" | "output";
export type PortKind = "state" | "flow" | "event";
export type PortSide = "top" | "right" | "bottom" | "left";

/** A normalized position along one edge of its owning part node. */
export interface PortPosition {
  side: PortSide;
  offset: number;
}

export type PartType = "POWER_SOURCE" | "SWITCH" | "LIGHT_BULB";

export type PortDefinitionId =
  | "POWER_IN"
  | "POWER_OUT"
  | "TOGGLE"
  | "LIGHT_OUT";

export type PowerSourceState = Record<string, never>;

export interface SwitchState {
  on: boolean;
}

export interface LightBulbState {
  lit?: boolean;
}

export type PartStateMap = {
  POWER_SOURCE: PowerSourceState;
  SWITCH: SwitchState;
  LIGHT_BULB: LightBulbState;
};

export type AnyPartState = PartStateMap[PartType];

export interface PartInstance<T extends PartType = PartType> {
  id: PartId;
  type: T;
  position: { x: number; y: number };
  state: PartStateMap[T];
}

export interface PortInstance {
  id: PortId;
  partId: PartId;
  definitionId: PortDefinitionId;
  /** The boolean field on the owning part state, used by state ports. */
  stateKey?: string;
  /** The current value of a flow port when it is not derived from part state. */
  flowState?: boolean;
  position: PortPosition;
}

export interface PortDefinition {
  label: string;
  direction: PortDirection;
  kind: PortKind;
}

export interface Connection {
  id: ConnectionId;
  fromPortId: PortId;
  toPortId: PortId;
}

export interface Puzzle {
  name: string;
  parts: PartInstance[];
  ports: PortInstance[];
  connections: Connection[];
}

export interface PartDefinition<T extends PartType> {
  type: T;
  label: string;
  defaultState?: PartStateMap[T];
  createPorts(partId: string): Array<PortInstance>;
}
