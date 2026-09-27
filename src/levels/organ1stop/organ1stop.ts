import { defineLevel } from "../../engine/levels.ts";
import { createPartInstance, inPort, PartInstance } from "../../engine/parts.tsx";
import { action } from "../../engine/simulation.ts";
import { pitches } from "../../parts/pitches.ts";

const blower = createPartInstance("Blower", "blower", { x: 0, y: -400 });

const padding = 30;

const organKeys: PartInstance<"OrganKey">[] = Object.entries(pitches).map(
  ([pitchId, pitch], index) =>
    createPartInstance("OrganKey", `key${pitchId}`, { x: 0, y: padding * -index }, pitch.name),
);

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

function getMelodyNoteActions(
  time: number,
  pitchId: keyof typeof pitches,
  duration: number,
  bpm: number,
) {
  const index = Object.keys(pitches).indexOf(pitchId);
  const pressed = inPort(organKeys[index], "pressed");
  return [
    action(time, pressed, true),
    action(time + toAbsoluteTime(bpm, duration), pressed, false),
  ];
}

function toAbsoluteTime(bpm: number, duration: number) {
  return (60 / bpm) * duration;
}

function getMelodyActions(melody: MelodyNote[], startBeat: number, bpm: number) {
  return melody.reduce(
    ({ actions, time }, { note, duration }) => {
      return {
        actions: [...actions, ...(note ? getMelodyNoteActions(time, note, duration, bpm) : [])],
        time: time + toAbsoluteTime(bpm, duration),
      };
    },
    {
      actions: [] as ReturnType<typeof getMelodyNoteActions>,
      time: toAbsoluteTime(bpm, startBeat),
    },
  ).actions;
}

export const Organ1Stop = defineLevel("organ1Stop", {
  label: "Organ with One Stop",
  availableParts: ["Pipe", "Blower", "Windchest", "OrganKey"],
  fixedParts: [blower, ...organKeys],
  exposedPorts: [],
  testCase: {
    input: {
      startTime: 0,
      actions: [
        action(0, inPort(blower, "toggle"), true),
        ...getMelodyActions(bachToccataIntro, 0.5, 32),
      ],
    },
    assertions: [],
  },
  userName: "Jean",
  userNeedQuote: "",
  successQuote: "",
});
