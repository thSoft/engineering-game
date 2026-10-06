import z from "zod";
import { definePart, PortDefinition } from "../../engine/parts.tsx";
import { mapValues, mapValuesWithKey } from "../../engine/utils.ts";
import { pitches } from "../pitches.ts";
import { OrganKeyboardView } from "./OrganKeyboardView.tsx";

function createPressed(name: string): PortDefinition<boolean> {
  return {
    label: `${name} pressed`,
    kind: "state",
    schema: z.boolean(),
    defaultValue: false,
    renderAction: (value, partLabel) => (value ? `Press ${partLabel}` : `Release ${partLabel}`),
  };
}

export const pressedPorts = mapValues(pitches, (pitch) => createPressed(pitch.name));

function createActionTriggered(name: string): PortDefinition<boolean> {
  return {
    label: `${name} action triggered`,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  };
}

export const actionTriggeredPortPrefix = "actionTriggered" as const;

export const actionTriggeredPorts = mapValuesWithKey(pitches, actionTriggeredPortPrefix, (pitch) =>
  createActionTriggered(pitch.name),
);

export const OrganKeyboard = definePart({
  label: "Organ Keyboard",
  parameters: {},
  inputPorts: pressedPorts,
  outputPorts: actionTriggeredPorts,
  color: "#ffffff",
  description: "",
  render: (pressedPortDescriptors, _, actionTriggeredPortDescriptors) => {
    return (
      <OrganKeyboardView
        pressed={pressedPortDescriptors}
        actionTriggered={actionTriggeredPortDescriptors}
      />
    );
  },
  compute: (inputs) => mapValuesWithKey(pitches, actionTriggeredPortPrefix, (__, id) => inputs[id]),
});
