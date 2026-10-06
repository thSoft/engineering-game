import { PortDescriptors } from "../../engine/parts.tsx";
import { actionTriggeredPorts, pressedPorts } from "./organKeyboard.tsx";
import organKeyboardImg from "./OrganKeyboard.svg";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import _ from "lodash";

interface Props {
  pressed: PortDescriptors<typeof pressedPorts>;
  actionTriggered: PortDescriptors<typeof actionTriggeredPorts>;
}

export function OrganKeyboardView({ pressed }: Props) {
  return (
    <InteractiveSvg
      props={{ src: organKeyboardImg }}
      styles={_.mapValues(
        pressed,
        ({ value }) => `cursor: pointer; transform: translateY(${value ? 6 : 0}px);`,
      )}
      onClicks={_.mapValues(pressed, ({ value, setValue }) => () => {
        setValue(!value);
      })}
    />
  );
}
