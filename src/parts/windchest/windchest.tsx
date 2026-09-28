import z from "zod";
import { definePart, PortDefinition } from "../../engine/parts.tsx";
import { mapValues, mapValuesWithKey } from "../../engine/utils.ts";
import { pitches } from "../pitches.ts";
import { WindchestView } from "./WindchestView.tsx";

function createValve(name: string): PortDefinition<boolean> {
  return {
    label: name,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  };
}

const valves = mapValues(pitches, (pitch) => createValve(pitch.name));

function createAirOut(name: string): PortDefinition<boolean> {
  return {
    label: name,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  };
}

const airOutPortPrefix = "air" as const;

const airOuts = mapValuesWithKey(pitches, airOutPortPrefix, (pitch) => createAirOut(pitch.name));

export const Windchest = definePart({
  label: "Windchest",
  parameters: {},
  inputPorts: {
    airIn: {
      label: "air in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
    ...valves,
  },
  outputPorts: airOuts,
  color: "#99ddff",
  description: "Controls the flow of air to the pipes",
  render: ({ airIn, ...valves }, _, airOuts) => {
    return <WindchestView airIn={airIn} valves={valves} airOuts={airOuts} />;
  },
  compute: (inputs) =>
    mapValuesWithKey(pitches, airOutPortPrefix, (__, id) => inputs.airIn && inputs[id]),
});
