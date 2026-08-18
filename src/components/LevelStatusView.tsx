import { Tag } from "antd";
import { Verified, Wrench } from "lucide-react";
import { LevelStatus } from "../engine/simulation";

function LevelStatusView({ levelStatus }: { levelStatus: LevelStatus }) {
  const descriptors = {
    [LevelStatus.NOT_STARTED]: { color: "default", icon: undefined, message: "Not Started" },
    [LevelStatus.IN_PROGRESS]: {
      color: "processing",
      icon: <Wrench size={16} />,
      message: "In Progress",
    },
    [LevelStatus.COMPLETED]: {
      color: "success",
      icon: <Verified size={16} />,
      message: "Completed",
    },
  };
  const { color, icon, message } = descriptors[levelStatus] ?? {
    color: "default",
    icon: undefined,
    message: "Unknown",
  };

  return (
    <Tag color={color} icon={icon} variant="solid">
      {message}
    </Tag>
  );
}

export default LevelStatusView;
