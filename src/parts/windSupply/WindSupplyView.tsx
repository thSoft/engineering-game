import { Position } from "@xyflow/react";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import windSupplyImg from "./windSupply.svg";
import { transitionSettings } from "../../components/designTokens.tsx";
import { getToggleStyle } from "../utils.tsx";

interface Props {
  toggle: PortDescriptor<boolean>;
  airOut: PortDescriptor<boolean>;
}

export function WindSupplyView({ toggle, airOut }: Props) {
  return (
    <InteractiveSvg
      props={{ src: windSupplyImg }}
      styles={[
        {
          label: "moving",
          declarations: `
          transition: transform ${transitionSettings};
          ${getToggleStyle(toggle)}`,
        },
        { label: "interactive", declarations: "cursor: pointer;" },
      ]}
      onClicks={[
        {
          label: "interactive",
          handler: () => {
            toggle.setValue(!toggle.value);
          },
        },
      ]}
      overlays={[
        {
          label: "airOut",
          render: () => <PortView portDescriptor={airOut} position={Position.Right} />,
        },
      ]}
    />
  );
}
