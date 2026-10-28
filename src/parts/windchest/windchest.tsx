import { definePart, PortDefinition } from "../../engine/parts.ts";
import { mapValues, mapValuesWithKey } from "../../engine/utils.ts";
import { pitches } from "../pitches.ts";
import { WindchestView } from "./WindchestView.tsx";
import { mechanical } from "../../ports/mechanical.ts";
import { air } from "../../ports/air.ts";

export const airInPort: PortDefinition<boolean> = {
  label: "air in",
  kind: "flow",
  type: air,
  defaultValue: false,
};

export const valvePorts = mapValues(pitches, (pitch): PortDefinition<boolean> => ({
  label: pitch.name,
  kind: "flow",
  type: mechanical,
  defaultValue: false,
}));

export const airOutPortPrefix = "air_" as const;

export const airOutPorts = mapValuesWithKey(
  pitches,
  airOutPortPrefix,
  (pitch): PortDefinition<boolean> => ({
    label: pitch.name,
    kind: "flow",
    type: air,
    defaultValue: false,
  }),
);

export const Windchest = definePart({
  label: "Windchest",
  parameters: {},
  inputPorts: {
    airIn: airInPort,
    ...valvePorts,
  },
  outputPorts: airOutPorts,
  color: "#99ddff",
  description: "Controls the flow of air to the pipes",
  render: ({ airIn, ...valves }, _, airOuts) => {
    return <WindchestView airIn={airIn} valves={valves} airOuts={airOuts} />;
  },
  compute: (inputs) =>
    mapValuesWithKey(pitches, airOutPortPrefix, (__, id) => inputs.airIn && inputs[id]),
});
