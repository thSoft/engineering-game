import { ToggleRight } from "lucide-react";
import { SwitchView } from "./SwitchView.tsx";
import { definePart } from "../../engine/parts.tsx";
import z from "zod";

export const Switch = definePart("switch", {
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
  icon: ToggleRight,
  color: "#00bcff",
  description: "Toggles power flow",
  render: ({ powerIn, toggle }, _, { powerOut }) => {
    return <SwitchView powerIn={powerIn} powerOut={powerOut} toggle={toggle} />;
  },
  compute: ({ powerIn, toggle }) => ({
    powerOut: powerIn && toggle,
  }),
});
