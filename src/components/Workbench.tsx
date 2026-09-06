import {
  Controls,
  type EdgeChange,
  type NodeChange,
  NodeTypes,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState } from "react";
import {
  Connection,
  ConnectionId,
  getConnectionsWithTarget,
  toConnectionId,
} from "../engine/connections";
import { isExposed, LevelDefinition } from "../engine/levels";
import {
  deepEqual,
  getDefinitionOfPart,
  getDefinitionOfPort,
  getPortPath,
  PartDefinitionId,
  partDefinitions,
  PartInstance,
  PortDefinition,
  PortPosition,
  PortRef,
  refPort,
  toPartId,
} from "../engine/parts";
import {
  BehaviorMode,
  getPortValueAt,
  getSimulationInput,
  LevelState,
  simulate,
  SimulationResult,
} from "../engine/simulation";
import { setPortValue, useGameStore } from "../store/gameStore";
import { connectableColor, flowOffColor } from "./designTokens";
import PartNode, {
  PART_TYPE,
  type PartNodeData,
  PartNodeType,
  PortInfo,
  type PortVisualState,
} from "./PartNode";
import { getPortColor } from "./utils.tsx";
import { CONNECTION_TYPE, ConnectionEdge, ConnectionEdgeType } from "./ConnectionEdge.tsx";

const nodeTypes: NodeTypes = { [PART_TYPE]: PartNode };

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
  if (candidatePortDefinition.direction === selectedPortDefinition.direction) return "blocked";
  if (candidatePortDefinition.kind !== selectedPortDefinition.kind) return "blocked";
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
  onPortClick: (portRef: PortRef) => void,
  onPortMove: (portRef: PortRef, position: PortPosition) => void,
  levelDefinition: LevelDefinition,
  levelState: LevelState,
  simulationResult: SimulationResult | undefined,
  currentTime: number,
): PartNodeData | undefined {
  const { parts, connections } = levelState;
  const partDefinition = getDefinitionOfPart(part.id, parts);
  if (!partDefinition) return undefined;
  const createPortInfo = ([portKey, definition]: [string, PortDefinition<any>]): PortInfo => {
    const portRef = refPort(part.id, portKey);
    const value = simulationResult ? getPortValueAt(portRef, currentTime, simulationResult) : null;
    return {
      ref: portRef,
      definition,
      value,
      visual: getPortVisual(portRef, selectedPortRef, parts, connections),
      exposed: isExposed(portRef, levelDefinition),
      connected: getConnectionsWithTarget(portRef, connections).length > 0,
    };
  };
  return {
    label: partDefinition.label,
    partId: part.id,
    definitionId: partDefinition.id,
    selected: false,
    inputPorts: Object.entries(
      partDefinition.inputPorts as Record<string, PortDefinition<any>>,
    ).map((entry) => createPortInfo(entry)),
    outputPorts: Object.entries(
      partDefinition.outputPorts as Record<string, PortDefinition<any>>,
    ).map((entry) => createPortInfo(entry)),
    parameterValues: part.parameterValues,
    onPortClick,
    onPortMove,
    onStateToggle: [BehaviorMode.SANDBOX, BehaviorMode.EXPERIMENT].includes(levelState.behaviorMode)
      ? (portRef: PortRef) => {
          const value = simulationResult
            ? getPortValueAt(portRef, currentTime, simulationResult)
            : null;
          if (value === null) return;
          if (typeof value == "boolean") {
            setPortValue(portRef, !value);
          }
        }
      : undefined,
  };
}

export const selectedColor = "#ffffff";

