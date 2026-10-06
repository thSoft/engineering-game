import { defineLevel } from "../../engine/levels.ts";
import { createPartInstance, inPort } from "../../engine/parts.tsx";
import { action } from "../../engine/simulation.ts";
import { soundAssertion } from "../../parts/pipe/pipe.tsx";
import { pitches } from "../../parts/pitches.ts";

const windSupply = createPartInstance("WindSupply", "windSupply", {
  x: 1200,
  y: -80,
});

const organKeyboard = createPartInstance("OrganKeyboard", "organKeyboard", {
  x: 0,
  y: 0,
});

type MelodyNote = {
  note?: keyof typeof pitches;
  duration: number;
};

const bachToccataIntro: MelodyNote[] = [
  { note: "a4", duration: 1 / 16 },
  { note: "g4", duration: 1 / 16 },
  { note: "a4", duration: 1 / 2 },
  { duration: 1 / 4 },
  { note: "g4", duration: 1 / 16 },
  { note: "f4", duration: 1 / 16 },
  { note: "e4", duration: 1 / 16 },
  { note: "d4", duration: 1 / 16 },
  { note: "cs4", duration: 1 / 4 },
  { note: "d4", duration: 1 / 2 },
];

function getMelodyNoteActionsAndAssertions(
  time: number,
  pitchId: keyof typeof pitches,
  duration: number,
  bpm: number,
  hasNextNote: boolean,
) {
  const pressed = inPort(organKeyboard, pitchId);
  const endTime = time + toAbsoluteTime(bpm, duration);
  return {
    actions: [action(time, pressed, true), action(endTime, pressed, false)],
    assertions: [
      soundAssertion(time, { frequency: pitches[pitchId].frequency }),
      ...(hasNextNote ? [] : [soundAssertion(endTime, undefined)]),
    ],
  };
}

function toAbsoluteTime(bpm: number, duration: number) {
  return (60 / bpm) * duration;
}

function getMelodyActionsAndAssertions(melody: MelodyNote[], startBeat: number, bpm: number) {
  return melody.reduce(
    ({ actions, assertions, time }, { note, duration }, index) => {
      const endTime = time + toAbsoluteTime(bpm, duration);
      if (!note) {
        return {
          actions,
          assertions,
          time: endTime,
        };
      }
      const { actions: noteActions, assertions: noteAssertions } =
        getMelodyNoteActionsAndAssertions(
          time,
          note,
          duration,
          bpm,
          melody[index + 1]?.note !== undefined,
        );
      return {
        actions: [...actions, ...noteActions],
        assertions: [...assertions, ...noteAssertions],
        time: endTime,
      };
    },
    {
      actions: [] as ReturnType<typeof getMelodyNoteActionsAndAssertions>["actions"],
      assertions: [] as ReturnType<typeof getMelodyNoteActionsAndAssertions>["assertions"],
      time: toAbsoluteTime(bpm, startBeat),
    },
  );
}

const { actions, assertions } = getMelodyActionsAndAssertions(bachToccataIntro, 0.5, 32);

export const Organ1Stop = defineLevel("organ1Stop", {
  label: "Organ with One Stop",
  availableParts: ["Pipe", "Windchest"],
  fixedParts: [windSupply, organKeyboard],
  exposedPorts: [],
  testCase: {
    input: {
      startTime: 0,
      actions: [action(0, inPort(windSupply, "toggle"), true), ...actions],
    },
    assertions,
  },
  userName: "Jean",
  userNeedQuote: "",
  successQuote: "",
});
