import { Tag } from "antd";
import Link from "antd/es/typography/Link";
import { Verified, Wrench } from "lucide-react";
import { LevelPhase, LevelStatus } from "../engine/simulation";
import { setLevelPhase } from "../store/gameStore";
import { iconSize } from "./designTokens.tsx";

function LevelStatusView({ levelStatus }: { levelStatus: LevelStatus }) {
  const descriptors = {
    [LevelStatus.NOT_STARTED]: { color: "default", icon: undefined, message: "Not Started" },
    [LevelStatus.IN_PROGRESS]: {
      color: "processing",
      icon: <Wrench size={iconSize} />,
      message: "In Progress",
    },
    [LevelStatus.COMPLETED]: {
      color: "success",
      icon: <Verified size={iconSize} />,
      message: "Completed",
    },
  };
  const { color, icon, message } = descriptors[levelStatus] ?? {
    color: "default",
    icon: undefined,
    message: "Unknown",
  };

  const tag = (
    <Tag color={color} icon={icon} variant="solid">
      {message}
    </Tag>
  );
  return levelStatus === LevelStatus.COMPLETED ? (
    <Link onClick={() => setLevelPhase(LevelPhase.SUCCESS)}>{tag}</Link>
  ) : (
    tag
  );
}

export default LevelStatusView;
