import { ReactNode } from "react";
import z from "zod";
import type { PortVisualState } from "../components/PartNode";
import { getPartDefinitionById, partDefinitions } from "../parts/partDefinitions.tsx";

// Parts

export type PartDefinition<
  P extends Record<string, ParameterDefinition<any>>,
  I extends Record<string, PortDefinition<any>>,
  O extends Record<string, PortDefinition<any>>,
> = {
  label: string;
  parameters: P;
  inputPorts: I;
  outputPorts: O;
  color: string;
  description: string;
  render: (
    inputPortDescriptors: PortDescriptors<I>,
    parameterDescriptors: ParameterDescriptors<P>,
    outputPortDescriptors: PortDescriptors<O>,
    partDescriptor: PartDescriptor,
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
};

export function definePart<
  const P extends Record<string, ParameterDefinition<any>>,
  const I extends Record<string, PortDefinition<any>>,
  const O extends Record<string, PortDefinition<any>>,
>(definition: PartDefinition<P, I, O>): PartDefinitionWithHelpers<P, I, O> {
  return {
    ...definition,

    allPorts: {
      ...definition.inputPorts,
      ...definition.outputPorts,
    },
  };
}

export type PartDefinitions = typeof partDefinitions;

export type PartDefinitionId = keyof PartDefinitions;

export type PartId = string & { readonly __brand?: "PartId" };

export type PartInstance<K extends PartDefinitionId = PartDefinitionId> = {
  id: PartId;
  label: string;
  position: PartPosition;
  definitionId: K;
  parameterValues: ParameterValues<PartDefinitions[K]["parameters"]>;
  portInstances: PortInstance[];
};

export function createPartInstance<K extends PartDefinitionId>(
  partDefinitionId: K,
  id: string,
  position: PartPosition,
  label?: string,
): PartInstance<K> {
  const partId = toPartId(id);
  const createPortInstance = (portKey: string): PortInstance => ({
    key: portKey,
  });
  const definition = getPartDefinitionById(partDefinitionId);
  return {
    id: partId,
    position,
    label: label ?? definition.label,
    definitionId: partDefinitionId,
    parameterValues: Object.fromEntries(
      Object.entries(definition.parameters).map(([paramKey, paramDef]) => [
        paramKey,
        paramDef.defaultValue,
      ]),
    ) as ParameterValues<PartDefinitions[K]["parameters"]>,
    portInstances: [
      ...Object.keys(definition.inputPorts).map((key) => createPortInstance(key)),
      ...Object.keys(definition.outputPorts).map((key) => createPortInstance(key)),
    ],
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

export function getPart(parts: PartInstance[], partId: PartId) {
  return parts.find((part) => part.id === partId);
}

export function isPartOf<K extends PartDefinitionId>(definitionId: K) {
  return (part: PartInstance): part is PartInstance<K> => part.definitionId === definitionId;
}

export type PartDescriptor = {
  instance: PartInstance;
  index: number;
  isExperiment: boolean;
  isFixed: boolean;
};

// Parameters

export type ParameterDefinition<T> = {
  label: string;
  schema: z.ZodType<T>;
  defaultValue: T;
};

export type ParameterValue<P> = P extends ParameterDefinition<infer T> ? T : never;

export type ParameterValues<T extends Record<string, ParameterDefinition<any>>> = {
  [K in keyof T]: ParameterValue<T[K]>;
};

export type ParameterKey<K extends PartDefinitionId> = keyof PartDefinitions[K]["parameters"] &
  string;

export type ParameterDescriptor<V> = {
  value: V;
  setValue: (value: V) => void;
};

export type ParameterDescriptors<T extends Record<string, ParameterDefinition<any>>> = {
  [K in keyof T]: ParameterDescriptor<ParameterValue<T[K]>>;
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

export type PortInstance = {
  key: string;
};

declare const portDefinitionType: unique symbol;

export type InputPortRef<
  Id extends PartDefinitionId = PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["inputPorts"] & string =
    keyof PartDefinitions[Id]["inputPorts"] & string,
> = {
  partId: PartId;
  portKey: Key;
  /** Preserves the part definition for type inference without adding runtime data. */
  readonly [portDefinitionType]?: Key;
};

export function inPort<
  Id extends PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["inputPorts"] & string,
>(part: PartInstance<Id>, portKey: Key): InputPortRef<Id, Key> {
  return { partId: part.id, portKey };
}

export type OutputPortRef<
  Id extends PartDefinitionId = PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["outputPorts"] & string =
    keyof PartDefinitions[Id]["outputPorts"] & string,
> = {
  partId: PartId;
  portKey: Key;
  /** Preserves the part definition for type inference without adding runtime data. */
  readonly [portDefinitionType]?: Key;
};

export function outPort<
  Id extends PartDefinitionId,
  Key extends keyof PartDefinitions[Id]["outputPorts"] & string,
>(part: PartInstance<Id>, portKey: Key): OutputPortRef<Id, Key> {
  return { partId: part.id, portKey };
}

export type PortRef = {
  partId: PartId;
  portKey: string;
};

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

export function getPort(portRef: PortRef, parts: PartInstance[]): PortInstance | undefined {
  const part = parts.find((p) => p.id === portRef.partId);
  if (!part) return undefined;
  return part.portInstances.find((port) => port.key === portRef.portKey);
}

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
