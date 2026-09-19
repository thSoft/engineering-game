import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { BlowerView } from "./BlowerView.tsx";

export const Blower = definePart("blower", {
  label: "Blower",
  parameters: {},
  inputPorts: {
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
    airOut: {
      label: "air out",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
  },
  color: "#00adee",
  description: "Provides air flow",
  render: ({ toggle }, _, { airOut }) => {
    return <BlowerView toggle={toggle} airOut={airOut} />;
  },
  compute: ({ toggle }) => ({
    airOut: toggle,
  }),
});
