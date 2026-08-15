import {
  Controls,
  NodeTypes,
  ReactFlow,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";
import {
  Connection,
  ConnectionId,
  getConnectionsWithTarget,
  toConnectionId,
} from "../engine/connections";
import {
  getLevelDefinitionById,
  isExposed,
  LevelDefinition,
} from "../engine/levels";
import {
  deepEqual,
  getDefinitionOfPart,
  getDefinitionOfPort,
  getPortPath,
  PartDefinitionId,
  partDefinitions,
  PartId,
  PartInstance,
  PortInstance,
  PortPosition,
  PortRef,
  refPort,
  toPartId,
} from "../engine/parts";
import {
  getPortValueAt,
  simulate,
  SimulationResult,
} from "../engine/simulation";
import { getCurrentLevel, useGameStore } from "../store/gameStore";
import ConnectionContextMenu, {
  type ConnectionContextMenuState,
} from "./ConnectionContextMenu";
import { connectableColor, flowOffColor } from "./designTokens";
import PartContextMenu, { type ContextMenuState } from "./PartContextMenu";
import PartNode, {
  getPortColor,
  PortInfo,
  type PartNodeData,
  type PortVisualState,
} from "./PartNode";

const nodeTypes: NodeTypes = { part: PartNode };

function getPortVisual(
  candidatePort: PortRef,
  selectedPort: PortRef | undefined,
  parts: PartInstance[],
  connections: Connection[],
): PortVisualState {
  if (!selectedPort) return "idle";
  if (deepEqual(candidatePort, selectedPort)) return "selected";
  const selectedPortDefinition = getDefinitionOfPort(selectedPort, parts);
  if (!selectedPortDefinition) return "idle";
  const candidatePortDefinition = getDefinitionOfPort(candidatePort, parts);
  if (!candidatePortDefinition) return "idle";
  if (candidatePortDefinition.direction === selectedPortDefinition.direction)
    return "blocked";
  if (candidatePortDefinition.kind !== selectedPortDefinition.kind)
    return "blocked";
  const targetAlreadyConnected = connections.some((connection) =>
    deepEqual(connection.target, candidatePort),
  );
  if (targetAlreadyConnected) return "blocked";
  if (candidatePort.partId === selectedPort.partId) return "blocked";
  return "connectable";
}

function buildNodeData(
  part: PartInstance,
  selectedPortRef: PortRef | undefined,
  parts: PartInstance[],
  connections: Connection[],
  onContextMenu: (partId: PartId, x: number, y: number) => void,
  onPortClick: (portRef: PortRef) => void,
  onPortMove: (portRef: PortRef, position: PortPosition) => void,
  selected: boolean,
  levelDefinition: LevelDefinition | undefined,
  currentTime: number,
  simulationResult: SimulationResult | undefined,
): PartNodeData | undefined {
  const partDefinition = getDefinitionOfPart(part.id, parts);
  if (!partDefinition) return undefined;
  const partPorts = part.portInstances;
  const createPortInfo = (port: PortInstance): PortInfo => {
    const portRef = refPort(part.id, port.key);
    const value = simulationResult
      ? getPortValueAt(portRef, currentTime, simulationResult)
      : null;
    return {
      ref: portRef,
      instance: port,
      value,
      visual: getPortVisual(portRef, selectedPortRef, parts, connections),
      exposed: levelDefinition ? isExposed(portRef, levelDefinition) : false,
      connected: getConnectionsWithTarget(portRef, connections).length > 0,
    };
  };
  return {
    label: partDefinition.label,
    partId: part.id,
    definitionId: partDefinition.id,
    selected,
    inputPorts: partPorts
      .filter((port) => port.definition.direction === "input")
      .map(createPortInfo),
    outputPorts: partPorts
      .filter((port) => port.definition.direction === "output")
      .map(createPortInfo),
    parameters: part.parameterValues,
    onContextMenu,
    onPortClick,
    onPortMove,
    onStateToggle: (portRef: PortRef) => {
      const value = simulationResult
        ? getPortValueAt(portRef, currentTime, simulationResult)
        : null;
      if (value === null) return;
      if (typeof value == "boolean") {
        useGameStore.getState().addAction(portRef, !value);
      }
    },
  };
}

export const selectedColor = "#ffffff";

function buildEdge(
  connection: Connection,
  selected: boolean,
  parts: PartInstance[],
): Edge {
  const source = connection.source;
  const target = connection.target;
  const flowOn = /* TODO source?.state.on ??*/ false;
  const sourceDefinition = getDefinitionOfPort(source, parts);
  const color = selected
    ? selectedColor
    : source
      ? getPortColor(sourceDefinition?.kind ?? "state", flowOn, "idle")
      : flowOffColor;
  return {
    id: connection.id,
    source: source.partId,
    target: target.partId,
    sourceHandle: getPortPath(source),
    targetHandle: getPortPath(target),
    animated: flowOn,
    selected,
    style: { strokeWidth: selected ? 3 : 2, stroke: color },
  };
}

export type PartNodeType = Node<PartNodeData, "part">;

export default function GraphEditor() {
  const currentLevelDefinition = useGameStore((s) =>
    getLevelDefinitionById(s.currentLevelDefinitionId),
  );
  const currentLevel = useGameStore((s) => getCurrentLevel(s));
  const parts = currentLevel?.parts ?? [];
  const connections = currentLevel?.connections ?? [];
  const currentTime = currentLevel?.currentTime ?? 0;

  const movePart = useGameStore((s) => s.movePart);
  const movePort = useGameStore((s) => s.movePort);
  const deletePart = useGameStore((s) => s.deletePart);
  const addConnection = useGameStore((s) => s.addConnection);
  const deleteConnection = useGameStore((s) => s.deleteConnection);
  const addPart = useGameStore((s) => s.addPart);

  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [connectionMenu, setConnectionMenu] =
    useState<ConnectionContextMenuState | null>(null);
  const [pendingPortRef, setPendingPortRef] = useState<PortRef | undefined>(
    undefined,
  );

  const openMenu = useCallback((partId: PartId, x: number, y: number) => {
    setMenu({ partId, x, y });
    setConnectionMenu(null);
    setPendingPortRef(undefined);
  }, []);

  const openConnectionMenu = useCallback(
    (connectionId: ConnectionId, x: number, y: number) => {
      setConnectionMenu({ connectionId, x, y });
      setMenu(null);
      setPendingPortRef(undefined);
    },
    [],
  );

  const handlePortClick = useCallback(
    (portRef: PortRef) => {
      const portDefinition = getDefinitionOfPort(portRef, parts);
      if (!portDefinition) return;

      if (!pendingPortRef) {
        setPendingPortRef(portRef);
        return;
      }
      if (deepEqual(pendingPortRef, portRef)) {
        setPendingPortRef(undefined);
        return;
      }
      const pendingPortDefinition = getDefinitionOfPort(pendingPortRef, parts);
      if (!pendingPortDefinition) return;

      if (portDefinition.direction === pendingPortDefinition.direction) {
        setPendingPortRef(portRef);
        return;
      }

      if (portDefinition.kind !== pendingPortDefinition.kind) return;

      const sourceRef =
        pendingPortDefinition.direction === "output" ? pendingPortRef : portRef;
      const targetRef =
        pendingPortDefinition.direction === "output" ? portRef : pendingPortRef;
      addConnection(sourceRef, targetRef);
      setPendingPortRef(undefined);
    },
    [pendingPortRef],
  );

  const simulationResult = currentLevel
    ? simulate(currentLevel.simulationInput, currentLevel)
    : undefined;

  // Zustand is the single source of truth for positions.
  // Nodes and edges are derived purely from store state on every render —
  // no separate RF state, no sync effects, no position divergence possible.
  const nodes: PartNodeType[] = useMemo(
    () =>
      parts.flatMap((part) => {
        const data = buildNodeData(
          part,
          pendingPortRef,
          parts,
          connections,
          openMenu,
          handlePortClick,
          movePort,
          part.id === menu?.partId,
          currentLevelDefinition,
          currentTime,
          simulationResult,
        );
        if (!data) return [];
        return [
          {
            id: part.id,
            type: "part",
            position: part.position,
            data: data,
          },
        ];
      }),
    [
      parts,
      pendingPortRef,
      connections,
      openMenu,
      handlePortClick,
      movePort,
      menu,
      currentTime,
      simulationResult,
    ],
  );

  const edges: Edge[] = useMemo(
    () =>
      connections.map((connection) =>
        buildEdge(
          connection,
          connection.id === connectionMenu?.connectionId,
          parts,
        ),
      ),
    [connections, parts, connectionMenu],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<PartNodeType>[]) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          // Write every drag tick — Zustand is authoritative for positions
          movePart(toPartId(change.id), change.position);
        }
        if (change.type === "remove") {
          deletePart(toPartId(change.id));
          setPendingPortRef(undefined);
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
        if (change.type === "remove")
          deleteConnection(toConnectionId(change.id));
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
      const partDefinitionId = e.dataTransfer.getData(
        "application/x-part-type",
      ) as PartDefinitionId;
      if (
        !partDefinitionId ||
        !partDefinitions.some(
          (definition) => definition.id === partDefinitionId,
        )
      )
        return;
      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addPart(partDefinitionId, {
        x: flowPosition.x,
        y: flowPosition.y,
      });
    },
    [addPart, screenToFlowPosition],
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setConnectionMenu(null);
    setPendingPortRef(undefined);
  }, []);

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      {pendingPortRef && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div
            className={`flex items-center gap-2 rounded-full bg-slate-800/95 border shadow-lg px-4 py-1.5 text-xs font-medium`}
            style={{
              color: connectableColor,
              borderColor: connectableColor,
              boxShadow: `0 0 3px ${connectableColor}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: connectableColor }}
            />
            Click a highlighted port to connect, or click canvas to cancel
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
          openConnectionMenu(
            toConnectionId(edge.id),
            event.clientX,
            event.clientY,
          )
        }
        nodesConnectable={false}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Controls />
      </ReactFlow>

      {menu && (
        <PartContextMenu
          menu={menu}
          onDelete={(id) => {
            deletePart(id);
            setPendingPortRef(undefined);
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
