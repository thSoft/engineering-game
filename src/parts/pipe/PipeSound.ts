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

type Props = {
  playing: boolean;
  frequency: number;
  stop: OrganStop;
  channel: number;
  velocity?: number;
};

export function PipeSound({ playing, frequency, stop, channel, velocity = 100 }: Props) {
  const currentState = { frequency, stop, playing, velocity, channel };
  const previous = useRef<Props | null>(null);
  useEffect(() => {
    let cancelled = false;

    getOrganSynth().then((synth) => {
      if (cancelled) return;

      const { note, pitchBend } = frequencyToMidi(frequency);

      function handleNote() {
        if (playing) {
          synth.programChange(channel, stop.program);
          synth.pitchWheel(channel, pitchBend);
          synth.noteOn(channel, note, velocity);
        }
        previous.current = currentState;
      }

      const previousState = previous.current;

      // First render.
      if (!previousState) {
        handleNote();
        return;
      }

      // Prop changed.

      if (!deepEqual(previousState, currentState)) {
        const { note: previousNote } = frequencyToMidi(previousState.frequency);
        if (previousState.playing) {
          synth.noteOff(channel, previousNote);
        }

        handleNote();
        return;
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
