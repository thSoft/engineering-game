import { Timeline, TimelineRow, TimelineState } from "@keplar-404/react-timeline-editor";
import { TimelineAction } from "@keplar-404/timeline-engine";
import { Button, theme } from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import Flex from "antd/es/flex";
import _ from "lodash";
import { Pause, Play, SkipBack } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import useAnimationFrame from "use-animation-frame";
import {
  evaluateTestCase,
  getCurrentTime,
  LevelDefinition,
  TestCaseResult,
} from "../engine/levels.ts";
import { getOrganSynth, resetOrganSynth } from "../engine/organAudio.ts";
import { isPartInstanceOf, outPort, PartId } from "../engine/parts.tsx";
import {
  BehaviorMode,
  getPortValueAt,
  getSimulationInput,
  LevelState,
  simulate,
} from "../engine/simulation.ts";
import { gedackt8, PipeSoundState, schedulePipeSound } from "../parts/pipe/PipeSound.ts";
import { Sound } from "../parts/pipe/pipe.tsx";
import { deleteAction, setCurrentTime } from "../store/gameStore.ts";
import { borderColor, iconSize } from "./designTokens.tsx";
import { getTimelineActions, TimelineActionData } from "./utils.tsx";

interface Props {
  levelState: LevelState;
  levelDefinition: LevelDefinition;
  playing: boolean;
  setPlaying: (value: ((prevState: boolean) => boolean) | boolean) => void;
}

export const TIMELINE_HEIGHT = 200;

const HEADER_WIDTH = 160;

