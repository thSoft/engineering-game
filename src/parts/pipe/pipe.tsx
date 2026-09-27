import _ from "lodash";
import z from "zod";
import { Assertion } from "../../engine/levels.ts";
import { definePart, isPartInstanceOf, outPort } from "../../engine/parts.tsx";
import { getPortValueAt } from "../../engine/simulation.ts";
import { PipeView } from "./PipeView.tsx";

export const soundSchema = z.optional(
  z.object({
    frequency: z.number(), // Frequency of the sound emitted by the pipe, in Hertz
  }),
);

export type Sound = z.infer<typeof soundSchema>;

export const Pipe = definePart({
  label: "Pipe",
  parameters: {
    length: {
      // Length of the pipe, in cm
      label: "Length",
      schema: z.number(),
      defaultValue: 78,
    },
  },
  inputPorts: {
    air: {
      // Whether air is going into the pipe
      label: "air",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Start blowing ${partLabel}` : `Stop blowing ${partLabel}`,
    },
  },
  outputPorts: {
    sound: {
      label: "sound",
      kind: "flow",
      schema: soundSchema,
      defaultValue: undefined,
    },
  },
  color: "#00d492",
  description: "Emits sound if air is flowing",
  render: ({ air }, { length }, { sound }, { index, isExperiment }) => {
    return (
      <PipeView
        air={air}
        sound={sound}
        length={length}
        partIndex={index}
        isExperiment={isExperiment}
      />
    );
  },
  compute: ({ air }, { length }) => ({
    sound: air ? { frequency: 343.2 / (2 * (length / 100)) } : undefined,
  }),
});

export function soundAssertion(time: number, expectedSound: Sound): Assertion<undefined> {
  return {
    time,
    calculate(levelState, simulationResult) {
      const soundPorts = levelState.parts
        .filter(isPartInstanceOf("Pipe"))
        .map((pipe) => outPort(pipe, "sound"));
      const success =
        expectedSound !== undefined
          ? soundPorts.some((portRef) => {
              const actualSound = getPortValueAt(portRef, time, simulationResult);
              return (
                actualSound !== undefined &&
                Math.abs(actualSound.frequency - expectedSound.frequency) <= 2
              );
            })
          : soundPorts.every((portRef) =>
              _.isEqual(getPortValueAt(portRef, time, simulationResult), undefined),
            );
      return {
        success,
        debugInfo: undefined,
      };
    },
    getLanePath() {
      return ["Sound"];
    },
    getStepLabel() {
      return `User should hear ${expectedSound !== undefined ? `${expectedSound.frequency} Hz` : "nothing"}`;
    },
    timelineActionLabel: expectedSound !== undefined ? `${expectedSound.frequency}` : "OFF",
  };
}
