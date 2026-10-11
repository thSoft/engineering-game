import { PortDescriptors } from "../../engine/parts.tsx";
import { actionTriggeredPorts, pressedPorts } from "./organKeyboard.tsx";
import organKeyboardImg from "./OrganKeyboard.svg";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import _ from "lodash";
import { Position } from "@xyflow/react";
import { PortView } from "../../components/PortView.tsx";
import { mapValuesWithKey } from "../../engine/utils.ts";

interface Props {
  pressed: PortDescriptors<typeof pressedPorts>;
  actionTriggered: PortDescriptors<typeof actionTriggeredPorts>;
}

export function OrganKeyboardView({ pressed, actionTriggered }: Props) {
  return (
    <InteractiveSvg
      props={{ src: organKeyboardImg }}
      styles={mapValuesWithKey(
        pressed,
        "action_",
        ({ value }) => `cursor: pointer; transform: translateY(${value ? 8 : 0}px);`,
      )}
      onClicks={_.mapValues(pressed, ({ value, setValue }) => () => {
        setValue(!value);
      })}
      overlays={_.mapValues(actionTriggered, (portDescriptor, label) => () => (
        <PortView key={label} portDescriptor={portDescriptor} position={Position.Top} />
      ))}
      boundingBoxDependencies={[pressed]}
    />
  );
}