export function TimelineView({ levelState, levelDefinition, playing, setPlaying }: Props) {
  const behaviorMode = levelState.behaviorMode;
  const timelineRef = useRef<TimelineState>(null);
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setTime(getCurrentTime(levelState));
    }
  }, [getCurrentTime(levelState)]);

  const laneHeaderRef = useRef<HTMLDivElement>(null);
  // Mirror the timeline's vertical scroll to the sidebar
  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    if (laneHeaderRef.current) {
      laneHeaderRef.current.scrollTop = scrollTop;
    }
  };

  function stepTime({ delta }: { delta: number }) {
    if (behaviorMode !== BehaviorMode.EXPERIMENT && playing) {
      setCurrentTime(getCurrentTime(levelState) + delta);
    }
  }

  useAnimationFrame(stepTime);

  const testCaseResult =
    behaviorMode === BehaviorMode.TEST_CASE
      ? evaluateTestCase(levelDefinition.testCase, levelState)
      : undefined;
  const timelineData = getTimelineData(levelDefinition, levelState, testCaseResult);

  const rowHeight = 32;
  const cursorHeight = 10;

  const { token } = theme.useToken();
  return (
    <Flex>
      {/* Controls */}
      <Flex
        style={{
          position: "absolute",
          zIndex: 1,
          width: HEADER_WIDTH,
          background: token.colorBgContainer,
        }}
      >
        <Button
          onClick={async () => {
            if (playing) {
              void resetOrganSynth();
            } else {
              await getOrganSynth(); // Ensure that advancing the timeline starts at the same time as playback
              void startPlayback(levelDefinition, levelState, getCurrentTime(levelState));
            }
            setPlaying(!playing);
          }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={iconSize} /> : <Play size={iconSize} />}
        </Button>
        <Button
          onClick={() => {
            void resetOrganSynth();
            setPlaying(() => false);
            setCurrentTime(0);
          }}
          title={"Go to start"}
        >
          <SkipBack size={iconSize} />
        </Button>
      </Flex>
      {/* Side Panel for Lane Labels */}
      <div
        ref={laneHeaderRef}
        style={{
          width: HEADER_WIDTH,
          height: TIMELINE_HEIGHT,
          overflow: "hidden",
        }}
      >
        <Flex
          vertical
          align="center"
          style={{ marginTop: `calc(${rowHeight}px + ${cursorHeight}px)` }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              width: "calc(100% - 16px)", // Account for padding
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <tbody>
              {timelineData.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    height: `${rowHeight}px`, // Must match Timeline's rowHeight prop
                    lineHeight: `${rowHeight}px`,
                    borderBottom: `1px solid ${borderColor}`,
                    paddingLeft: "10px",
                    fontSize: "12px",
                  }}
                >
                  {row.lanePath.map((segment) => (
                    <td>{segment}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Flex>
      </div>
      {/* Main Timeline */}
      <div style={{ flex: 1 }}>
        <Timeline
          disableDrag={true}
          gridSnap={true}
          style={{ width: "100%", height: 200 }}
          editorData={timelineData}
          getActionRender={TimelineActionView}
          effects={{}}
          onCursorDragEnd={(time) => {
            if (!playing) {
              setCurrentTime(time);
            }
          }}
          onClickTimeArea={(time) => {
            if (!playing) {
              setCurrentTime(time);
            }
          }}
          ref={timelineRef}
          onScroll={handleScroll}
          rowHeight={rowHeight}
        />
      </div>
    </Flex>
  );
}

export async function startPlayback(
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  startTime: number,
) {
  // Capture the scenario at the moment playback starts
  const input = getSimulationInput(levelState.behaviorMode, levelState, levelDefinition);
  const simulationResult = simulate(input, levelState);
  const pipeStates = levelState.parts.filter(isPartInstanceOf("Pipe")).map((pipe, pipeIndex) => ({
    part: pipe,
    channel: pipeIndex,
    soundPort: outPort(pipe, "sound"),
  }));

  const synth = await getOrganSynth();
  // A new run replaces any audible notes from an experiment or prior playback run
  synth.stopAll(true);
  const states = new Map<PartId, PipeSoundState>();
  function schedule(time: number, sound: Sound, channel: number, key: PartId) {
    const state = {
      playing: sound !== undefined,
      frequency: sound?.frequency ?? 0,
      stop: gedackt8,
      channel,
      velocity: 100,
    };
    const previous = states.get(key);
    if (!previous || !_.isEqual(previous, state)) {
      schedulePipeSound(synth, state, previous, { time });
      states.set(key, state);
    }
  }

  // Current state of the pipes at the start time
  for (const { part, channel, soundPort } of pipeStates) {
    const sound = getPortValueAt(soundPort, startTime, simulationResult);
    schedule(0, sound, channel, part.id);
  }

  // Upcoming notes
  for (const result of simulationResult.actionResults) {
    const actionTime = result.action?.time;
    if (actionTime === undefined || actionTime <= startTime) continue;
    const time = actionTime - startTime;
    for (const { part, channel, soundPort } of pipeStates) {
      const sound = getPortValueAt(soundPort, actionTime, simulationResult);
      schedule(time, sound, channel, part.id);
    }
  }
}

export type CustomTimelineRow = TimelineRow & {
  lanePath: string[];
};

function getTimelineData(
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  testCaseResult: TestCaseResult | undefined,
): CustomTimelineRow[] {
  const timelineActions: TimelineAction[] = getTimelineActions(
    levelState.behaviorMode,
    levelState,
    levelDefinition,
    testCaseResult,
  );
  const timelineActionsGroupedByLane = _.groupBy(timelineActions, (action) =>
    action.data instanceof TimelineActionData ? action.data.value.getLanePath(levelState) : null,
  );
  return Object.entries(timelineActionsGroupedByLane).map(([lanePath, actions]) => {
    return {
      id: lanePath.toString(),
      lanePath:
        actions.length > 0 && actions[0].data instanceof TimelineActionData
          ? actions[0].data.value.getLanePath(levelState)
          : [],
      actions,
    };
  });
}

function TimelineActionView(action: TimelineAction): ReactNode {
  if (!(action.data instanceof TimelineActionData)) return null;
  const { value, postfix, color } = action.data.value.getDisplayInfo();

  const items = [
    {
      key: "delete",
      label: (
        <div
          onClick={() => {
            deleteAction(action.data.portRef, action.start);
          }}
        >
          Delete
        </div>
      ),
    },
  ];

  const view = (
    <div style={{ height: "100%", alignContent: "center", color: color ?? "inherit" }}>
      {value}
      {postfix}
    </div>
  );
  return action.data.readOnly ? (
    view
  ) : (
    <Dropdown menu={{ items }} trigger={["click"]}>
      {view}
    </Dropdown>
  );
}
