import { Plug as PlugIcon } from "lucide-react";
import { PlugView } from "./PlugView.tsx";
import { definePart } from "../../engine/parts.tsx";
import z from "zod";

export const Plug = definePart("plug", {
  label: "Plug",
  parameters: {},
  inputPorts: {
    plugged: {
      label: "plugged",
      kind: "state",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) => (value ? `Plug in ${partLabel}` : `Unplug ${partLabel}`),
    },
  },
  outputPorts: {
    powerOut: {
      label: "power out",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
  },
  icon: PlugIcon,
  color: "#00d492",
  description: "Emits power if plugged in",
  render: ({ plugged }, _, { powerOut }) => {
    return <PlugView plugged={plugged} powerOut={powerOut} />;
  },
  compute: ({ plugged }) => ({
    powerOut: plugged,
  }),
});
