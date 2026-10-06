import { TimelineAction } from "@keplar-404/timeline-engine";
import _ from "lodash";
import { ReactNode } from "react";
import { Assertion, AssertionResult, LevelDefinition, TestCaseResult } from "../engine/levels";
import {
  getDefinitionOfPart,
  getDefinitionOfPort,
  getPart,
  PartInstance,
  PortDefinition,
  PortKind,
  PortRef,
} from "../engine/parts";
import { BehaviorMode, getSimulationInput, LevelState } from "../engine/simulation";
import {
  connectableColor,
  eventColor,
  flowOffColor,
  selectedColor,
  stateColor,
} from "./designTokens.tsx";
import type { PortVisualState } from "./PartNode";

export function displayPortValue(portValue: any): string {
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
    readonly value: TimelineValue,
    readonly readOnly: boolean,
  ) {}
}

export abstract class TimelineValue {
  abstract getDisplayInfo(): {
    icon: ReactNode;
    type: ReactNode;
    postfix: ReactNode;
    value: ReactNode;
    color: string | undefined;
  };
  abstract getLanePath(levelState: LevelState): string[];
  abstract getStepLabel(levelState: LevelState): string;
}

export class ActionValue extends TimelineValue {
  constructor(
    readonly portRef: PortRef,
    readonly portDefinition: PortDefinition<any> | undefined,
    readonly value: any,
  ) {
    super();
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
  getLanePath(levelState: LevelState) {
    const { partLabel, portLabel } = getPortRefLabel(this.portRef, levelState.parts);
    return [partLabel, portLabel];
  }
  getStepLabel(levelState: LevelState) {
    const { type, value } = this.getDisplayInfo();

    const renderer = this.portDefinition?.renderAction;
    const { partLabel, portLabel } = getPortRefLabel(this.portRef, levelState.parts);
    return renderer
      ? `${renderer(this.value, partLabel)}`
      : `${type} ${partLabel}'s ${portLabel} = ${value}`;
  }
}

export class AssertionValue<D> extends TimelineValue {
  constructor(
    readonly assertion: Assertion<D>,
    readonly result: AssertionResult<D> | undefined,
  ) {
    super();
  }
  getDisplayInfo() {
    const icon = this.result?.success ? "✅" : "❌";
    return {
      icon: icon,
      type: "Check",
      postfix: `?${icon}`,
      value: this.assertion.timelineActionLabel,
      color: this.result?.success ? "lightgreen" : "red",
    };
  }
  getLanePath(levelState: LevelState): string[] {
    return this.assertion.getLanePath(levelState);
  }
  getStepLabel(levelState: LevelState) {
    return this.assertion.getStepLabel(levelState);
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
    behaviorMode === BehaviorMode.TEST_CASE ? levelDefinition.testCase.assertions : [];
  const timelineActions: TimelineAction[] = [
    ...simulationActions.map((action, index) => {
      const portDefinition = getDefinitionOfPort(action.portRef, levelState.parts);
      return timelineAction(
        `action-${index}`,
        action.time,
        new ActionValue(action.portRef, portDefinition, action.value),
      );
    }),
    ...simulationAssertions.map((assertion, index) => {
      return timelineAction(
        `assertion-${index}`,
        assertion.time,
        new AssertionValue(assertion, testCaseResult?.assertionResults[index]),
      );
    }),
  ];
  function timelineAction(id: string, time: number, value: TimelineValue): TimelineAction {
    return {
      id,
      start: time,
      end: time + 0.1,
      effectId: "",
      movable: false,
      flexible: false,
      data: new TimelineActionData(value, behaviorMode === BehaviorMode.TEST_CASE),
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
