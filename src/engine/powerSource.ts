import { nanoid } from "nanoid";
import type { PartDefinition, PortInstance } from "./types";

export const powerSource: PartDefinition<"POWER_SOURCE"> = {
  type: "POWER_SOURCE",
  label: "Power Source",

  createPorts(partId: string): Array<PortInstance> {
    return [
      {
        id: nanoid(),
        partId,
        definitionId: "POWER_OUT",
        flowState: true,
        position: { side: "bottom", offset: 0.5 },
      },
    ];
  },
};
