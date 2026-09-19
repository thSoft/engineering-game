import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { OrganKeyView } from "./OrganKeyView.tsx";

export const OrganKey = definePart("organKey", {
  label: "Organ Key",
  parameters: {},
  inputPorts: {
    pressed: {
      label: "pressed",
      kind: "state",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) => (value ? `Depress ${partLabel}` : `Release ${partLabel}`),
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
