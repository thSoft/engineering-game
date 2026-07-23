import { PortId } from "./ports";

export type ConnectionId = string;

export interface Connection {
  id: ConnectionId;
  fromPortId: PortId;
  toPortId: PortId;
}
