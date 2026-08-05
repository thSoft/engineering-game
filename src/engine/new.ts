import { nanoid } from "nanoid";
import z from "zod";
import { PartPosition } from "./parts";
import { PortKind, PortPosition } from "./ports";

// Parameters

export type ParameterDefinition<T> = {
  label: string;
  schema: z.ZodType<T>;
  defaultValue: T;
};

type ParameterValue<P> = P extends ParameterDefinition<infer T> ? T : never;

type ParameterValues<T extends Record<string, ParameterDefinition<any>>> = {
  [K in keyof T]: ParameterValue<T[K]>;
};

// Ports

export type PortDefinition<T> = {
  label: string;
  kind: PortKind;
  schema: z.ZodType<T>;
  defaultValue: T;
  defaultPosition: PortPosition;
};

type PortValue<P> = P extends PortDefinition<infer T> ? T : never;

type PortValues<T extends Record<string, PortDefinition<any>>> = {
  [K in keyof T]: PortValue<T[K]>;
};

// Parts

export type PartId = string & { __brand: "PartId" };

export const Plug = definePart("PLUG", {
  label: "Plug",
  parameters: {},
  inputPorts: {
    plugged: {
      label: "plugged",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "top", offset: 0.5 },
    },
  },
  outputPorts: {
    powerOut: {
      label: "power out",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "bottom", offset: 0.5 },
    },
  },
  compute: (inputs) => ({
    powerOut: inputs.plugged,
  }),
});

export const Switch = definePart("SWITCH", {
  label: "Switch",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "top", offset: 0.5 },
    },
    toggle: {
      label: "toggle",
      kind: "state",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "left", offset: 0.5 },
    },
  },
  outputPorts: {
    powerOut: {
      label: "power out",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "bottom", offset: 0.5 },
    },
  },
  compute: (inputs) => ({
    powerOut: inputs.powerIn && inputs.toggle,
  }),
});

export const Lightbulb = definePart("LIGHTBULB", {
  label: "Lightbulb",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "top", offset: 0.5 },
    },
  },
  outputPorts: {
    lit: {
      label: "lit",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      defaultPosition: { side: "bottom", offset: 0.5 },
    },
  },
  compute: (inputs) => ({
    lit: inputs.powerIn,
  }),
});

export const partDefinitions: PartDefinitionWithHelpers<any, any, any>[] = [
  Plug,
  Switch,
  Lightbulb,
];

export type PartDefinitionId = string & { __brand: "PartDefinitionId" };

export type PartDefinition<
  P extends Record<string, ParameterDefinition<any>>,
  I extends Record<string, PortDefinition<any>>,
  O extends Record<string, PortDefinition<any>>,
> = {
  id: PartDefinitionId;
  label: string;
  parameters: P;
  inputPorts: I;
  outputPorts: O;
  compute: (
    inputPortValues: PortValues<I>,
    parameters: ParameterValues<P>,
  ) => PortValues<O>;
};

export type PartDefinitionWithHelpers<
  P extends Record<string, ParameterDefinition<any>>,
  I extends Record<string, PortDefinition<any>>,
  O extends Record<string, PortDefinition<any>>,
> = PartDefinition<P, I, O> & {
  allPorts: I & O;
  instance: (id: PartId, position: PartPosition) => PartInstance;
};

export function definePart<
  const P extends Record<string, ParameterDefinition<any>>,
  const I extends Record<string, PortDefinition<any>>,
  const O extends Record<string, PortDefinition<any>>,
>(id: string, definition: Omit<PartDefinition<P, I, O>, "id">) {
  const partDefinitionId = id as PartDefinitionId;
  return {
    id: partDefinitionId,
    ...definition,

    allPorts: {
      ...definition.inputPorts,
      ...definition.outputPorts,
    },
    instance: (id: string, position: PartPosition) => {
      const partId = id as PartId;
      const inputPortRef = (portKey: keyof I) => ({
        partId: partId,
        portKey,
      });
      const outputPortRef = (portKey: keyof O) => ({
        partId: partId,
        portKey,
      });
      return {
        id: partId,
        position,
        definitionId: partDefinitionId,
        parameterValues: Object.fromEntries(
          Object.entries(definition.parameters).map(([paramKey, paramDef]) => [
            paramKey,
            paramDef.defaultValue,
          ]),
        ),
        portInstances: Object.entries({
          ...definition.inputPorts,
          ...definition.outputPorts,
        }).map(([portKey, portDef]) => ({
          key: portKey,
          position: portDef.defaultPosition,
        })),

        in: inputPortRef,
        out: outputPortRef,
        act: (portKey: keyof I, value: PortValue<I[typeof portKey]>) =>
          action(inputPortRef(portKey), value),
        assert: (portKey: keyof O, value: PortValue<O[typeof portKey]>) =>
          assertion(outputPortRef(portKey), value),
      };
    },
  };
}

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

export type LevelDefinitionId = string & { __brand: "LevelDefinitionId" };

export type LevelDefinition = {
  id: LevelDefinitionId;
  label: string;
  fixedParts: PartInstance[];
  exposedPorts: PortRef<any, any, any>[];
  testCase: TestCase;
};

export type PartInstance = {
  id: PartId;
  position: PartPosition;
  definitionId: PartDefinitionId;
  parameterValues: ParameterValues<any>;
  portInstances: PortInstance[];
};

export type PortInstance = {
  key: string;
  position: PortPosition;
};

export type InputPortRef<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["inputPorts"],
> = {
  partId: PartId;
  portKey: K;
};

export type OutputPortRef<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["outputPorts"],
> = {
  partId: PartId;
  portKey: K;
};

export type PortRef<
  P extends PartDefinition<any, any, any> = PartDefinition<any, any, any>,
  IK extends keyof P["inputPorts"] = keyof P["inputPorts"],
  OK extends keyof P["outputPorts"] = keyof P["outputPorts"],
> = InputPortRef<P, IK> | OutputPortRef<P, OK>;

export function refPort(partId: PartId, portKey: string): PortRef {
  return { partId, portKey };
}

export function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
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

// Level state

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
    id: nanoid() as ConnectionId,
    source,
    target,
  };
}

// Game state

export type GameState = {
  levelStates: Partial<Record<LevelDefinitionId, LevelState>>;
  currentLevelDefinitionId: LevelDefinitionId;
};
