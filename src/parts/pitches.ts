export const pitches = {
  c4: { name: "C4", frequency: 262 } satisfies Pitch,
  cs4: { name: "C#4", frequency: 277 } satisfies Pitch,
  d4: { name: "D4", frequency: 293 } satisfies Pitch,
  ds4: { name: "D#4", frequency: 311 } satisfies Pitch,
  e4: { name: "E4", frequency: 330 } satisfies Pitch,
  f4: { name: "F4", frequency: 349 } satisfies Pitch,
  fs4: { name: "F#4", frequency: 370 } satisfies Pitch,
  g4: { name: "G4", frequency: 392 } satisfies Pitch,
  gs4: { name: "G#4", frequency: 415 } satisfies Pitch,
  a4: { name: "A4", frequency: 440 } satisfies Pitch,
  as4: { name: "A#4", frequency: 466 } satisfies Pitch,
  b4: { name: "B4", frequency: 494 } satisfies Pitch,
  c5: { name: "C5", frequency: 524 } satisfies Pitch,
} as const;

export type Pitch = {
  name: string;
  frequency: number;
};

export type PitchId = keyof typeof pitches;
