import { Button, Flex, Result, Tooltip } from "antd";
import { PackageCheck } from "lucide-react";
import { LevelDefinition, TestCaseResult } from "../engine/levels";
import { BehaviorMode, LevelPhase, LevelState, LevelStatus } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { borderColor } from "./designTokens";
import { ActionValue, getPortRefLabel, getTimelineActions, TimelineActionData } from "./utils";

interface Props {
  levelState: LevelState;
  levelDefinition: LevelDefinition;
  testCaseResult: TestCaseResult;
}

export default function AcceptanceView({ levelState, levelDefinition, testCaseResult }: Props) {
  const success = testCaseResult.success;
  const status = success ? "success" : "warning";
  const message = success ? "Tests passed" : "Tests failed";

  const levelStatus = levelState.levelStatus;
  const setLevelStatus = useGameStore((s) => s.setLevelStatus);

  const setLevelPhase = useGameStore((s) => s.setLevelPhase);

  const timelineActions = getTimelineActions(
    BehaviorMode.TEST_CASE,
    levelState,
    levelDefinition,
    testCaseResult,
  );

  return (
    <div
      style={{
        width: 300,
        paddingLeft: 12,
        paddingRight: 12,
        borderLeft: `1px solid ${borderColor}`,
      }}
    >
      <Flex vertical align="center" gap={8}>
        <Result
          status={status}
          title={message}
          extra={
            <Tooltip
              title={
                levelStatus === LevelStatus.COMPLETED
                  ? "Project is in production"
                  : success
                    ? null
                    : "Cannot send to production until tests pass"
              }
            >
              <Button
                type="primary"
                disabled={!success || levelStatus === LevelStatus.COMPLETED}
                icon={<PackageCheck size={16} />}
                onClick={() => {
                  setLevelPhase(LevelPhase.SUCCESS);
                  setLevelStatus(LevelStatus.COMPLETED);
                }}
              >
                Send to production
              </Button>
            </Tooltip>
          }
        />
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          <tbody>
            {timelineActions.map((action, index) => {
              if (!(action.data instanceof TimelineActionData)) return null;
              const { icon, type, value, color } = action.data.value.getDisplayInfo();
              const renderer =
                action.data.value instanceof ActionValue
                  ? action.data.portDefinition?.renderAction
                  : action.data.portDefinition?.renderAssertion;
              const { partLabel, portLabel } = getPortRefLabel(
                action.data.portRef,
                levelState.parts,
              );
              return (
                <tr
                  key={index}
                  style={{ borderBottom: `1px solid ${borderColor}`, color: color ?? "inherit" }}
                >
                  <td>{icon}</td>
                  <td>
                    {renderer
                      ? `${renderer(action.data.value.getRawValue(), partLabel)}`
                      : `${type} ${partLabel}'s ${portLabel} = ${value}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Flex>
    </div>
  );
}
