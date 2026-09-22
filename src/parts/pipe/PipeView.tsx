import { Position } from "@xyflow/react";
import { Slider } from "antd";
import { useDeferredValue } from "react";
import { PortView } from "../../components/PortView.tsx";
import socketImg from "../../components/parts/shared/socket.svg";
import { ParameterDescriptor, PortDescriptor } from "../../engine/parts.tsx";
import { gedackt8, PipeSound } from "./PipeSound.ts";

interface Props {
  air: PortDescriptor<boolean>;
  sound: PortDescriptor<number>;
  length: ParameterDescriptor<number>;
  partIndex: number;
  isExperiment: boolean;
}

export function PipeView({ air, sound, length, partIndex, isExperiment }: Props) {
  const deferredLength = useDeferredValue(length.value); // Prevent "Maximum update depth exceeded"

  return (
    <div>
      <Slider
        step={0.5}
        className="nodrag" // Prevent React Flow handling drag
        min={4}
        value={deferredLength}
        onChange={(e) => length.setValue(e)}
        tooltip={{ formatter: (value) => `${value} cm` }}
        vertical
        style={{ height: "400px" }}
      />
      <button onClick={() => air.setValue(!air.value)}>{air.value ? "Stop" : "Play"}</button>
      <PortView key="air" portDescriptor={air} position={Position.Bottom}>
        <img src={socketImg} alt="Socket" />
      </PortView>
      {isExperiment && (
        <PipeSound
          playing={sound.value > 0}
          frequency={sound.value}
          stop={gedackt8}
          channel={partIndex}
        />
      )}
    </div>
  );
}
