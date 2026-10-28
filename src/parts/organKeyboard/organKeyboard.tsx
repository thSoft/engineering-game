import { definePart, PortDefinition } from "../../engine/parts.ts";
import { mapValues, mapValuesWithKey } from "../../engine/utils.ts";
import { pitches } from "../pitches.ts";
import { OrganKeyboardView } from "./OrganKeyboardView.tsx";
import { mechanical } from "../../ports/mechanical.ts";

export const pressedPorts = mapValues(pitches, (pitch): PortDefinition<boolean> => ({
  label: `${pitch.name} pressed`,
  kind: "state",
  type: mechanical,
  defaultValue: false,
  renderAction: (value) => (value ? `Press ${pitch.name}` : `Release ${pitch.name}`),
}));

export const actionTriggeredPortPrefix = "actionTriggered_" as const;

export const actionTriggeredPorts = mapValuesWithKey(
  pitches,
  actionTriggeredPortPrefix,
  (pitch): PortDefinition<boolean> => ({
    label: `${pitch.name} action triggered`,
    kind: "flow",
    type: mechanical,
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
