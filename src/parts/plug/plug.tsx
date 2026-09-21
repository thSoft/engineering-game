import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { PlugView } from "./PlugView.tsx";

export const Plug = definePart({
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
  color: "#00d492",
  description: "Emits power if plugged in",
  render: ({ plugged }, _, { powerOut }) => {
    return <PlugView plugged={plugged} powerOut={powerOut} />;
  },
  compute: ({ plugged }) => ({
    powerOut: plugged,
  }),
});
