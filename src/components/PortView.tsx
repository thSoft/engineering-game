import { Handle, Position } from "@xyflow/react";
import { ReactNode } from "react";
import { getPortPath, PortDescriptor } from "../engine/parts.tsx";

import { getPortColor } from "./utils.tsx";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  portDescriptor: PortDescriptor<any>;
  position?: Position;
}

export function PortView({ children, portDescriptor, position }: Props) {
  return (
    <Handle
      id={getPortPath(portDescriptor.ref)}
      type={portDescriptor.definition.direction === "output" ? "source" : "target"}
      position={position ?? Position.Right}
      onClick={(e) => {
        e.stopPropagation();
        portDescriptor.startOrFinishConnection();
      }}
      style={{
        cursor: "pointer",
        border: `2px solid ${getPortColor(portDescriptor.definition.kind, portDescriptor.visualState)}`,
        background: "none",
        transform: "none",
        position: "static",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </Handle>
  );
}
