import { nanoid } from "nanoid";
import { InputPortRef, OutputPortRef } from "./parts";

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
