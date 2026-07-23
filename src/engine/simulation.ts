import { getDefinition } from "./ports";
import type { PartInstance, PortId, PortInstance, SwitchState } from "./types";

export function resolveFlowStates(
  parts: PartInstance[],
  ports: PortInstance[],
  connections: { fromPortId: PortId; toPortId: PortId }[],
): Map<string, boolean> {
  const partById = new Map(parts.map((part) => [part.id, part]));
  const portById = new Map(ports.map((port) => [port.id, port]));
  const incomingConnections = new Map<string, string[]>();
  for (const connection of connections) {
    const sourceIds = incomingConnections.get(connection.toPortId) ?? [];
    sourceIds.push(connection.fromPortId);
    incomingConnections.set(connection.toPortId, sourceIds);
  }

  const resolved = new Map<string, boolean>();
  const resolving = new Set<string>();
  const flowStateFor = (portId: PortId): boolean => {
    const cached = resolved.get(portId);
    if (cached !== undefined) return cached;
    const port = portById.get(portId);
    const part = port ? partById.get(port.partId) : undefined;
    if (
      !port ||
      !part ||
      getDefinition(port).kind !== "flow" ||
      resolving.has(portId)
    )
      return false;

    resolving.add(portId);
    let value: boolean;
    if (getDefinition(port).direction === "input") {
      value = (incomingConnections.get(port.id) ?? []).some((sourcePortId) =>
        flowStateFor(sourcePortId),
      );
    } else if (part.type === "POWER_SOURCE") {
      value = true;
    } else if (part.type === "SWITCH") {
      const hasPower = ports
        .filter(
          (candidate) =>
            candidate.partId === part.id &&
            getDefinition(candidate).kind === "flow" &&
            getDefinition(candidate).direction === "input",
        )
        .some((input) => flowStateFor(input.id));
      value = (part.state as SwitchState).on && hasPower ? true : false;
    } else {
      const hasInputFlow = ports
        .filter(
          (candidate) =>
            candidate.partId === part.id &&
            getDefinition(candidate).kind === "flow" &&
            getDefinition(candidate).direction === "input",
        )
        .some((input) => flowStateFor(input.id));
      value = hasInputFlow ? true : (port.flowState ?? false);
    }

    resolving.delete(portId);
    resolved.set(portId, value);
    return value;
  };

  for (const port of ports) flowStateFor(port.id);
  return resolved;
}
