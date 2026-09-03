import styles from "./plug.module.css";
import pluggedImg from "./plugged.svg";
import unpluggedImg from "./unplugged.svg";
import socketImg from "./socket.svg";
import onImg from "../shared/powerIndicator/on.svg";
import offImg from "../shared/powerIndicator/off.svg";
import { PortDescriptor } from "../../../engine/parts.tsx";

interface Props {
  plugged: PortDescriptor<boolean>;
}

export function PlugView({ plugged }: Props) {
  const plug = (
    <img
      src={plugged.value ? pluggedImg : unpluggedImg}
      alt={plugged.value ? "Plugged" : "Unplugged"}
      onClick={() => plugged.setValue(!plugged.value)}
    />
  );
  const socket = (
    <div className={styles.socket91a4ffa918eb}>
      <img src={plugged.value ? onImg : offImg} alt={plugged.value ? "On" : "Off"} />
      <img src={socketImg} alt="Socket" />
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      {plug}
      {socket}
    </div>
  );
}
