import { Button, Flex, Result, Segmented, Tooltip } from "antd";
import { PackageCheck } from "lucide-react";
import { TestCaseResult } from "../engine/levels";
import { LevelPhase, LevelState, LevelStatus, TimelineMode } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";

interface Props {
  levelState: LevelState | undefined;
  testCaseResult: TestCaseResult | undefined;
}

export default function LevelDashboard({ levelState, testCaseResult }: Props) {
  const success = testCaseResult?.success;
  const status = success ? "success" : "warning";
  const message = success ? "Tests passed" : "Tests failed";

  const timelineMode = levelState?.timelineMode ?? TimelineMode.TEST;
  const setTimelineMode = useGameStore((s) => s.setTimelineMode);

  const levelStatus = levelState?.levelStatus ?? LevelStatus.IN_PROGRESS;
  const setLevelStatus = useGameStore((s) => s.setLevelStatus);

  const setLevelPhase = useGameStore((s) => s.setLevelPhase);

  return (
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
      <div className="text-sm">Mode:</div>
      <Segmented
        value={timelineMode}
        onChange={(value) => setTimelineMode(value)}
        options={[
          { label: "Test", value: TimelineMode.TEST },
          { label: "Sandbox", value: TimelineMode.SANDBOX },
        ]}
      />
    </Flex>
  );
}
