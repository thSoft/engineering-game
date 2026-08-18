import { Timeline, TimelineAction, TimelineState } from "@keplar-404/react-timeline-editor";
import Dropdown from "antd/es/dropdown/dropdown";
import _ from "lodash";
import { ReactNode, useEffect, useRef } from "react";
import {
  AssertionResult,
  evaluateTestCase,
  LevelDefinition,
  TestCaseResult,
} from "../engine/levels";
import { deepEqual, PartInstance, PortRef } from "../engine/parts";
import { LevelState, TimelineMode } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { displayPortValue, getPortRefLabel } from "./utils";

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
  const timelineData = getTimelineData(levelDefinition, levelState, parts, testCaseResult);

  const rowHeight = 32;
  const cursorHeight = 10;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "200px",
        border: "1px solid #333",
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
        <div style={{ marginTop: `calc(${rowHeight}px + ${cursorHeight}px)` }}>
          {timelineData.map((row) => (
            <div
              key={row.id}
              style={{
                height: `${rowHeight}px`, // Must match Timeline's rowHeight prop
                lineHeight: `${rowHeight}px`,
                borderBottom: "1px solid #ccc",
                paddingLeft: "10px",
                fontSize: "12px",
              }}
            >
              {row.label}
            </div>
          ))}
        </div>
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
  );
}

class TimelineActionData {
  constructor(
    readonly portRef: PortRef,
    readonly value: TimelineValue,
    readonly readOnly: boolean,
  ) {}
}

abstract class TimelineValue {
  abstract render(): ReactNode;
}

class ActionValue extends TimelineValue {
  constructor(readonly value: any) {
    super();
  }
  render() {
    return <span>{displayPortValue(this.value)}</span>;
  }
}

class AssertionValue extends TimelineValue {
  constructor(
    readonly expectedValue: any,
    readonly result: AssertionResult | undefined,
  ) {
    super();
  }
  render() {
    return (
      <span>
        {displayPortValue(this.expectedValue)}? {this.result?.success ? "✅" : "❌"}
      </span>
    );
  }
}

function getTimelineData(
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  parts: PartInstance[],
  testCaseResult: TestCaseResult | undefined,
) {
  const simulationActions =
    levelState.timelineMode === TimelineMode.SANDBOX
      ? levelState.simulationInput.actions
      : levelDefinition.testCase.input.actions;
  const assertions =
    levelState.timelineMode === TimelineMode.SANDBOX ? [] : levelDefinition.testCase.assertions;
  const timelineActions: TimelineAction[] = [
    ...simulationActions.map((action, index) =>
      timelineAction(index, action.time, action.portRef, new ActionValue(action.value)),
    ),
    ...assertions.map((assertion, index) => {
      const assertionResult = testCaseResult?.assertionResults.find((result) =>
        deepEqual(result.assertion, assertion),
      );
      return timelineAction(
        index,
        assertion.time,
        assertion.portRef,
        new AssertionValue(assertion.value, assertionResult),
      );
    }),
  ];
  function timelineAction(
    index: number,
    time: number,
    portRef: PortRef,
    value: TimelineValue,
  ): TimelineAction {
    return {
      id: index.toString(),
      start: time,
      end: time + 0.1,
      effectId: "",
      movable: false,
      flexible: false,
      data: new TimelineActionData(portRef, value, levelState.timelineMode === TimelineMode.TEST),
    };
  }
  const timelineActionsGroupedByPortRef = _.groupBy(timelineActions, (action) =>
    action.data ? JSON.stringify(action.data.portRef) : "",
  );
  return Object.entries(timelineActionsGroupedByPortRef).map(([portRef, actions]) => ({
    id: portRef,
    label: actions.length > 0 ? getPortRefLabel(actions[0].data.portRef, parts) : "",
    actions: actions,
  }));
}

function TimelineActionView(action: TimelineAction): ReactNode {
  if (!(action.data instanceof TimelineActionData)) return null;
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
    <div style={{ height: "100%", alignContent: "center" }}>
      {action.data.value ? action.data.value.render() : ""}
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
