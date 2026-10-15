import { Position } from "@xyflow/react";
import { PortView } from "../../components/PortView.tsx";
import { PortDescriptor } from "../../engine/parts.tsx";
import { InteractiveSvg } from "../InteractiveSvg.tsx";
import windchestImg from "./windchest.svg";
import { airOutPortPrefix } from "./windchest.tsx";
import { getPulledDownStyle } from "../utils.tsx";

interface Props {
  airIn: PortDescriptor<boolean>;
  valves: Record<string, PortDescriptor<boolean>>;
  airOuts: Record<string, PortDescriptor<boolean>>;
}

export function WindchestView({ airIn, valves, airOuts }: Props) {
  const airInPort = {
    label: "airIn",
    render: () => <PortView key="airIn" portDescriptor={airIn} position={Position.Right} />,
  };
  const valvePorts = Object.entries(valves).map(([parentLabel, portDescriptor]) => ({
    label: "hook",
    parentLabel,
    render: () => (
      <PortView key={parentLabel} portDescriptor={portDescriptor} position={Position.Bottom} />
    ),
  }));
  const airOutPorts = Object.entries(airOuts).map(([portLabel, portDescriptor]) => {
    const parentLabel = portLabel.slice(airOutPortPrefix.length); // Remove the prefix
    return {
      label: "pipeHole",
      parentLabel,
      render: () => (
        <PortView key={portLabel} portDescriptor={portDescriptor} position={Position.Top} />
      ),
    };
  });
  return (
    <InteractiveSvg
      props={{ src: windchestImg }}
      styles={Object.entries(valves).map(([parentLabel, { value }]) => ({
        label: "movingParts",
        parentLabel,
        declarations: getPulledDownStyle(value),
      }))}
      overlays={[airInPort, ...valvePorts, ...airOutPorts]}
      boundingBoxDependencies={[valves]}
    />
  );
}
