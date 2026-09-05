import { Edge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { Popover } from "antd";
import ConnectionContextMenu from "./ConnectionContextMenu.tsx";
import { ConnectionId } from "../engine/connections.ts";

export type ConnectionEdgeData = {
  id: ConnectionId;
};

export const CONNECTION_TYPE = "connection" as const;

export type ConnectionEdgeType = Edge<ConnectionEdgeData, typeof CONNECTION_TYPE>;

export function ConnectionEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  selected,
}: EdgeProps<ConnectionEdgeType>) {
  const [pathShape] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const path = (
    <path
      d={pathShape}
      fill="none"
      stroke={style?.stroke ?? "#fff"}
      strokeWidth={style?.strokeWidth ?? 2}
      strokeLinecap="round"
      markerEnd={markerEnd}
      style={style}
    />
  );
  return data ? (
    <Popover
      open={selected}
      placement="top"
      content={<ConnectionContextMenu connectionId={data.id} />}
    >
      {path}
    </Popover>
  ) : (
    path
  );
}
