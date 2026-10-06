import { Position } from "@xyflow/react";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";
import plugImg from "./plug.svg";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import { transitionSettings } from "../../components/designTokens.tsx";
import { getIndicatorStyle } from "../utils.tsx";

interface Props {
  plugged: PortDescriptor<boolean>;
  powerOut: PortDescriptor<boolean>;
}

export function PlugView({ plugged, powerOut }: Props) {
  return (
    <InteractiveSvg
      props={{ src: plugImg }}
      styles={{
        connector: `
          cursor: pointer;
          transition: transform ${transitionSettings};
          transform: ${plugged.value ? "translateX(-13px)" : "none"};`,
        plugged: getIndicatorStyle(plugged),
      }}
      onClicks={{
        connector: () => {
          plugged.setValue(!plugged.value);
        },
      }}
      overlays={{
        powerOut: () => <PortView portDescriptor={powerOut} position={Position.Right} />,
      }}
    />
  );
}
