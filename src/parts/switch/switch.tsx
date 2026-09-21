import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { SwitchView } from "./SwitchView.tsx";

export const Switch = definePart({
  label: "Switch",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
    toggle: {
      label: "toggle",
      kind: "state",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Turn on ${partLabel}` : `Turn off ${partLabel}`,
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
  color: "#00bcff",
  description: "Toggles power flow",
  render: ({ powerIn, toggle }, _, { powerOut }) => {
    return <SwitchView powerIn={powerIn} powerOut={powerOut} toggle={toggle} />;
  },
  compute: ({ powerIn, toggle }) => ({
    powerOut: powerIn && toggle,
  }),
});
