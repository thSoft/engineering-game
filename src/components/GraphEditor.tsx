import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Connection } from "../engine/connections";
import type { PartId, PartInstance, PartType } from "../engine/parts";
import { getPartLabel, partDefinitions } from "../engine/parts";
import type { PortId, PortInstance, PortPosition } from "../engine/ports";
import { getDefinition } from "../engine/ports";
import { useGameStore } from "../store/gameStore";
import ConnectionContextMenu, {
  type ConnectionContextMenuState,
} from "./ConnectionContextMenu";
import PartContextMenu, { type ContextMenuState } from "./PartContextMenu";
import PartNode, {
  flowOffColor,
  getPortColor,
  type PartNodeData,
  type PortVisualState,
} from "./PartNode";

const nodeTypes: NodeTypes = { part: PartNode };

function getPortVisual(
  candidatePort: PortInstance,
  selectedPort: PortInstance | undefined,
  connections: Connection[],
): PortVisualState {
  if (!selectedPort) return "idle";
  if (!selectedPort.id) return "idle";
  if (candidatePort.id === selectedPort.id) return "selected";
  if (
    getDefinition(candidatePort).direction ===
    getDefinition(selectedPort).direction
  )
    return "blocked";
  if (getDefinition(candidatePort).kind !== getDefinition(selectedPort).kind)
    return "blocked";
  const targetAlreadyConnected = connections.some(
    (connection) => connection.toPortId === candidatePort.id,
  );
  if (targetAlreadyConnected) return "blocked";
  if (candidatePort.partId === selectedPort.partId) return "blocked";
  return "connectable";
}

function buildNodeData(
  part: PartInstance,
  ports: PortInstance[],
  selectedPort: PortInstance | undefined,
  connections: Connection[],
  onContextMenu: (partId: PartId, x: number, y: number) => void,
  onPortClick: (portId: PortId) => void,
  onPortMove: (portId: PortId, position: PortPosition) => void,
  selected: boolean,
): PartNodeData {
  const partPorts = ports.filter((port) => port.partId === part.id);
  return {
    label: getPartLabel(part.type),
    type: part.type,
    selected,
    inputPorts: partPorts
      .filter((port) => getDefinition(port).direction === "input")
      .map((port, index, inputPorts) => ({
        id: port.id,
        name: getDefinition(port).label,
        position: port.position ?? {
          side: "left",
          offset: (index + 1) / (inputPorts.length + 1),
        },
        kind: getDefinition(port).kind,
        state: port.state,
        visual: getPortVisual(port, selectedPort, connections),
      })),
    outputPorts: partPorts
      .filter((port) => getDefinition(port).direction === "output")
      .map((port, index, outputPorts) => ({
        id: port.id,
        name: getDefinition(port).label,
        position: port.position ?? {
          side: "right",
          offset: (index + 1) / (outputPorts.length + 1),
        },
        kind: getDefinition(port).kind,
        state: port.state,
        visual: getPortVisual(port, selectedPort, connections),
      })),
    state: part.parameters,
    onContextMenu,
    onPortClick,
    onPortMove,
    onStateToggle: (portId) => {
      const gameState = useGameStore.getState();
      const oldPortState = gameState.parts
        .flatMap((part) => Object.values(part.ports))
        .find((p) => p.id === portId)?.state;
      gameState.setPortState(portId, { on: !oldPortState?.on });
    },
  };
}

export const selectedColor = "#ffffff";

function buildEdge(
  connection: Connection,
  portById: Map<PortId, PortInstance>,
  selected: boolean,
): Edge {
  const from = portById.get(connection.fromPortId);
  const to = portById.get(connection.toPortId);
  const flowOn = from?.state.on ?? false;
  const color = selected
    ? selectedColor
    : from
      ? getPortColor(getDefinition(from).kind, flowOn, "idle")
      : flowOffColor;
  return {
    id: connection.id,
    source: from?.partId ?? "",
    target: to?.partId ?? "",
    sourceHandle: connection.fromPortId,
    targetHandle: connection.toPortId,
    animated: flowOn,
    selected,
    style: { strokeWidth: selected ? 3 : 2, stroke: color },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: color,
    },
  };
}

