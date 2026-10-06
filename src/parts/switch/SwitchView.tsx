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
      styles={{
        powerInIndicator: getIndicatorStyle(powerIn),
        toggle: `
          cursor: pointer;
          transition: transform ${transitionSettings};
          transform: ${toggle.value ? "translateY(-10px)" : "none"};`,
        powerOutIndicator: getIndicatorStyle(powerOut),
      }}
      onClicks={{
        toggle: () => {
          toggle.setValue(!toggle.value);
        },
      }}
      overlays={{
        powerIn: () => <PortView portDescriptor={powerIn} position={Position.Left} />,
        powerOut: () => <PortView portDescriptor={powerOut} position={Position.Right} />,
      }}
    />
  );
}
