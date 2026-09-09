import styles from "../../components/parts/shared/shared.module.css";
import outletImg from "./outlet.svg";
import connectorImg from "./connector.svg";
import socketImg from "../../components/parts/shared/socket.svg";
import onImg from "../../components/parts/shared/powerIndicator/on.svg";
import offImg from "../../components/parts/shared/powerIndicator/off.svg";
import { PortDescriptor } from "../../engine/parts.tsx";
import { PortView } from "../../components/PortView.tsx";
import { Position } from "@xyflow/react";

interface Props {
  plugged: PortDescriptor<boolean>;
  powerOut: PortDescriptor<boolean>;
}

export function PlugView({ plugged, powerOut }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <svg
        width="45"
        height="48"
        style={{ cursor: "pointer" }}
        onClick={() => plugged.setValue(!plugged.value)}
      >
        <image
          href={connectorImg}
          style={{
            transform: plugged.value ? "translateX(-13px)" : "none",
            transition: "transform 0.04s ease-in-out",
          }}
        />
        <image href={outletImg} />
      </svg>
      <div className={styles.compartment91a4ffa918eb}>
        <img src={plugged.value ? onImg : offImg} alt={plugged.value ? "On" : "Off"} />
        <PortView portDescriptor={powerOut} position={Position.Right}>
          <img src={socketImg} alt="Socket" />
        </PortView>
      </div>
    </div>
  );
}
