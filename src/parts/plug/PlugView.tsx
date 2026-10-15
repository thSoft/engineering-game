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
      styles={[
        {
          label: "connector",
          declarations: `
          cursor: pointer;
          transition: transform ${transitionSettings};
          transform: ${plugged.value ? "translateX(-13px)" : "none"};`,
        },
        { label: "plugged", declarations: getIndicatorStyle(plugged) },
      ]}
      onClicks={[
        {
          label: "connector",
          handler: () => {
            plugged.setValue(!plugged.value);
          },
        },
      ]}
      overlays={[
        {
          label: "powerOut",
          render: () => <PortView portDescriptor={powerOut} position={Position.Right} />,
        },
      ]}
    />
  );
}
