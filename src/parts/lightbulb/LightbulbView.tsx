import { Position } from "@xyflow/react";
import { PortDescriptor } from "../../engine/parts.tsx";
import { PortView } from "../../components/PortView.tsx";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import lightbulbImg from "./lightbulb.svg";
import { getIndicatorStyle, hiddenIf, visibleIf } from "../utils.tsx";

interface Props {
  powerIn: PortDescriptor<boolean>;
  lit: PortDescriptor<boolean>;
}

export function LightbulbView({ powerIn, lit }: Props) {
  return (
    <InteractiveSvg
      props={{ src: lightbulbImg }}
      styles={{
        lit: visibleIf(lit),
        unlit: hiddenIf(lit),
        litIndicator: getIndicatorStyle(powerIn),
      }}
      overlays={{
        powerIn: () => <PortView portDescriptor={powerIn} position={Position.Left} />,
      }}
    />
  );
}
