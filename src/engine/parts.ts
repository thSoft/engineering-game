import { nanoid } from "nanoid";
import {
  PortDefinitionId,
  type AnyPortState,
  type PortInstance,
} from "./ports";

export type PartId = string;

export type AnyPartParameters = PartParametersMap[PartType];

export type NodePosition = {
  x: number;
  y: number;
};

export interface PartInstance<T extends PartType = PartType> {
  id: PartId;
  type: T;
  position: NodePosition;
  parameters: PartParametersMap[T];
  ports: Partial<Record<PortDefinitionId, PortInstance>>;
}

export interface PartDefinition<T extends PartType> {
  label: string;
  defaultParameters: PartParametersMap[T];
  createPorts(
    partId: PartId,
  ): Partial<Record<PortDefinitionId, Omit<PortInstance, "state">>>;
  computeOutputState(
    part: PartInstance<T>,
    inputStates: Map<PortDefinitionId, AnyPortState>,
  ): Map<PortDefinitionId, AnyPortState>;
}

export function getPartLabel(type: PartType): string {
  return partDefinitions[type]?.label ?? type;
}

export type PartType = "POWER_SOURCE" | "SWITCH" | "LIGHT_BULB";

export interface PartParametersMap {
  POWER_SOURCE: {};
  SWITCH: {};
  LIGHT_BULB: {};
}

export const powerSource: PartDefinition<"POWER_SOURCE"> = {
  label: "Power Source",
  defaultParameters: {},
  createPorts(partId: PartId) {
    return {
      POWER_OUT: {
        id: nanoid(),
        partId,
        definitionId: "POWER_OUT",
        position: { side: "bottom", offset: 0.5 },
      },
    };
  },
  computeOutputState(): Map<PortDefinitionId, AnyPortState> {
    const outputState = new Map<PortDefinitionId, AnyPortState>();
    outputState.set("POWER_OUT", { on: true });
    return outputState;
  },
};

export const switchPart: PartDefinition<"SWITCH"> = {
  label: "Switch",
  defaultParameters: {},
  createPorts(partId: PartId) {
    return {
      TOGGLE: {
        id: nanoid(),
        partId,
        definitionId: "TOGGLE",
        position: { side: "left", offset: 0.5 },
      },
      POWER_IN: {
        id: nanoid(),
        partId,
        definitionId: "POWER_IN",
        position: { side: "top", offset: 0.5 },
      },
      POWER_OUT: {
        id: nanoid(),
        partId,
        definitionId: "POWER_OUT",
        position: { side: "bottom", offset: 0.5 },
      },
    };
  },
  computeOutputState(
    part: PartInstance<"SWITCH">,
    inputStates: Map<PortDefinitionId, AnyPortState>,
  ): Map<PortDefinitionId, AnyPortState> {
    const outputState = new Map<PortDefinitionId, AnyPortState>();
    const powerInPortState = inputStates.get("POWER_IN");
    const togglePortState = part.ports["TOGGLE"];
    if (powerInPortState && togglePortState) {
      outputState.set("POWER_OUT", {
        on: powerInPortState.on && togglePortState.state.on,
      });
    }
    return outputState;
  },
};

export const lightBulb: PartDefinition<"LIGHT_BULB"> = {
  label: "Light Bulb",
  defaultParameters: {},
  createPorts(partId: PartId) {
    return {
      POWER_IN: {
        id: nanoid(),
        partId,
        definitionId: "POWER_IN",
        position: { side: "top", offset: 0.5 },
      },
      LIGHT_OUT: {
        id: nanoid(),
        partId,
        definitionId: "LIGHT_OUT",
        position: { side: "bottom", offset: 0.5 },
      },
    };
  },
  computeOutputState(
    _: PartInstance<"LIGHT_BULB">,
    inputStates: Map<PortDefinitionId, AnyPortState>,
  ): Map<PortDefinitionId, AnyPortState> {
    const outputState = new Map<PortDefinitionId, AnyPortState>();
    const powerInPortState = inputStates.get("POWER_IN");
    if (powerInPortState) {
      outputState.set("LIGHT_OUT", { on: powerInPortState.on });
    }
    return outputState;
  },
};

export const partDefinitions: {
  [K in keyof PartParametersMap]: PartDefinition<K>;
} = {
  POWER_SOURCE: powerSource,
  SWITCH: switchPart,
  LIGHT_BULB: lightBulb,
};
