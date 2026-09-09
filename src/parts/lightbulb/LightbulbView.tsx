import { Position } from "@xyflow/react";
import { PortDescriptor } from "../../engine/parts.tsx";
import { PortView } from "../../components/PortView.tsx";
import offImg from "../../components/parts/shared/powerIndicator/off.svg";
import onImg from "../../components/parts/shared/powerIndicator/on.svg";
import styles from "../../components/parts/shared/shared.module.css";
import socketImg from "../../components/parts/shared/socket.svg";
import litImg from "./lit.svg";
import unlitImg from "./unlit.svg";

interface Props {
  powerIn: PortDescriptor<boolean>;
  lit: PortDescriptor<boolean>;
}

export function LightbulbView({ powerIn, lit }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img
        src={lit.value ? litImg : unlitImg}
        alt={lit.value ? "Lit" : "Unlit"}
        style={
          lit.value
            ? { filter: "brightness(1) drop-shadow(0 0 5px rgba(255, 255, 0, 0.8))" }
            : { filter: "brightness(0.6)" }
        }
      />
      <div className={styles.compartment91a4ffa918eb} style={{ flexDirection: "column" }}>
        <img
          src={powerIn.value ? onImg : offImg}
          alt={powerIn.value ? "On" : "Off"}
          style={{ transform: "rotate(-90deg)" }}
        />
        <PortView portDescriptor={powerIn} position={Position.Left}>
          <img src={socketImg} alt="Socket" />
        </PortView>
      </div>
    </div>
  );
}