function buildEdge(
  connection: Connection,
  selected: boolean,
  parts: PartInstance[],
  currentTime: number,
  simulationResult: SimulationResult,
): ConnectionEdgeType {
  const source = connection.source;
  const target = connection.target;
  const sourceValue = getPortValueAt(source, currentTime, simulationResult);
  const flowOn = sourceValue === true;
  const sourceDefinition = getDefinitionOfPort(source, parts);
  const color = selected
    ? selectedColor
    : source
      ? getPortColor(sourceDefinition?.kind ?? "state", "idle")
      : flowOffColor;
  return {
    id: connection.id,
    type: CONNECTION_TYPE,
    source: source.partId,
    target: target.partId,
    sourceHandle: getPortPath(source),
    targetHandle: getPortPath(target),
    selected,
    style: {
      strokeWidth: selected ? 3 : 2,
      stroke: color,
      filter: flowOn ? "drop-shadow(0px 0px 2px rgba(255, 255, 0, 1))" : undefined,
    },
    data: {
      id: connection.id,
    },
  };
}

interface Props {
  levelState: LevelState;
  levelDefinition: LevelDefinition;
}

export default function Workbench({ levelState, levelDefinition }: Props) {
  const parts = levelState?.parts ?? [];
  const connections = levelState?.connections ?? [];

  const movePart = useGameStore((s) => s.movePart);
  const movePort = useGameStore((s) => s.movePort);
  const deletePart = useGameStore((s) => s.deletePart);
  const addConnection = useGameStore((s) => s.addConnection);
  const deleteConnection = useGameStore((s) => s.deleteConnection);
  const addPart = useGameStore((s) => s.addPart);

  const [selectedConnectionId, setSelectedConnectionId] = useState<ConnectionId | undefined>(
    undefined,
  );
  const [pendingPortRef, setPendingPortRef] = useState<PortRef | undefined>(undefined);

  const handlePortClick = (portRef: PortRef) => {
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

    const sourceRef = pendingPortDefinition.direction === "output" ? pendingPortRef : portRef;
    const targetRef = pendingPortDefinition.direction === "output" ? portRef : pendingPortRef;
    addConnection(sourceRef, targetRef);
    setPendingPortRef(undefined);
  };

  const simulationInput = getSimulationInput(levelState.behaviorMode, levelState, levelDefinition);
  const overrideInitialState =
    levelState.behaviorMode == BehaviorMode.EXPERIMENT
      ? levelState.experimentData.initialState
      : undefined;
  const simulationResult = simulate(simulationInput, levelState, overrideInitialState);
  const currentTime =
    levelState.behaviorMode === BehaviorMode.EXPERIMENT ? Date.now() : levelState.currentTime;

  // Zustand is the single source of truth for positions.
  // Nodes and edges are derived purely from store state on every render —
  // no separate RF state, no sync effects, no position divergence possible.
  const nodes: PartNodeType[] = levelState
    ? parts.flatMap((part) => {
        const data = buildNodeData(
          part,
          pendingPortRef,
          handlePortClick,
          movePort,
          levelDefinition,
          levelState,
          simulationResult,
          currentTime,
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
      })
    : [];

  const edges: ConnectionEdgeType[] = connections.map((connection) =>
    buildEdge(
      connection,
      connection.id === selectedConnectionId,
      parts,
      currentTime,
      simulationResult,
    ),
  );

  const onNodesChange = (changes: NodeChange<PartNodeType>[]) => {
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
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === "remove") deleteConnection(toConnectionId(change.id));
    }
    // Same pattern: edges derive from store, no RF edge state to patch.
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const { screenToFlowPosition } = useReactFlow();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const partDefinitionId = e.dataTransfer.getData("application/x-part-type") as PartDefinitionId;
    if (
      !partDefinitionId ||
      !partDefinitions.some((definition) => definition.id === partDefinitionId)
    )
      return;
    const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addPart(partDefinitionId, {
      x: flowPosition.x,
      y: flowPosition.y,
    });
  };

  const onPaneClick = () => {
    setSelectedConnectionId(undefined);
    setPendingPortRef(undefined);
  };

  const edgeTypes = { [CONNECTION_TYPE]: ConnectionEdge };

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

      <ReactFlow<PartNodeType, ConnectionEdgeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        onEdgeClick={(_, edge) => setSelectedConnectionId(edge.data?.id)}
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
    </div>
  );
}
