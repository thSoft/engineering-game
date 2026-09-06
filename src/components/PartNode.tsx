import { type Node, type NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import { Box } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type {
  ParameterValues,
  PartDefinitionId,
  PartId,
  PortDefinition,
  PortDescriptors,
} from "../engine/parts";
import { getPartDefinitionById, PortPosition, PortRef } from "../engine/parts";
import { setPortValue } from "../store/gameStore.ts";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export interface PortInfo {
  definition: PortDefinition<any>;
  ref: PortRef;
  value: any;
  visual: PortVisualState;
  exposed: boolean;
  connected: boolean;
}

export type PartNodeData = {
  partId: PartId;
  label: string;
  definitionId: PartDefinitionId;
  inputPorts: PortInfo[];
  outputPorts: PortInfo[];
  selected?: boolean;
  parameterValues?: ParameterValues<any>;
  onContextMenu?: (partId: PartId, x: number, y: number) => void;
  onPortClick?: (portRef: PortRef) => void;
  onPortMove?: (portRef: PortRef, position: PortPosition) => void;
  onStateToggle?: (portRef: PortRef) => void;
};

export const PART_TYPE = "part" as const;

export type PartNodeType = Node<PartNodeData, typeof PART_TYPE>;

function PartNode({ data }: NodeProps<PartNodeType>) {
  const { label, definitionId, inputPorts, outputPorts, onPortClick } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const definition = getPartDefinitionById(definitionId);

  useEffect(() => {
    updateNodeInternals(data.partId);
  }, [data.partId, updateNodeInternals, inputPorts, outputPorts]);

  const Icon = definition?.icon ?? Box;

  const inputPortDescriptors: PortDescriptors<any> = Object.fromEntries(
    inputPorts.map((portInfo) => [
      portInfo.ref.portKey,
      {
        value: portInfo.value,
        setValue: (value: any) => setPortValue(portInfo.ref, value),
        ref: portInfo.ref,
        type: "target" as const,
        definition: portInfo.definition,
        visualState: portInfo.visual,
        startOrFinishConnection: () => {
          return onPortClick?.(portInfo.ref);
        },
      },
    ]),
  );
  const parameterValues = data.parameterValues ?? {};
  const outputPortDescriptors = Object.fromEntries(
    outputPorts.map((portInfo) => [
      portInfo.ref.portKey,
      {
        value: portInfo.value,
        setValue: () => {},
        ref: portInfo.ref,
        type: "source" as const,
        definition: portInfo.definition,
        visualState: portInfo.visual,
        startOrFinishConnection: () => {
          return onPortClick?.(portInfo.ref);
        },
      },
    ]),
  );

  return (
    <div ref={nodeRef}>
      {definition ? (
        definition.render(inputPortDescriptors, parameterValues, outputPortDescriptors)
      ) : (
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} />
          <span className="text-sm font-semibold text-slate-100">{label}</span>
        </div>
      )}
    </div>
  );
}

export default memo(PartNode);
