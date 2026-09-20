import type { WorkletSynthesizer } from "spessasynth_lib";
import { useEffect, useRef } from "react";
import { getOrganSynth } from "../../engine/organAudio.ts";
import { deepEqual } from "../../engine/parts.tsx";

export type OrganStop = {
  bank: number;
  program: number;
};

export const gedackt8: OrganStop = {
  bank: 0,
  program: 51,
};

export type PipeSoundState = {
  playing: boolean;
  frequency: number;
  stop: OrganStop;
  channel: number;
  velocity: number;
};

type Props = Omit<PipeSoundState, "velocity"> & { velocity?: number };

type SynthMethodOptions = NonNullable<Parameters<WorkletSynthesizer["noteOn"]>[3]>;

/** Schedule a transition between two pipe states on the shared organ synthesizer. */
export function schedulePipeSound(
  synth: WorkletSynthesizer,
  current: PipeSoundState,
  previous: PipeSoundState | undefined,
  options?: SynthMethodOptions,
) {
  if (previous?.playing) {
    const { note } = frequencyToMidi(previous.frequency);
    synth.noteOff(previous.channel, note, options);
  }

  if (current.playing) {
    const { note, pitchBend } = frequencyToMidi(current.frequency);
    synth.programChange(current.channel, current.stop.program, options);
    synth.pitchWheel(current.channel, pitchBend, options);
    synth.noteOn(current.channel, note, current.velocity, options);
  }
}

/** Plays live experiment changes immediately. Timeline playback uses schedulePipeSound instead. */
export function PipeSound({ playing, frequency, stop, channel, velocity = 100 }: Props) {
  const currentState = { frequency, stop, playing, velocity, channel };
  const previous = useRef<PipeSoundState | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;

    getOrganSynth().then((synth) => {
      if (cancelled) return;
      const previousState = previous.current;
      if (!previousState || !deepEqual(previousState, currentState)) {
        schedulePipeSound(synth, currentState, previousState);
        previous.current = currentState;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [frequency, playing, stop, channel, velocity]);

  return null;
}

const A4 = 440;
const PITCH_BEND_RANGE = 2;

function frequencyToMidi(frequency: number) {
  const midi = 69 + 12 * Math.log2(frequency / A4);

  const note = Math.round(midi);
  const semitoneOffset = midi - note;

  const pitchBend = Math.round((1 + semitoneOffset / PITCH_BEND_RANGE) * 8192);

  return {
    note,
    pitchBend,
  };
}
