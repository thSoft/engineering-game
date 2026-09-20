import { Position } from "@xyflow/react";
import Checkbox from "antd/es/checkbox/Checkbox";
import Flex from "antd/es/flex/index";
import socketImg from "../../components/parts/shared/socket.svg";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";

interface Props {
  pressed: PortDescriptor<boolean>;
  actionTriggered: PortDescriptor<boolean>;
}

export function OrganKeyView({ pressed, actionTriggered }: Props) {
  return (
    <Flex>
      <PortView portDescriptor={actionTriggered} position={Position.Left}>
        <img src={socketImg} alt="Socket" />
      </PortView>
      <Checkbox checked={pressed.value} onChange={() => pressed.setValue(!pressed.value)} />
    </Flex>
  );
}
