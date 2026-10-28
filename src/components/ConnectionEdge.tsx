import { Edge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { Connection } from "../engine/connections.ts";
import ConnectionContextMenu from "./ConnectionContextMenu.tsx";
import { PortDefinitionWithHelpers } from "../engine/parts.ts";
import { selectedColor } from "./designTokens.tsx";

export type ConnectionEdgeData = {
  connection: Connection;
  sourceValue: unknown;
  sourceDefinition: PortDefinitionWithHelpers<any> | undefined;
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
  markerEnd,
  data,
  selected = false,
}: EdgeProps<ConnectionEdgeType>) {
  const [pathShape] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  if (data === undefined || data.sourceDefinition === undefined) return null;
  const styles = data.sourceDefinition.type.renderConnection(
    data.sourceValue,
    selected,
    selectedColor,
  );
  const paths = styles.map((style) => (
    <path d={pathShape} fill="none" strokeLinecap="round" markerEnd={markerEnd} style={style} />
  ));
  return (
    <ConnectionContextMenu connectionId={data.connection.id} open={selected}>
      <>{paths}</>
    </ConnectionContextMenu>
  );
}
