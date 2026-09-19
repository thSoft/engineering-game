import z from "zod";
import { definePart, PortDefinition } from "../../engine/parts.tsx";
import { WindchestView } from "./WindchestView.tsx";

function createValve(name: string): PortDefinition<boolean> {
  return {
    label: name,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  };
}

function createAirOut(name: string): PortDefinition<boolean> {
  return {
    label: name,
    kind: "flow",
    schema: z.boolean(),
    defaultValue: false,
  };
}

export const Windchest = definePart("windchest", {
  label: "Windchest",
  parameters: {},
  inputPorts: {
    airIn: {
      label: "air in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
    c4Valve: createValve("C4"),
    cs4Valve: createValve("C#4"),
    d4Valve: createValve("D4"),
    ds4Valve: createValve("D#4"),
    e4Valve: createValve("E4"),
    f4Valve: createValve("F4"),
    fs4Valve: createValve("F#4"),
    g4Valve: createValve("G4"),
    gs4Valve: createValve("G#4"),
    a4Valve: createValve("A4"),
    as4Valve: createValve("A#4"),
    b4Valve: createValve("B4"),
    c5Valve: createValve("C5"),
  },
  outputPorts: {
    c4AirOut: createAirOut("C4 Air Out"),
    cs4AirOut: createAirOut("C#4 Air Out"),
    d4AirOut: createAirOut("D4 Air Out"),
    ds4AirOut: createAirOut("D#4 Air Out"),
    e4AirOut: createAirOut("E4 Air Out"),
    f4AirOut: createAirOut("F4 Air Out"),
    fs4AirOut: createAirOut("F#4 Air Out"),
    g4AirOut: createAirOut("G4 Air Out"),
    gs4AirOut: createAirOut("G#4 Air Out"),
    a4AirOut: createAirOut("A4 Air Out"),
    as4AirOut: createAirOut("A#4 Air Out"),
    b4AirOut: createAirOut("B4 Air Out"),
    c5AirOut: createAirOut("C5 Air Out"),
  },
  color: "#99ddff",
  description: "Controls the flow of air to the notes",
  render: ({ airIn, ...valves }, _, airOuts) => {
    return <WindchestView airIn={airIn} valves={valves} airOuts={airOuts} />;
  },
  compute: (inputs) => ({
    c4AirOut: inputs.airIn && inputs.c4Valve,
    cs4AirOut: inputs.airIn && inputs.cs4Valve,
    d4AirOut: inputs.airIn && inputs.d4Valve,
    ds4AirOut: inputs.airIn && inputs.ds4Valve,
    e4AirOut: inputs.airIn && inputs.e4Valve,
    f4AirOut: inputs.airIn && inputs.f4Valve,
    fs4AirOut: inputs.airIn && inputs.fs4Valve,
    g4AirOut: inputs.airIn && inputs.g4Valve,
    gs4AirOut: inputs.airIn && inputs.gs4Valve,
    a4AirOut: inputs.airIn && inputs.a4Valve,
    as4AirOut: inputs.airIn && inputs.as4Valve,
    b4AirOut: inputs.airIn && inputs.b4Valve,
    c5AirOut: inputs.airIn && inputs.c5Valve,
  }),
});
