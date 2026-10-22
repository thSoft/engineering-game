import { PortDescriptor } from "../engine/parts.tsx";

export function getIndicatorStyle(descriptor: PortDescriptor<boolean>) {
  return `fill: ${descriptor.value ? "lime" : "red"} !important;`;
}

export function visibleIf(descriptor: PortDescriptor<boolean>) {
  return `visibility: ${descriptor.value ? "visible" : "hidden"};`;
}

export function hiddenIf(descriptor: PortDescriptor<boolean>) {
  return `visibility: ${!descriptor.value ? "visible" : "hidden"};`;
}

export function getPulledDownStyle(value: boolean) {
  return `translate: 0 ${value ? 8 : 0}px;`;
}

export function getToggleStyle(toggle: PortDescriptor<boolean>) {
  return `transform: ${toggle.value ? "translateY(-10px)" : "none"};`;
}
