import { nanoid } from "nanoid";
import {
  deepEqual,
  InputPortRef,
  Lightbulb,
  OutputPortRef,
  PartDefinition,
  PartInstance,
  Plug,
  PortRef,
  PortValue,
  Switch,
} from "./parts";

// Level definitions

export const plug = Plug.instance("plug-0", { x: 0, y: 0 });
export const switchPart = Switch.instance("switch-0", { x: 0, y: 150 });
export const lightbulb = Lightbulb.instance("lightbulb-0", { x: 0, y: 300 });

export const DeskLamp = defineLevel("DESK_LAMP", {
  label: "Desk Lamp",
  fixedParts: [plug, switchPart, lightbulb],
  exposedPorts: [
    plug.in("plugged"),
    switchPart.in("toggle"),
    lightbulb.out("lit"),
  ],
  testCase: {
    initialState: [],
    steps: [
      plug.act("plugged", true),
      switchPart.act("toggle", true),
      lightbulb.assert("lit", true),
    ],
  },
});

export const levelDefinitions = [DeskLamp];

// Level types and functions

export type LevelDefinitionId = string & { __brand: "LevelDefinitionId" };

export type LevelDefinition = {
  id: LevelDefinitionId;
  label: string;
  fixedParts: PartInstance[];
  exposedPorts: PortRef<any, any, any>[];
  testCase: TestCase;
};

export function getLevelDefinitionById(
  levelDefinitionId: LevelDefinitionId,
): LevelDefinition | undefined {
  return levelDefinitions.find((def) => def.id === levelDefinitionId);
}

export function isExposed(
  portRef: PortRef<any, any, any>,
  levelDefinition: LevelDefinition,
) {
  return levelDefinition.exposedPorts.some((exposedPort) =>
    deepEqual(portRef, exposedPort),
  );
}

export type TestCase = {
  initialState: Action<any, any>[];
  steps: TestStep[];
};

export type TestStep = Action<any, any> | Assertion<any, any>;

export type Action<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["inputPorts"],
> = {
  type: "ACTION";
  portRef: InputPortRef<P, K>;
  value: PortValue<P["inputPorts"][K]>;
};

export function action<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["inputPorts"],
>(
  portRef: InputPortRef<P, K>,
  value: PortValue<P["inputPorts"][K]>,
): Action<P, K> {
  return {
    type: "ACTION",
    portRef,
    value,
  };
}

export type Assertion<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["outputPorts"],
> = {
  type: "ASSERTION";
  portRef: OutputPortRef<P, K>;
  value: PortValue<P["outputPorts"][K]>;
};

export function assertion<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["outputPorts"],
>(
  portRef: OutputPortRef<P, K>,
  value: PortValue<P["outputPorts"][K]>,
): Assertion<P, K> {
  return {
    type: "ASSERTION",
    portRef,
    value,
  };
}

export function processTestStep<O>(
  step: TestStep,
  ifAction: (action: Action<any, any>) => O,
  ifAssertion: (assertion: Assertion<any, any>) => O,
): O {
  switch (step.type) {
    case "ACTION":
      return ifAction(step);
    case "ASSERTION":
      return ifAssertion(step);
  }
}

export type TestResult = {
  testCase: TestCase;
  stepResults: TestStepResult[];
  success: boolean;
};

export type TestStepResult = {
  step?: TestStep;
  states: PortInstanceState[];
  success: boolean;
};

export type PortInstanceState<
  P extends PartDefinition<any, any, any> = PartDefinition<any, any, any>,
  IK extends keyof P["inputPorts"] = keyof P["inputPorts"],
  OK extends keyof P["outputPorts"] = keyof P["outputPorts"],
> = {
  portRef: PortRef<P, IK, OK>;
  value: PortValue<P["inputPorts"][IK]> | PortValue<P["outputPorts"][OK]>;
};

export function defineLevel(
  id: string,
  definition: Omit<LevelDefinition, "id">,
) {
  return { id: id as LevelDefinitionId, ...definition };
}

export function getInitialLevelState(
  levelDefinition: LevelDefinition,
): LevelState {
  return {
    parts: levelDefinition.fixedParts,
    connections: [],
    actions: [],
  };
}

export type LevelState = {
  parts: PartInstance[];
  connections: Connection[];
  actions: Action<any, any>[];
};

export type ConnectionId = string & { __brand: "ConnectionId" };

export function toConnectionId(id: string) {
  return id as ConnectionId;
}

export type Connection = {
  id: ConnectionId;
  source: OutputPortRef<any, any>;
  target: InputPortRef<any, any>;
};

export function connect(
  source: OutputPortRef<any, any>,
  target: InputPortRef<any, any>,
): Connection {
  return {
    id: toConnectionId(nanoid()),
    source,
    target,
  };
}
