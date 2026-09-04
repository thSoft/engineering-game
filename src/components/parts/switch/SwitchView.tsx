import styles from "../shared/shared.module.css";
import onImg from "../shared/powerIndicator/on.svg";
import offImg from "../shared/powerIndicator/off.svg";
import socketImg from "../shared/socket.svg";
import switchOnImg from "./on.svg";
import switchOffImg from "./off.svg";
import { PortDescriptor } from "../../../engine/parts.tsx";
import { PortView } from "../../PortView.tsx";
import { Position } from "@xyflow/react";

interface Props {
  powerIn: PortDescriptor<boolean>;
  powerOut: PortDescriptor<boolean>;
  toggle: PortDescriptor<boolean>;
}

export function SwitchView({ powerIn, powerOut, toggle }: Props) {
  return (
    <div className={styles.compartment91a4ffa918eb}>
      <PortView portDescriptor={powerIn} position={Position.Left}>
        <img src={socketImg} alt="Socket" />
      </PortView>
      <img src={powerIn.value ? onImg : offImg} alt={powerIn.value ? "On" : "Off"} />
      <img
        src={toggle.value ? switchOnImg : switchOffImg}
        alt={toggle.value ? "On" : "Off"}
        onClick={() => toggle.setValue(!toggle.value)}
        style={{ cursor: "pointer" }}
      />
      <img src={powerOut.value ? onImg : offImg} alt={powerOut.value ? "On" : "Off"} />
      <PortView portDescriptor={powerOut} position={Position.Right}>
        <img src={socketImg} alt="Socket" />
      </PortView>
    </div>
  );
}
