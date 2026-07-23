import type { PortDefinition, PortDefinitionId, PortInstance } from "./types";

export const portDefinitions: { [K in PortDefinitionId]: PortDefinition } = {
  POWER_OUT: {
    label: "power",
    direction: "output",
    kind: "flow",
  },
  POWER_IN: {
    label: "power",
    direction: "input",
    kind: "flow",
  },
  TOGGLE: {
    label: "toggle",
    direction: "input",
    kind: "state",
  },
  LIGHT_OUT: {
    label: "light",
    direction: "output",
    kind: "flow",
  },
};

export function getDefinition(port: PortInstance): PortDefinition {
  return portDefinitions[port.definitionId];
}
