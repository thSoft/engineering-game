import _ from "lodash";
import { nanoid } from "nanoid";
import { InputPortRef, OutputPortRef, PartDefinitionId, PartDefinitions, PortRef } from "./parts";

export type ConnectionId = string & { __brand: "ConnectionId" };

export function toConnectionId(id: string) {
  return id as ConnectionId;
}

export type Connection = {
  id: ConnectionId;
  source: PortRef;
  target: PortRef;
};

export function connect<
  OutId extends PartDefinitionId,
  OutKey extends keyof PartDefinitions[OutId]["outputPorts"] & string,
  InId extends PartDefinitionId,
  InKey extends keyof PartDefinitions[InId]["inputPorts"] & string,
>(source: OutputPortRef<OutId, OutKey>, target: InputPortRef<InId, InKey>): Connection {
  return createConnection(source, target);
}

export function createConnection(source: PortRef, target: PortRef): Connection {
  return {
    id: toConnectionId(nanoid()),
    source,
    target,
  };
}

export function getConnectionsWithTarget(targetPortRef: PortRef, connections: Connection[]) {
  return connections.filter((connection) => _.isEqual(connection.target, targetPortRef));
}

export function getConnectionsWithSource(sourcePortRef: PortRef, connections: Connection[]) {
  return connections.filter((connection) => _.isEqual(connection.source, sourcePortRef));
}
