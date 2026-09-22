import { type Node, type NodeProps } from "@xyflow/react";
import {
  ParameterDefinition,
  ParameterDescriptors,
  PartDefinition,
  PartDescriptor,
  PartInstance,
  PortDefinition,
  PortDescriptors,
} from "../engine/parts";
import PartContextMenu from "./PartContextMenu";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export type PartNodeData<
  P extends Record<string, ParameterDefinition<any>>,
  I extends Record<string, PortDefinition<any>>,
  O extends Record<string, PortDefinition<any>>,
> = {
  instance: PartInstance;
  definition: PartDefinition<any, any, any>;
  inputPortDescriptors: PortDescriptors<I>;
  outputPortDescriptors: PortDescriptors<O>;
  parameterDescriptors: ParameterDescriptors<P>;
  partDescriptor: PartDescriptor;
};

export const PART_TYPE = "part" as const;

export type PartNodeType = Node<PartNodeData<any, any, any>, typeof PART_TYPE>;

function PartNode({ data }: NodeProps<PartNodeType>) {
  const {
    instance,
    definition,
    inputPortDescriptors,
    outputPortDescriptors,
    parameterDescriptors,
    partDescriptor,
  } = data;

  const content = definition ? (
    <span>
      {/* Wrapper necessary for context menu to work */}
      {definition.render(
        inputPortDescriptors,
        parameterDescriptors,
        outputPortDescriptors,
        partDescriptor,
      )}
    </span>
  ) : (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm font-semibold text-slate-100">{instance.label}</span>
    </div>
  );
  return partDescriptor.isFixed ? (
    content
  ) : (
    <PartContextMenu partId={data.instance.id}>{content}</PartContextMenu>
  );
}

export default PartNode;
