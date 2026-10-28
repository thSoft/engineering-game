import { definePart } from "../../engine/parts.ts";
import { SwitchView } from "./SwitchView.tsx";
import { power } from "../../ports/power.ts";
import { mechanical } from "../../ports/mechanical.ts";

export const Switch = definePart({
  label: "Switch",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      type: power,
      defaultValue: false,
    },
    toggle: {
      label: "toggle",
      kind: "state",
      type: mechanical,
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Turn on ${partLabel}` : `Turn off ${partLabel}`,
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
  color: "#00bcff",
  description: "Toggles power flow",
  render: ({ powerIn, toggle }, _, { powerOut }) => {
    return <SwitchView powerIn={powerIn} powerOut={powerOut} toggle={toggle} />;
  },
  compute: ({ powerIn, toggle }) => ({
    powerOut: powerIn && toggle,
  }),
});
