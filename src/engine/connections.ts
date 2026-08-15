import { nanoid } from "nanoid";
import { deepEqual, InputPortRef, OutputPortRef, PortRef } from "./parts";

export type ConnectionId = string & { __brand: "ConnectionId" };

export function toConnectionId(id: string) {
  return id as ConnectionId;
}

export type Connection = {
  id: ConnectionId;
  source: OutputPortRef<any, any>;
  target: InputPortRef<any, any>;
};

export function connect(
  source: OutputPortRef<any, any>,
  target: InputPortRef<any, any>,
): Connection {
  return {
    id: toConnectionId(nanoid()),
    source,
    target,
  };
}

export function getConnectionsWithTarget(
  targetPortRef: PortRef<any, any>,
  connections: Connection[],
) {
  return connections.filter((connection) =>
    deepEqual(connection.target, targetPortRef),
  );
}

export function getConnectionsWithSource(
  sourcePortRef: PortRef<any, any>,
  connections: Connection[],
) {
  return connections.filter((connection) =>
    deepEqual(connection.source, sourcePortRef),
  );
}
