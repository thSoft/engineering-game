import { Position } from "@xyflow/react";
import { useDeferredValue } from "react";
import { PortView } from "../../components/PortView.tsx";
import { ParameterDescriptor, PortDescriptor } from "../../engine/parts.tsx";
import { gedackt8, PipeSound } from "./PipeSound.ts";
import { Sound } from "./pipe.tsx";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import holzgedacktPipeImg from "./holzgedackt/pipe.svg";
import holzgedacktTuningCapImg from "./holzgedackt/tuningCap.svg?inline";
import { Slider } from "antd";

interface Props {
  air: PortDescriptor<boolean>;
  sound: PortDescriptor<Sound>;
  length: ParameterDescriptor<number>;
  partIndex: number;
  isExperiment: boolean;
}

const minLengthValue = 4;
const maxLengthValue = 100;

export function PipeView({ air, sound, length, partIndex, isExperiment }: Props) {
  const deferredLength = useDeferredValue(length.value); // Prevent "Maximum update depth exceeded"

  return (
    <div>
      <InteractiveSvg
        props={{ src: holzgedacktPipeImg }}
        styles={[
          {
            label: "pipe",
            declarations: `
            transform: scaleY(${deferredLength / maxLengthValue});
            transform-origin: bottom;
            transform-box: fill-box;`,
          },
        ]}
        overlays={[
          {
            label: "airIn",
            render: () => <PortView key="air" portDescriptor={air} position={Position.Bottom} />,
          },
          {
            label: "tunableLength",
            render: () => (
              <Slider
                step={0.5}
                className="nodrag" // Prevent React Flow handling drag
                min={minLengthValue}
                max={maxLengthValue}
                value={deferredLength}
                onChange={(e) => length.setValue(e)}
                tooltip={{ formatter: (value) => `${value} cm` }}
                vertical
                styles={{
                  handle: {
                    background: `url("${holzgedacktTuningCapImg}") no-repeat center`,
                    backgroundColor: "transparent",
                    border: "none",
                    backgroundSize: "cover",
                    cursor: "ns-resize",
                    transform: "translateX(0) translateY(0) scale(10)",
                  },
                  rail: {
                    background: "transparent",
                  },
                  track: {
                    background: "transparent",
                  },
                }}
              />
            ),
          },
        ]}
      />
      {isExperiment && (
        <PipeSound
          playing={sound.value !== undefined}
          frequency={sound.value?.frequency ?? 0}
          stop={gedackt8}
          channel={partIndex}
        />
      )}
    </div>
  );
}
