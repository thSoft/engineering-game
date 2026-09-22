import { Timeline, TimelineState } from "@keplar-404/react-timeline-editor";
import { TimelineAction } from "@keplar-404/timeline-engine";
import { Button, theme } from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import Flex from "antd/es/flex";
import _ from "lodash";
import { Pause, Play, SkipBack } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import useAnimationFrame from "use-animation-frame";
import {
  evaluateTestCase,
  getCurrentTime,
  LevelDefinition,
  TestCaseResult,
} from "../engine/levels.ts";
import { getOrganSynth, resetOrganSynth } from "../engine/organAudio.ts";
import { PartInstance } from "../engine/parts.tsx";
import { BehaviorMode, LevelState } from "../engine/simulation.ts";
import { deleteAction, setCurrentTime } from "../store/gameStore.ts";
import { borderColor, iconSize } from "./designTokens.tsx";
import { TimelinePipeSounds } from "./TimelinePipeSounds.tsx";
import { getPortRefLabel, getTimelineActions, TimelineActionData } from "./utils.tsx";

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

  const [playbackStartTime, setPlaybackStartTime] = useState<number>();

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
              await getOrganSynth(); // Ensure that advancing the timeline begins when playback
              setPlaybackStartTime(getCurrentTime(levelState));
            }
            setPlaying(!playing);
          }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={iconSize} /> : <Play size={iconSize} />}
        </Button>
        <Button
          onClick={() => {
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
            setCurrentTime(time);
          }}
          onClickTimeArea={(time) => {
            setCurrentTime(time);
          }}
          ref={timelineRef}
          onScroll={handleScroll}
          rowHeight={rowHeight}
        />
      </div>
      {playing && playbackStartTime !== undefined && (
        <TimelinePipeSounds
          levelDefinition={levelDefinition}
          levelState={levelState}
          parts={parts}
          startTime={playbackStartTime}
        />
      )}
    </Flex>
  );
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
