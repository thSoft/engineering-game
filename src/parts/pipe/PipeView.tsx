import { ParameterDescriptor, PortDescriptor } from "../../engine/parts.tsx";
import { gedackt8, PipeSound } from "./PipeSound.ts";
import { Slider } from "antd";
import { useDeferredValue } from "react";

interface Props {
  air: PortDescriptor<boolean>;
  sound: PortDescriptor<number>;
  length: ParameterDescriptor<number>;
  partIndex: number;
}

export function PipeView({ air, sound, length, partIndex }: Props) {
  const deferredLength = useDeferredValue(length.value); // Prevent "Maximum update depth exceeded"

  return (
    <div>
      <Slider
        className="nodrag" // Prevent React Flow handling drag
        min={4}
        value={deferredLength}
        onChange={length.setValue}
        tooltip={{ formatter: (value) => `${value} cm` }}
        vertical
        style={{ height: "100px" }}
      />
      <button onClick={() => air.setValue(!air.value)}>{air.value ? "Stop" : "Play"}</button>
      <PipeSound
        playing={sound.value > 0}
        frequency={sound.value}
        stop={gedackt8}
        channel={partIndex}
      />
    </div>
  );
}
