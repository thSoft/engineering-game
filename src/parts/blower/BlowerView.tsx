import { Position } from "@xyflow/react";
import Checkbox from "antd/es/checkbox/Checkbox";
import Flex from "antd/es/flex/index";
import socketImg from "../../components/parts/shared/socket.svg";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";

interface Props {
  toggle: PortDescriptor<boolean>;
  airOut: PortDescriptor<boolean>;
}

export function BlowerView({ toggle, airOut }: Props) {
  return (
    <Flex>
      <PortView portDescriptor={airOut} position={Position.Left}>
        <img src={socketImg} alt="Socket" />
      </PortView>
      <Checkbox checked={toggle.value} onChange={() => toggle.setValue(!toggle.value)} />
    </Flex>
  );
}
