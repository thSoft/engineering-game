import {
  Timeline,
  TimelineAction,
  TimelineRow,
  TimelineState,
} from "@keplar-404/react-timeline-editor";
import { Dropdown } from "antd";
import _ from "lodash";
import { ReactNode, useEffect, useRef } from "react";
import { LevelState } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { displayPortValue } from "./utils";

interface SimulationTimelineProps {
  levelState: LevelState;
  setCurrentTime: (currentTime: number) => void;
}
export function SimulationTimeline({ levelState, setCurrentTime }: SimulationTimelineProps) {
  const timelineRef = useRef<TimelineState>(null);
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setTime(levelState.currentTime);
    }
  }, [levelState.currentTime]);
  const actionsGroupedByPortRef = _.groupBy(levelState.simulationInput.actions, (action) =>
    JSON.stringify(action.portRef),
  );
  const editorData: TimelineRow[] = Object.entries(actionsGroupedByPortRef).map(
    ([portRef, actions]) => ({
      id: portRef,
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
    }),
  );

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
        <div style={{ height: "100%", alignContent: "center" }}>
          {displayPortValue(action.data)}
        </div>
      </Dropdown>
    );
  }

  return (
    <Timeline
      disableDrag={true}
      gridSnap={true}
      style={{ width: "100%", height: "200px" }}
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
    />
  );
}
