import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { OrganKeyView } from "./OrganKeyView.tsx";

export const OrganKey = definePart({
  label: "Organ Key",
  parameters: {
    black: {
      defaultValue: false,
      label: "black",
      schema: z.boolean(),
    },
  },
  inputPorts: {
    pressed: {
      label: "pressed",
      kind: "state",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) => (value ? `Press ${partLabel}` : `Release ${partLabel}`),
    },
  },
  outputPorts: {
    actionTriggered: {
      label: "action triggered",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
  },
  color: "#ffffff",
  description: "",
  render: ({ pressed }, _, { actionTriggered }) => {
    return <OrganKeyView pressed={pressed} actionTriggered={actionTriggered} />;
  },
  compute: ({ pressed }) => ({
    actionTriggered: pressed,
  }),
});
