import { Edge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { ConnectionId } from "../engine/connections.ts";
import ConnectionContextMenu from "./ConnectionContextMenu.tsx";

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
    <ConnectionContextMenu connectionId={data.id} open={selected}>
      {path}
    </ConnectionContextMenu>
  ) : (
    path
  );
}
