import { Position } from "@xyflow/react";
import { Flex } from "antd";
import socketImg from "../../components/parts/shared/socket.svg";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";

interface Props {
  airIn: PortDescriptor<boolean>;
  valves: Record<string, PortDescriptor<boolean>>;
  airOuts: Record<string, PortDescriptor<boolean>>;
}

export function WindchestView({ airIn, valves, airOuts }: Props) {
  const gap = 24;
  return (
    <Flex align="center">
      <Flex vertical align="end">
        <Flex gap={gap}>
          {Object.entries(airOuts).map(([name, portDescriptor]) => (
            <PortView key={name} portDescriptor={portDescriptor} position={Position.Top}>
              <img src={socketImg} alt="Socket" />
            </PortView>
          ))}
        </Flex>
        <Flex gap={gap}>
          {Object.entries(valves).map(([name, portDescriptor]) => (
            <PortView key={name} portDescriptor={portDescriptor} position={Position.Bottom}>
              <img src={socketImg} alt="Socket" />
            </PortView>
          ))}
        </Flex>
      </Flex>
      <PortView key="airIn" portDescriptor={airIn} position={Position.Right}>
        <img src={socketImg} alt="Socket" />
      </PortView>
    </Flex>
  );
}
