import { PortDescriptor } from "../../engine/parts.tsx";
import { gedackt8, PipeSound } from "./PipeSound.ts";

interface Props {
  air: PortDescriptor<boolean>;
  sound: PortDescriptor<number>;
}

export function PipeView({ air, sound }: Props) {
  return (
    <div>
      <button onClick={() => air.setValue(!air.value)}>{air.value ? "Stop" : "Play"}</button>
      <PipeSound playing={sound.value > 0} frequency={sound.value} stop={gedackt8} />
    </div>
  );
}
