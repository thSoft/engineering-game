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
  PortRef,
} from "../engine/parts";
import { LevelState, TimelineMode } from "../engine/simulation";

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
}

export class ActionValue extends TimelineValue {
  constructor(readonly value: any) {
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
}

export class AssertionValue extends TimelineValue {
  constructor(
    readonly expectedValue: any,
    readonly result: AssertionResult | undefined,
  ) {
    super();
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
  timelineMode: TimelineMode,
  levelState: LevelState,
  levelDefinition: LevelDefinition,
  testCaseResult: TestCaseResult | undefined,
) {
  const simulationActions =
    timelineMode === TimelineMode.SANDBOX
      ? levelState.simulationInput.actions
      : levelDefinition.testCase.input.actions;
  const simulationAssertions =
    timelineMode === TimelineMode.SANDBOX ? [] : levelDefinition.testCase.assertions;
  const timelineActions: TimelineAction[] = [
    ...simulationActions.map((action, index) =>
      timelineAction(index, action.time, action.portRef, new ActionValue(action.value)),
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
      data: new TimelineActionData(portRef, value, timelineMode === TimelineMode.TEST),
    };
  }
  return _.sortBy(timelineActions, (action) => action.start);
}
