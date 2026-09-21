import { defineLevel } from "../../engine/levels.ts";
import { createPartInstance, inPort, PartInstance } from "../../engine/parts.tsx";
import { action } from "../../engine/simulation.ts";

const blower = createPartInstance("Blower", "blower", { x: 0, y: -400 });

const padding = 30;

const pitches = {
  c4: { name: "C4", frequency: 261.63 },
  cs4: { name: "C#4", frequency: 277.18, black: true },
  d4: { name: "D4", frequency: 293.66 },
  ds4: { name: "D#4", frequency: 311.13, black: true },
  e4: { name: "E4", frequency: 329.63 },
  f4: { name: "F4", frequency: 349.23 },
  fs4: { name: "F#4", frequency: 369.99, black: true },
  g4: { name: "G4", frequency: 392.0 },
  gs4: { name: "G#4", frequency: 415.3, black: true },
  a4: { name: "A4", frequency: 440.0 },
  as4: { name: "A#4", frequency: 466.16, black: true },
  b4: { name: "B4", frequency: 493.88 },
  c5: { name: "C5", frequency: 523.25 },
};

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
