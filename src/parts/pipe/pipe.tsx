import _ from "lodash";
import z from "zod";
import { Assertion } from "../../engine/levels.ts";
import { definePart, isPartInstanceOf, outPort } from "../../engine/parts.ts";
import { getPortValueAt } from "../../engine/simulation.ts";
import { PipeView } from "./PipeView.tsx";
import { sound, Sound } from "../../ports/sound.ts";
import { air } from "../../ports/air.ts";

const speedOfSound = 343.2;

export function lengthToFrequency(length: any) {
  return speedOfSound / (2 * (length / 100));
}

export function frequencyToLength(frequency: any) {
  return (speedOfSound / (2 * frequency)) * 100;
}

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
      type: air,
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Start blowing ${partLabel}` : `Stop blowing ${partLabel}`,
    },
  },
  outputPorts: {
    sound: {
      label: "sound",
      kind: "flow",
      type: sound,
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
    sound: air ? { frequency: lengthToFrequency(length) } : undefined,
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
