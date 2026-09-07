import { type Node, type NodeProps } from "@xyflow/react";
import { memo, useRef } from "react";
import {
  ParameterDefinition,
  ParameterValues,
  PartDefinition,
  PartInstance,
  PortDefinition,
  PortDescriptors,
} from "../engine/parts";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export type PartNodeData<
  P extends Record<string, ParameterDefinition<any>>,
  I extends Record<string, PortDefinition<any>>,
  O extends Record<string, PortDefinition<any>>,
> = {
  instance: PartInstance;
  definition: PartDefinition<any, any, any>;
  inputPorts: PortDescriptors<I>;
  outputPorts: PortDescriptors<O>;
  parameterValues: ParameterValues<P>;
  selected?: boolean;
};

export const PART_TYPE = "part" as const;

export type PartNodeType = Node<PartNodeData<any, any, any>, typeof PART_TYPE>;

function PartNode({ data }: NodeProps<PartNodeType>) {
  const { instance, definition, inputPorts, outputPorts, parameterValues } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const Icon = definition.icon;

  return (
    <div ref={nodeRef}>
      {definition ? (
        definition.render(inputPorts, parameterValues, outputPorts)
      ) : (
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} />
          <span className="text-sm font-semibold text-slate-100">{instance.label}</span>
        </div>
      )}
    </div>
  );
}

export default memo(PartNode);
