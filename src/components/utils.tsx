import { ReactNode } from "react";
import { getDefinitionOfPart, getDefinitionOfPort, PartInstance, PortRef } from "../engine/parts";

export function displayPortValue(portValue: any): ReactNode {
  return portValue ? "ON" : "OFF";
}

export function getPortRefLabel(portRef: PortRef, parts: PartInstance[]): string {
  const portDefinition = getDefinitionOfPort(portRef, parts);
  const portLabel = portDefinition?.label ?? portRef.portKey.toString();
  const part = parts.find((part) => part.id === portRef.partId);
  const partDefinition = getDefinitionOfPart(portRef.partId, parts);
  const partLabel = part?.label ?? partDefinition?.label ?? portRef.partId;
  return `${partLabel} > ${portLabel}`;
}
