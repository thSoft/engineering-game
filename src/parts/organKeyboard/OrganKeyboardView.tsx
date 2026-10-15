import { PortDescriptors } from "../../engine/parts.tsx";
import { actionTriggeredPorts, pressedPorts } from "./organKeyboard.tsx";
import organKeyboardImg from "./organKeyboard.svg";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import { Position } from "@xyflow/react";
import { PortView } from "../../components/PortView.tsx";
import { mapValuesWithKey } from "../../engine/utils.ts";
import { getPulledDownStyle } from "../utils.tsx";

interface Props {
  pressed: PortDescriptors<typeof pressedPorts>;
  actionTriggered: PortDescriptors<typeof actionTriggeredPorts>;
}

export function OrganKeyboardView({ pressed, actionTriggered }: Props) {
  return (
    <InteractiveSvg
      props={{ src: organKeyboardImg }}
      styles={Object.entries(
        mapValuesWithKey(
          pressed,
          "action_",
          ({ value }) => `cursor: pointer; ${getPulledDownStyle(value)}`,
        ),
      ).map(([label, declarations]) => ({ label, declarations }))}
      onClicks={Object.entries(pressed).map(([label, { value, setValue }]) => ({
        label,
        handler: () => setValue(!value),
      }))}
      overlays={Object.entries(actionTriggered).map(([parentLabel, portDescriptor]) => ({
        label: "hook",
        parentLabel,
        render: () => (
          <PortView key={parentLabel} portDescriptor={portDescriptor} position={Position.Top} />
        ),
      }))}
      boundingBoxDependencies={[pressed]}
    />
  );
}
