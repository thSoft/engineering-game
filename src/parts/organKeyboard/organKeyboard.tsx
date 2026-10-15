import z from "zod";
import { definePart, PortDefinition } from "../../engine/parts.tsx";
import { mapValues, mapValuesWithKey } from "../../engine/utils.ts";
import { pitches } from "../pitches.ts";
import { OrganKeyboardView } from "./OrganKeyboardView.tsx";

export const pressedPorts = mapValues(pitches, (pitch): PortDefinition<boolean> => ({
  label: `${pitch.name} pressed`,
  kind: "state",
  schema: z.boolean(),
  defaultValue: false,
  renderAction: (value, partLabel) => (value ? `Press ${partLabel}` : `Release ${partLabel}`),
}));

export const actionTriggeredPortPrefix = "actionTriggered_" as const;

export const actionTriggeredPorts = mapValuesWithKey(
  pitches,
  actionTriggeredPortPrefix,
  (pitch): PortDefinition<boolean> => ({
    label: `${pitch.name} action triggered`,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  }),
);

export const OrganKeyboard = definePart({
  label: "Organ Keyboard",
  parameters: {},
  inputPorts: pressedPorts,
  outputPorts: actionTriggeredPorts,
  color: "#ffffff",
  description: "",
  render: (pressed, _, actionTriggered) => {
    return <OrganKeyboardView pressed={pressed} actionTriggered={actionTriggered} />;
  },
  compute: (inputs) => mapValuesWithKey(pitches, actionTriggeredPortPrefix, (__, id) => inputs[id]),
});
