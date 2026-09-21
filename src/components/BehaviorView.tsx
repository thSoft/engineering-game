import { Segmented } from "antd";
import Flex from "antd/es/flex";
import { FilePlay, FlaskConical, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { LevelDefinition } from "../engine/levels";
import { resetOrganSynth } from "../engine/organAudio";
import { PartInstance } from "../engine/parts";
import { BehaviorMode, LevelState } from "../engine/simulation";
import { setBehaviorMode } from "../store/gameStore";
import { borderColor, iconSize } from "./designTokens";
import { TimelineView } from "./TimelineView.tsx";

export interface Props {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
  parts: PartInstance[];
}

export function BehaviorView({ levelDefinition, levelState, parts }: Props) {
  const behaviorMode = levelState.behaviorMode;
  const [playing, setPlaying] = useState(false);

  return (
    <Flex vertical style={{ borderTop: `1px solid ${borderColor}` }}>
      {behaviorMode !== BehaviorMode.EXPERIMENT && (
        <TimelineView
          levelState={levelState}
          levelDefinition={levelDefinition}
          parts={parts}
          playing={playing}
          setPlaying={setPlaying}
        />
      )}
      <Flex align="center" gap={8} style={{ padding: 4 }}>
        <Segmented
          value={behaviorMode}
          onChange={(value) => {
            void resetOrganSynth();
            setPlaying(false);
            setBehaviorMode(value);
          }}
          options={[
            {
              label: (
                <Flex gap={4} align="center">
                  <FlaskConical size={iconSize} />
                  Experiment
                </Flex>
              ),
              value: BehaviorMode.EXPERIMENT,
            },
            {
              label: (
                <Flex gap={4} align="center">
                  <ShieldCheck size={iconSize} />
                  Test Case
                </Flex>
              ),
              value: BehaviorMode.TEST_CASE,
            },
            {
              label: (
                <Flex gap={4} align="center">
                  <FilePlay size={iconSize} />
                  Custom Scenario
                </Flex>
              ),
              value: BehaviorMode.CUSTOM_SCENARIO,
            },
          ]}
        />
      </Flex>
    </Flex>
  );
}
