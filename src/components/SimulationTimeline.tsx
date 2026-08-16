import {
  Timeline,
  TimelineAction,
  TimelineRow,
  TimelineState,
} from "@keplar-404/react-timeline-editor";
import { Dropdown } from "antd";
import _ from "lodash";
import { ReactNode, useEffect, useRef } from "react";
import { PartInstance } from "../engine/parts";
import { LevelState } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { displayPortValue, getPortRefLabel } from "./utils";

interface SimulationTimelineProps {
  levelState: LevelState;
  setCurrentTime: (currentTime: number) => void;
  parts: PartInstance[];
}

export function SimulationTimeline({ levelState, setCurrentTime, parts }: SimulationTimelineProps) {
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

  const actionsGroupedByPortRef = _.groupBy(levelState.simulationInput.actions, (action) =>
    JSON.stringify(action.portRef),
  );
  const editorData = Object.entries(actionsGroupedByPortRef).map(([portRef, actions]) => ({
    id: portRef,
    label: actions.length > 0 ? getPortRefLabel(actions[0].portRef, parts) : "",
    actions: actions.map(
      (action, index): TimelineAction => ({
        id: index.toString(),
        start: action.time,
        end: action.time + 0.1,
        effectId: "",
        movable: false,
        flexible: false,
        data: action.value,
      }),
    ),
  }));

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
          {editorData.map((row) => (
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
          editorData={editorData}
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

function TimelineActionView(action: TimelineAction, row: TimelineRow): ReactNode {
  const items = [
    {
      key: "delete",
      label: (
        <div
          onClick={() => {
            useGameStore.getState().deleteAction(JSON.parse(row.id), action.start);
          }}
        >
          Delete
        </div>
      ),
    },
  ];
  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <div style={{ height: "100%", alignContent: "center" }}>{displayPortValue(action.data)}</div>
    </Dropdown>
  );
}
