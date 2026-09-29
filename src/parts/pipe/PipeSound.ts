import _ from "lodash";
import { useEffect, useRef } from "react";
import { MIDIControllers } from "spessasynth_core";
import type { WorkletSynthesizer } from "spessasynth_lib";
import { getOrganSynth } from "../../engine/organAudio.ts";

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
    synth.noteOff(toMelodicChannel(previous.channel), note, options);
  }

  if (current.playing) {
    const actualChannel = toMelodicChannel(current.channel);
    const bankHigh7Bits = current.stop.bank >> 7;
    synth.controllerChange(actualChannel, MIDIControllers.bankSelect, bankHigh7Bits, options);
    const bankLow7Bits = current.stop.bank & 0x7f;
    synth.controllerChange(actualChannel, MIDIControllers.bankSelectLSB, bankLow7Bits, options);
    synth.programChange(actualChannel, current.stop.program, options);
    const { note, pitchBend } = frequencyToMidi(current.frequency);
    synth.pitchWheel(actualChannel, pitchBend, options);
    synth.noteOn(actualChannel, note, current.velocity, options);
  }
}

/** Transforms channel numbers to avoid percussion channels. */
function toMelodicChannel(channel: number) {
  const block = Math.floor(channel / 15);
  const offset = channel % 15;
  return block * 16 + (offset >= 9 ? offset + 1 : offset);
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
      if (!previousState || !_.isEqual(previousState, currentState)) {
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
