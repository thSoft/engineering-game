import { PortDescriptor } from "../engine/parts.tsx";

export function getIndicatorStyle(descriptor: PortDescriptor<boolean>) {
  return `fill: ${descriptor.value ? "lime" : "red"} !important;`;
}

export function visibleIf(descriptor: PortDescriptor<boolean>) {
  return `visibility: ${descriptor.value ? "visible" : "hidden"}`;
}

export function hiddenIf(descriptor: PortDescriptor<boolean>) {
  return `visibility: ${!descriptor.value ? "visible" : "hidden"}`;
}
