import _ from "lodash";
import { useEffect, useState } from "react";
import { LevelDefinition } from "../engine/levels";
import { getOrganSynth } from "../engine/organAudio";
import { PartId, PartInstance, refPort } from "../engine/parts";
import { getPortValueAt, getSimulationInput, LevelState, simulate } from "../engine/simulation";
import { Pipe } from "../parts/pipe/pipe";
import { gedackt8, PipeSoundState, schedulePipeSound } from "../parts/pipe/PipeSound";

interface Props {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
  parts: PartInstance[];
  startTime: number;
}

export function TimelinePipeSounds({ levelDefinition, levelState, parts, startTime }: Props) {
  // Capture the scenario at the moment playback starts
  const [playback] = useState(() => {
    const input = getSimulationInput(levelState.behaviorMode, levelState, levelDefinition);
    return {
      simulationResult: simulate(input, levelState),
      pipeStates: parts.flatMap((part, channel) =>
        part.definitionId === Pipe.id // TODO change DSL design so that part is narrowed
          ? [{ part, channel, soundPort: refPort<typeof Pipe>(part.id, "sound") }]
          : [],
      ),
    };
  });

  // Schedule events
  useEffect(() => {
    let cancelled = false;

    getOrganSynth().then((synth) => {
      if (cancelled) return;

      // A new run replaces any audible notes from an experiment or prior playback run
      synth.stopAll(true);
      const states = new Map<PartId, PipeSoundState>();
      function schedule(time: number, state: PipeSoundState, key: PartId) {
        const previous = states.get(key);
        if (!previous || !_.isEqual(previous, state)) {
          schedulePipeSound(synth, state, previous, { time });
          states.set(key, state);
        }
      }

      // Current state of the pipes at the start time
      const { simulationResult, pipeStates } = playback;
      for (const { part, channel, soundPort } of pipeStates) {
        const frequency = getPortValueAt(soundPort, startTime, simulationResult) ?? 0;
        schedule(0, toPipeSoundState(frequency, channel), part.id);
      }

      // Upcoming notes
      for (const result of simulationResult.actionResults) {
        const actionTime = result.action?.time;
        if (actionTime === undefined || actionTime <= startTime) continue;
        const time = actionTime - startTime;
        for (const { part, channel, soundPort } of pipeStates) {
          const frequency = getPortValueAt(soundPort, actionTime, simulationResult) ?? 0;
          schedule(time, toPipeSoundState(frequency, channel), part.id);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [playback, startTime]);

  return null;
}

function toPipeSoundState(frequency: number, channel: number): PipeSoundState {
  return { playing: frequency > 0, frequency, stop: gedackt8, channel, velocity: 100 };
}
