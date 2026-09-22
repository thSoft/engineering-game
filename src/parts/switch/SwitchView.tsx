import { Position } from "@xyflow/react";
import { transitionSettings } from "../../components/designTokens.tsx";
import offImg from "../../components/parts/shared/powerIndicator/off.svg";
import onImg from "../../components/parts/shared/powerIndicator/on.svg";
import styles from "../../components/parts/shared/shared.module.css";
import socketImg from "../../components/parts/shared/socket.svg";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";
import backgroundImg from "./background.svg";
import toggleImg from "./toggle.svg";

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
      <svg
        width={24}
        height={40}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          return toggle.setValue(!toggle.value);
        }}
      >
        <image href={backgroundImg} />
        <image
          href={toggleImg}
          style={{
            transform: toggle.value ? "translateY(-10px)" : "none",
            transition: `transform ${transitionSettings}`,
          }}
        />
      </svg>
      <img src={powerOut.value ? onImg : offImg} alt={powerOut.value ? "On" : "Off"} />
      <PortView portDescriptor={powerOut} position={Position.Right}>
        <img src={socketImg} alt="Socket" />
      </PortView>
    </div>
  );
}
