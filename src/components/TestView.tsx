import { Button, Flex, Result, Tooltip } from "antd";
import { PackageCheck } from "lucide-react";
import { LevelDefinition, TestCaseResult } from "../engine/levels";
import { LevelPhase, LevelState, LevelStatus, TimelineMode } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import { borderColor } from "./designTokens";
import { getPortRefLabel, getTimelineActions, TimelineActionData } from "./utils";

interface Props {
  levelState: LevelState;
  levelDefinition: LevelDefinition;
  testCaseResult: TestCaseResult;
}

export default function TestView({ levelState, levelDefinition, testCaseResult }: Props) {
  const success = testCaseResult.success;
  const status = success ? "success" : "warning";
  const message = success ? "Tests passed" : "Tests failed";

  const levelStatus = levelState.levelStatus;
  const setLevelStatus = useGameStore((s) => s.setLevelStatus);

  const setLevelPhase = useGameStore((s) => s.setLevelPhase);

  const timelineActions = getTimelineActions(
    TimelineMode.TEST,
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
                  <td>{type}</td>
                  <td>{partLabel}</td>
                  <td>{portLabel}</td>
                  <td>{value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Flex>
    </div>
  );
}