export default function GraphEditor() {
  const parts = useGameStore((s) => s.parts);
  const connections = useGameStore((s) => s.connections);
  const movePart = useGameStore((s) => s.movePart);
  const movePort = useGameStore((s) => s.movePort);
  const deletePart = useGameStore((s) => s.deletePart);
  const addConnection = useGameStore((s) => s.addConnection);
  const deleteConnection = useGameStore((s) => s.deleteConnection);
  const addPart = useGameStore((s) => s.addPart);

  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [connectionMenu, setConnectionMenu] =
    useState<ConnectionContextMenuState | null>(null);
  const [pendingPortId, setPendingPortId] = useState<string | null>(null);

  const ports = useMemo(
    () => parts.flatMap((part) => Array.from(Object.values(part.ports))),
    [parts],
  );
  const portById = useMemo(() => new Map(ports.map((p) => [p.id, p])), [ports]);

  const pendingPort = useMemo(
    () => (pendingPortId ? portById.get(pendingPortId) : undefined),
    [pendingPortId, portById],
  );

  const openMenu = useCallback((partId: string, x: number, y: number) => {
    setMenu({ partId, x, y });
    setConnectionMenu(null);
    setPendingPortId(null);
  }, []);

  const openConnectionMenu = useCallback(
    (connectionId: string, x: number, y: number) => {
      setConnectionMenu({ connectionId, x, y });
      setMenu(null);
      setPendingPortId(null);
    },
    [],
  );

  const handlePortClick = useCallback(
    (portId: string) => {
      const port = portById.get(portId);
      if (!port) return;

      if (!pendingPortId) {
        setPendingPortId(portId);
        return;
      }
      if (pendingPortId === portId) {
        setPendingPortId(null);
        return;
      }

      const pendingPort = portById.get(pendingPortId);
      if (!pendingPort) {
        setPendingPortId(null);
        return;
      }

      if (
        getDefinition(port).direction === getDefinition(pendingPort).direction
      ) {
        setPendingPortId(portId);
        return;
      }

      if (getDefinition(port).kind !== getDefinition(pendingPort).kind) return;

      const fromId =
        getDefinition(pendingPort).direction === "output"
          ? pendingPortId
          : portId;
      const toId =
        getDefinition(pendingPort).direction === "output"
          ? portId
          : pendingPortId;
      addConnection(fromId, toId);
      setPendingPortId(null);
    },
    [pendingPortId, portById, addConnection],
  );

  // Zustand is the single source of truth for positions.
  // Nodes and edges are derived purely from store state on every render —
  // no separate RF state, no sync effects, no position divergence possible.
  const nodes: Node<PartNodeData>[] = useMemo(
    () =>
      parts.map((part) => ({
        id: part.id,
        type: "part",
        position: part.position,
        data: buildNodeData(
          part,
          ports,
          pendingPort,
          connections,
          openMenu,
          handlePortClick,
          movePort,
          part.id === menu?.partId,
        ),
      })),
    [
      parts,
      ports,
      pendingPort,
      connections,
      openMenu,
      handlePortClick,
      movePort,
      menu,
    ],
  );

  const edges: Edge[] = useMemo(
    () =>
      connections.map((connection) =>
        buildEdge(
          connection,
          portById,
          connection.id === connectionMenu?.connectionId,
        ),
      ),
    [connections, portById, connectionMenu],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          // Write every drag tick — Zustand is authoritative for positions
          movePart(change.id, change.position);
        }
        if (change.type === "remove") {
          deletePart(change.id);
          setPendingPortId(null);
        }
      }
      // applyNodeChanges is not called — RF reads positions from the store,
      // so there is no internal RF node state to patch.
    },
    [movePart, deletePart],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove") deleteConnection(change.id);
      }
      // Same pattern: edges derive from store, no RF edge state to patch.
    },
    [deleteConnection],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/x-part-type",
      ) as PartType;
      if (!type || !(type in partDefinitions)) return;
      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addPart(type, {
        x: flowPosition.x,
        y: flowPosition.y,
      });
    },
    [addPart, screenToFlowPosition],
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setConnectionMenu(null);
    setPendingPortId(null);
  }, []);

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      {pendingPortId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-slate-800/95 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 px-4 py-1.5 text-xs text-emerald-300 font-medium backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            Click a highlighted port to connect — or click canvas to cancel
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        onEdgeClick={(event, edge) =>
          openConnectionMenu(edge.id, event.clientX, event.clientY)
        }
        nodesConnectable={false}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls className="!bg-slate-800 !border-slate-700" />
        <MiniMap
          className="!bg-slate-800 !border-slate-700"
          nodeColor={() => "#475569"}
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>

      {menu && (
        <PartContextMenu
          menu={menu}
          onDelete={(id) => {
            deletePart(id);
            setPendingPortId(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
      {connectionMenu && (
        <ConnectionContextMenu
          menu={connectionMenu}
          onDelete={deleteConnection}
          onClose={() => setConnectionMenu(null)}
        />
      )}
    </div>
  );
}
