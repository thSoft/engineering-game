import { nanoid } from "nanoid";
import type { PartDefinition, PortInstance } from "./types";

export const lightBulb: PartDefinition<"LIGHT_BULB"> = {
  type: "LIGHT_BULB",
  label: "Light Bulb",

  createPorts(partId: string): Array<PortInstance> {
    return [
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
        definitionId: "LIGHT_OUT",
        flowState: "off",
        position: { side: "bottom", offset: 0.5 },
      },
    ];
  },
};
