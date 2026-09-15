import { WorkletSynthesizer } from "spessasynth_lib";

let synthPromise: Promise<WorkletSynthesizer> | undefined;

export function getOrganSynth(): Promise<WorkletSynthesizer> {
  if (!synthPromise) {
    synthPromise = createSynth();
  }

  return synthPromise;
}

async function createSynth() {
  const context = new AudioContext();

  await context.audioWorklet.addModule("audio/spessasynth_processor.min.js");

  const synth = new WorkletSynthesizer(context);

  const response = await fetch("audio/Jeux14_stripped.sf3");
  const soundfont = await response.arrayBuffer();
  await synth.soundBankManager.addSoundBank(soundfont, "jeux14");

  synth.connect(context.destination);

  await synth.isReady;

  return synth;
}
