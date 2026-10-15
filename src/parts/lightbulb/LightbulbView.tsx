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
      styles={[
        { label: "lit", declarations: visibleIf(lit) },
        { label: "unlit", declarations: hiddenIf(lit) },
        { label: "litIndicator", declarations: getIndicatorStyle(powerIn) },
      ]}
      overlays={[
        {
          label: "powerIn",
          render: () => <PortView portDescriptor={powerIn} position={Position.Left} />,
        },
      ]}
    />
  );
}
