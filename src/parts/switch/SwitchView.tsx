import { Position } from "@xyflow/react";
import { transitionSettings } from "../../components/designTokens.tsx";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";
import switchImg from "./switch.svg";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import { getIndicatorStyle } from "../utils.tsx";

interface Props {
  powerIn: PortDescriptor<boolean>;
  powerOut: PortDescriptor<boolean>;
  toggle: PortDescriptor<boolean>;
}

export function SwitchView({ powerIn, powerOut, toggle }: Props) {
  return (
    <InteractiveSvg
      props={{ src: switchImg }}
      styles={[
        { label: "powerInIndicator", declarations: getIndicatorStyle(powerIn) },
        {
          label: "toggle",
          declarations: `
          cursor: pointer;
          transition: transform ${transitionSettings};
          transform: ${toggle.value ? "translateY(-10px)" : "none"};`,
        },
        { label: "powerOutIndicator", declarations: getIndicatorStyle(powerOut) },
      ]}
      onClicks={[
        {
          label: "toggle",
          handler: () => {
            toggle.setValue(!toggle.value);
          },
        },
      ]}
      overlays={[
        {
          label: "powerIn",
          render: () => <PortView portDescriptor={powerIn} position={Position.Left} />,
        },
        {
          label: "powerOut",
          render: () => <PortView portDescriptor={powerOut} position={Position.Right} />,
        },
      ]}
    />
  );
}
