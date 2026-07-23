import { nanoid } from "nanoid";
import type { PartDefinition, PortInstance } from "./types";

export const switchPart: PartDefinition<"SWITCH"> = {
  type: "SWITCH",
  label: "Switch",
  defaultState: { on: false },

  createPorts(partId: string): Array<PortInstance> {
    return [
      {
        id: nanoid(),
        partId,
        definitionId: "TOGGLE",
        stateKey: "on",
        position: { side: "left", offset: 0.5 },
      },
      {
        id: nanoid(),
        partId,
        definitionId: "POWER_IN",
        flowState: "off",
        position: { side: "top", offset: 0.5 },
      },
      {
        id: nanoid(),
        partId,
        definitionId: "POWER_OUT",
        flowState: "off",
        position: { side: "bottom", offset: 0.5 },
      },
    ];
  },
};
