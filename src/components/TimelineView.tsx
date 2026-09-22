import { Timeline, TimelineState } from "@keplar-404/react-timeline-editor";
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
import { isPartOf, outPort, PartId, PartInstance } from "../engine/parts.tsx";
import {
  BehaviorMode,
  getPortValueAt,
  getSimulationInput,
  LevelState,
  simulate,
} from "../engine/simulation.ts";
import { deleteAction, setCurrentTime } from "../store/gameStore.ts";
import { borderColor, iconSize } from "./designTokens.tsx";
import { getPortRefLabel, getTimelineActions, TimelineActionData } from "./utils.tsx";
import { gedackt8, PipeSoundState, schedulePipeSound } from "../parts/pipe/PipeSound.ts";

interface Props {
  levelState: LevelState;
  levelDefinition: LevelDefinition;
  parts: PartInstance[];
  playing: boolean;
  setPlaying: (value: ((prevState: boolean) => boolean) | boolean) => void;
}

export const TIMELINE_HEIGHT = 200;

const HEADER_WIDTH = 160;

export function TimelineView({ levelState, levelDefinition, parts, playing, setPlaying }: Props) {
  const behaviorMode = levelState.behaviorMode;
  const timelineRef = useRef<TimelineState>(null);
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setTime(getCurrentTime(levelState));
    }
  }, [getCurrentTime(levelState)]);

  const trackHeaderRef = useRef<HTMLDivElement>(null);
  // Mirror the timeline's vertical scroll to the sidebar
  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    if (trackHeaderRef.current) {
      trackHeaderRef.current.scrollTop = scrollTop;
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
  const timelineData = getTimelineData(levelDefinition, levelState, parts, testCaseResult);

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
              void startPlayback(levelDefinition, levelState, parts, getCurrentTime(levelState));
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
        ref={trackHeaderRef}
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
                  <td>{row.partLabel}</td>
                  <td>{row.portLabel}</td>
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
  parts: PartInstance[],
  startTime: number,
) {
  // Capture the scenario at the moment playback starts
  const input = getSimulationInput(levelState.behaviorMode, levelState, levelDefinition);
  const simulationResult = simulate(input, levelState);
  const pipeStates = parts.filter(isPartOf("Pipe")).map((pipe, pipeIndex) => ({
    part: pipe,
    channel: pipeIndex,
    soundPort: outPort(pipe, "sound"),
  }));

  const synth = await getOrganSynth();
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
}

function toPipeSoundState(frequency: number, channel: number): PipeSoundState {
  return { playing: frequency > 0, frequency, stop: gedackt8, channel, velocity: 100 };
}

function getTimelineData(
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  parts: PartInstance[],
  testCaseResult: TestCaseResult | undefined,
) {
  const timelineActions: TimelineAction[] = getTimelineActions(
    levelState.behaviorMode,
    levelState,
    levelDefinition,
    testCaseResult,
  );
  const timelineActionsGroupedByPortRef = _.groupBy(timelineActions, (action) =>
    action.data ? JSON.stringify(action.data.portRef) : "",
  );
  return Object.entries(timelineActionsGroupedByPortRef).map(([portRef, actions]) => {
    const { partLabel, portLabel } =
      actions.length > 0
        ? getPortRefLabel(actions[0].data.portRef, parts)
        : { partLabel: "", portLabel: "" };
    return {
      id: portRef,
      partLabel,
      portLabel,
      actions: actions,
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
