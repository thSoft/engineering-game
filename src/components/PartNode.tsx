import { type Node, type NodeProps } from "@xyflow/react";
import { memo, useRef } from "react";
import {
  ParameterDefinition,
  ParameterDescriptors,
  PartDefinition,
  PartDescriptor,
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
  parameterDescriptors: ParameterDescriptors<P>;
  selected?: boolean;
  partDescriptor: PartDescriptor;
};

export const PART_TYPE = "part" as const;

export type PartNodeType = Node<PartNodeData<any, any, any>, typeof PART_TYPE>;

function PartNode({ data }: NodeProps<PartNodeType>) {
  const { instance, definition, inputPorts, outputPorts, parameterDescriptors, partDescriptor } =
    data;
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={nodeRef}>
      {definition ? (
        definition.render(inputPorts, parameterDescriptors, outputPorts, partDescriptor)
      ) : (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-100">{instance.label}</span>
        </div>
      )}
    </div>
  );
}

export default memo(PartNode);
