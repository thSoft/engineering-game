import { WorkletSynthesizer } from "spessasynth_lib";

let synthPromise: Promise<WorkletSynthesizer> | undefined;

export function getOrganSynth(): Promise<WorkletSynthesizer> {
  if (!synthPromise) {
    synthPromise = createSynth();
  }

  return synthPromise;
}

/**
 * Discard the current audio context and its queued MIDI events.
 *
 * SpessaSynth has no API for removing individual future events, so stopping a
 * timeline run requires replacing its context rather than only sending note-off.
 */
export async function resetOrganSynth() {
  const activeSynth = synthPromise;
  synthPromise = undefined;
  if (!activeSynth) return;

  const synth = await activeSynth;
  synth.stopAll(true);
  await (synth.context as AudioContext).close();
}

async function createSynth() {
  const context = new AudioContext();

  await context.audioWorklet.addModule("audio/spessasynth_processor.min.js");

  const synth = new WorkletSynthesizer(context);

  for (let i = 0; i < 64 - 16; i++) {
    synth.addNewChannel();
  }

  const response = await fetch("audio/Jeux14_stripped.sf3");
  const soundfont = await response.arrayBuffer();
  await synth.soundBankManager.addSoundBank(soundfont, "jeux14");

  synth.connect(context.destination);

  await synth.isReady;

  return synth;
}
