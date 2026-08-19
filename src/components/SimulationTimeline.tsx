import { Timeline, TimelineAction, TimelineState } from "@keplar-404/react-timeline-editor";
import { Select } from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import Flex from "antd/es/flex";
import _ from "lodash";
import { ReactNode, useEffect, useRef } from "react";
import { evaluateTestCase, LevelDefinition, TestCaseResult } from "../engine/levels";
import { PartInstance } from "../engine/parts";
import { LevelState, TimelineMode } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { borderColor } from "./designTokens";
import { getPortRefLabel, getTimelineActions, TimelineActionData } from "./utils";

interface SimulationTimelineProps {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
  setCurrentTime: (currentTime: number) => void;
  parts: PartInstance[];
}

export function SimulationTimeline({
  levelDefinition,
  levelState,
  setCurrentTime,
  parts,
}: SimulationTimelineProps) {
  const timelineMode = levelState.timelineMode;
  const setTimelineMode = useGameStore((s) => s.setTimelineMode);

  const timelineRef = useRef<TimelineState>(null);
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setTime(levelState.currentTime);
    }
  }, [levelState.currentTime]);

  const trackHeaderRef = useRef<HTMLDivElement>(null);
  // Mirror the timeline's vertical scroll to the sidebar
  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    if (trackHeaderRef.current) {
      trackHeaderRef.current.scrollTop = scrollTop;
    }
  };

  const testCaseResult =
    timelineMode === TimelineMode.TEST
      ? evaluateTestCase(levelDefinition.testCase, levelState)
      : undefined;
  const timelineData = getTimelineData(
    levelState.timelineMode,
    levelDefinition,
    levelState,
    parts,
    testCaseResult,
  );

  const rowHeight = 32;
  const cursorHeight = 10;

  return (
    <Flex vertical style={{ borderTop: `1px solid ${borderColor}` }}>
      <Flex align="center" gap={8} style={{ padding: 4 }}>
        <span className="text-sm">Simulation:</span>
        <Select
          style={{ width: "8em" }}
          value={timelineMode}
          onChange={(value) => setTimelineMode(value)}
          options={[
            { label: "Test", value: TimelineMode.TEST },
            { label: "Sandbox", value: TimelineMode.SANDBOX },
          ]}
        />
      </Flex>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "200px",
        }}
      >
        {/* Side Panel for Lane Labels */}
        <div
          ref={trackHeaderRef}
          style={{
            width: "160px",
            overflowY: "hidden", // Hide scrollbar — handled by sync
            position: "relative",
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
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Timeline
            disableDrag={true}
            gridSnap={true}
            style={{ width: "100%" }}
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
      </div>
    </Flex>
  );
}

function getTimelineData(
  timelineMode: TimelineMode,
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  parts: PartInstance[],
  testCaseResult: TestCaseResult | undefined,
) {
  const timelineActions: TimelineAction[] = getTimelineActions(
    timelineMode,
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
            useGameStore.getState().deleteAction(action.data.portRef, action.start);
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
