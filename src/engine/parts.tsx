import { ReactNode } from "react";
import z from "zod";
import type { PortVisualState } from "../components/PartNode";
import { LucideIcon } from "lucide-react";
import { getPartDefinitionById } from "../parts/partDefinitions.tsx";

// Part definitions

// Part types and functions

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
  icon: LucideIcon;
  color: string;
  description: string;
  render: (
    inputPortDescriptors: PortDescriptors<I>,
    parameters: ParameterValues<P>,
    outputPortDescriptors: PortDescriptors<O>,
  ) => ReactNode;
  compute: (inputPortValues: PortValues<I>, parameters: ParameterValues<P>) => PortValues<O>;
};

export type PartPosition = {
  x: number;
  y: number;
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
      return createPartInstance<P, I, O>(id, position, partDefinitionId, definition);
    },
  };
}

export type PartId = string & { __brand: "PartId" };

export type PartInstance = {
  id: PartId;
  label: string;
  position: PartPosition;
  definitionId: PartDefinitionId;
  parameterValues: ParameterValues<any>;
  portInstances: PortInstance[];
};

export function createPartInstance<
  const P extends Record<string, ParameterDefinition<any>>,
  const I extends Record<string, PortDefinition<any>>,
  const O extends Record<string, PortDefinition<any>>,
>(
  id: string,
  position: PartPosition,
  partDefinitionId: PartDefinitionId,
  definition: Omit<PartDefinition<P, I, O>, "id">,
) {
  const partId = toPartId(id);
  const inputPortRef = (portKey: keyof I): InputPortRef<PartDefinition<P, I, O>, keyof I> => ({
    partId: partId,
    portKey,
  });
  const outputPortRef = (portKey: keyof O): OutputPortRef<PartDefinition<P, I, O>, keyof O> => ({
    partId: partId,
    portKey,
  });
  const createPortInstance = (portKey: string): PortInstance => ({
    key: portKey,
  });
  return {
    id: partId,
    position,
    label: definition.label,
    definitionId: partDefinitionId,
    parameterValues: Object.fromEntries(
      Object.entries(definition.parameters).map(([paramKey, paramDef]) => [
        paramKey,
        paramDef.defaultValue,
      ]),
    ),
    portInstances: [
      ...Object.keys(definition.inputPorts).map((key) => createPortInstance(key)),
      ...Object.keys(definition.outputPorts).map((key) => createPortInstance(key)),
    ],

    in: inputPortRef,
    out: outputPortRef,
  };
}

export function toPartId(id: string) {
  return id as PartId;
}

export function getDefinitionOfPart(
  partId: PartId,
  parts: PartInstance[],
): PartDefinitionWithHelpers<any, any, any> | undefined {
  const partInstance = getPart(parts, partId);
  if (!partInstance) return undefined;
  return getPartDefinitionById(partInstance.definitionId);
}

export function getPart(parts: PartInstance[], partId: string) {
  return parts.find((part) => part.id === partId);
}

// Parameters

export type ParameterDefinition<T> = {
  label: string;
  schema: z.ZodType<T>;
  defaultValue: T;
};
type ParameterValue<P> = P extends ParameterDefinition<infer T> ? T : never;

export type ParameterValues<T extends Record<string, ParameterDefinition<any>>> = {
  [K in keyof T]: ParameterValue<T[K]>;
};

// Ports

export type PortDirection = "input" | "output";

export type PortKind = "state" | "flow" | "event";

export type PortDefinition<T> = {
  label: string;
  kind: PortKind;
  schema: z.ZodType<T>;
  defaultValue: T;
  renderAction?: (value: T, partLabel: string) => string;
  renderAssertion?: (expectedValue: T, partLabel: string) => string;
};

export type PortValue<P> = P extends PortDefinition<infer T> ? T : never;

type PortValues<T extends Record<string, PortDefinition<any>>> = {
  [K in keyof T]: PortValue<T[K]>;
};

export type PortDescriptor<V> = {
  ref: PortRef;
  definition: PortDefinitionWithHelpers<V>;
  value: V;
  visualState: PortVisualState;
  exposed: boolean;
  connected: boolean;
  setValue: (value: V) => void;
  startOrFinishConnection: () => void;
};

export type PortDescriptors<T extends Record<string, PortDefinition<any>>> = {
  [K in keyof T]: PortDescriptor<PortValue<T[K]>>;
};

export type PortInstance = {
  key: string;
};

export type InputPortRef<
  P extends PartDefinition<any, any, any>,
  K extends keyof P["inputPorts"] = keyof P["inputPorts"],
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

export function getPortPath(portRef: PortRef): string {
  return `${portRef.partId}:${String(portRef.portKey)}`;
}

export type PortDefinitionWithHelpers<T> = PortDefinition<T> & {
  direction: PortDirection;
};

export function getDefinitionOfPort(
  portRef: PortRef,
  parts: PartInstance[],
): PortDefinitionWithHelpers<any> | undefined {
  const partDefinition = getDefinitionOfPart(portRef.partId, parts);
  if (!partDefinition) return undefined;
  const inputDefinition = partDefinition.inputPorts[portRef.portKey];
  if (inputDefinition) {
    return { ...inputDefinition, direction: "input" };
  }
  const outputDefinition = partDefinition.outputPorts[portRef.portKey];
  if (outputDefinition) {
    return { ...outputDefinition, direction: "output" };
  }
  return undefined;
}

export function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}
