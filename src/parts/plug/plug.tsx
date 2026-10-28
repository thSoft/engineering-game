import { definePart } from "../../engine/parts.ts";
import { PlugView } from "./PlugView.tsx";
import { mechanical } from "../../ports/mechanical.ts";
import { power } from "../../ports/power.ts";

export const Plug = definePart({
  label: "Plug",
  parameters: {},
  inputPorts: {
    plugged: {
      label: "plugged",
      kind: "state",
      type: mechanical,
      defaultValue: false,
      renderAction: (value, partLabel) => (value ? `Plug in ${partLabel}` : `Unplug ${partLabel}`),
    },
  },
  outputPorts: {
    powerOut: {
      label: "power out",
      kind: "flow",
      type: power,
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
