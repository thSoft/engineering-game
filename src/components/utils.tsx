import { TimelineAction } from "@keplar-404/timeline-engine";
import _ from "lodash";
import { ReactNode } from "react";
import { AssertionResult, LevelDefinition, TestCaseResult } from "../engine/levels";
import {
  deepEqual,
  getDefinitionOfPart,
  getDefinitionOfPort,
  getPart,
  PartInstance,
  PortDefinition,
  PortKind,
  PortRef,
} from "../engine/parts";
import { BehaviorMode, getSimulationInput, LevelState } from "../engine/simulation";
import { selectedColor } from "./Workbench.tsx";
import { connectableColor, eventColor, flowOffColor, stateColor } from "./designTokens.tsx";
import type { PortVisualState } from "./PartNode";

export function displayPortValue(portValue: any): ReactNode {
  return portValue ? "ON" : "OFF";
}

export function getPortRefLabel(
  portRef: PortRef,
  parts: PartInstance[],
): { label: string; partLabel: string; portLabel: string } {
  const portDefinition = getDefinitionOfPort(portRef, parts);
  const portLabel = portDefinition?.label ?? portRef.portKey.toString();
  const part = getPart(parts, portRef.partId);
  const partDefinition = getDefinitionOfPart(portRef.partId, parts);
  const partLabel = part?.label ?? partDefinition?.label ?? portRef.partId;
  return { label: `${partLabel} > ${portLabel}`, partLabel, portLabel };
}

export class TimelineActionData {
  constructor(
    readonly portRef: PortRef,
    readonly portDefinition: PortDefinition<any> | undefined,
    readonly value: TimelineValue,
    readonly readOnly: boolean,
  ) {}
}

export abstract class TimelineValue {
  abstract getRawValue(): any;
  abstract getDisplayInfo(): {
    icon: ReactNode;
    type: ReactNode;
    postfix: ReactNode;
    value: ReactNode;
    color: string | undefined;
  };
}

export class ActionValue extends TimelineValue {
  constructor(readonly value: any) {
    super();
  }
  getRawValue() {
    return this.value;
  }
  getDisplayInfo() {
    return {
      icon: "➡️",
      type: "Set",
      postfix: "",
      value: displayPortValue(this.value),
      color: undefined,
    };
  }
}

export class AssertionValue extends TimelineValue {
  constructor(
    readonly expectedValue: any,
    readonly result: AssertionResult | undefined,
  ) {
    super();
  }
  getRawValue() {
    return this.expectedValue;
  }
  getDisplayInfo() {
    const icon = this.result?.success ? "✅" : "❌";
    return {
      icon: icon,
      type: "Check",
      postfix: `?${icon}`,
      value: displayPortValue(this.expectedValue),
      color: this.result?.success ? "lightgreen" : "red",
    };
  }
}

export function getTimelineActions(
  behaviorMode: BehaviorMode,
  levelState: LevelState,
  levelDefinition: LevelDefinition,
  testCaseResult: TestCaseResult | undefined,
) {
  const simulationActions = getSimulationInput(behaviorMode, levelState, levelDefinition).actions;
  const simulationAssertions =
    behaviorMode === BehaviorMode.TEST ? levelDefinition.testCase.assertions : [];
  const timelineActions: TimelineAction[] = [
    ...simulationActions.map((action, index) =>
      timelineAction(index, action.time, action.portRef, new ActionValue(action.value), levelState),
    ),
    ...simulationAssertions.map((assertion, index) => {
      const assertionResult = testCaseResult?.assertionResults.find((result) =>
        deepEqual(result.assertion, assertion),
      );
      return timelineAction(
        index,
        assertion.time,
        assertion.portRef,
        new AssertionValue(assertion.value, assertionResult),
        levelState,
      );
    }),
  ];
  function timelineAction(
    index: number,
    time: number,
    portRef: PortRef,
    value: TimelineValue,
    levelState: LevelState,
  ): TimelineAction {
    return {
      id: index.toString(),
      start: time,
      end: time + 0.1,
      effectId: "",
      movable: false,
      flexible: false,
      data: new TimelineActionData(
        portRef,
        getDefinitionOfPort(portRef, levelState.parts),
        value,
        behaviorMode === BehaviorMode.TEST,
      ),
    };
  }
  return _.sortBy(timelineActions, (action) => action.start);
}

export function getLevelIcon(levelDefinition: LevelDefinition): ReactNode {
  return (
    <img src={`levels/${levelDefinition.id}/icon.svg`} alt={levelDefinition.label} width={24} />
  );
}

export function getPortColor(portKind: PortKind, visual: PortVisualState): string {
  if (visual === "selected") return selectedColor;
  if (visual === "blocked") return "#334155";
  if (visual === "connectable") return connectableColor;
  if (portKind === "state") return stateColor;
  if (portKind === "event") return eventColor;
  return flowOffColor;
}

export function getColorStyle(color?: string) {
  const realColor = color ?? "#f1f5f9";
  return {
    borderColor: `${realColor}99`,
    backgroundColor: `${color}19`,
    color: color,
  };
}
