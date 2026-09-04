import styles from "../shared/shared.module.css";
import pluggedImg from "./plugged.svg";
import unpluggedImg from "./unplugged.svg";
import socketImg from "../shared/socket.svg";
import onImg from "../shared/powerIndicator/on.svg";
import offImg from "../shared/powerIndicator/off.svg";
import { PortDescriptor } from "../../../engine/parts.tsx";
import { PortView } from "../../PortView.tsx";
import { Position } from "@xyflow/react";

interface Props {
  plugged: PortDescriptor<boolean>;
  powerOut: PortDescriptor<boolean>;
}

export function PlugView({ plugged, powerOut }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <img
        src={plugged.value ? pluggedImg : unpluggedImg}
        alt={plugged.value ? "Plugged" : "Unplugged"}
        onClick={() => plugged.setValue(!plugged.value)}
        style={{ cursor: "pointer" }}
      />
      <div className={styles.compartment91a4ffa918eb}>
        <img src={plugged.value ? onImg : offImg} alt={plugged.value ? "On" : "Off"} />
        <PortView portDescriptor={powerOut} position={Position.Right}>
          <img src={socketImg} alt="Socket" />
        </PortView>
      </div>
    </div>
  );
}
