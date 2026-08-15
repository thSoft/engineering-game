import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { Box, Eye } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type { ParameterValues, PartDefinitionId, PartId, PortInstance } from "../engine/parts";
import { deepEqual, getPortPath, PortKind, PortPosition, PortRef, PortSide } from "../engine/parts";
import { PartNodeType, selectedColor } from "./GraphEditor";
import { getColorStyle, PART_DEFINITION_VISUALS } from "./PartPalette";
import {
  connectableColor,
  eventColor,
  flowOffColor,
  flowOnColor,
  stateColor,
} from "./designTokens";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export interface PortInfo {
  instance: PortInstance;
  ref: PortRef;
  value: any;
  visual: PortVisualState;
  exposed: boolean;
  connected: boolean;
}

export type PartNodeData = {
  partId: PartId;
  label: string;
  definitionId: PartDefinitionId;
  inputPorts: PortInfo[];
  outputPorts: PortInfo[];
  selected?: boolean;
  parameters?: ParameterValues<any>;
  onContextMenu?: (partId: PartId, x: number, y: number) => void;
  onPortClick?: (portRef: PortRef) => void;
  onPortMove?: (portRef: PortRef, position: PortPosition) => void;
  onStateToggle?: (portRef: PortRef) => void;
};

// Per-visual-state styling for handles
const HANDLE_CLASSES: Record<PortVisualState, string> = {
  idle: "",
  selected: "!ring-2 !ring-white/40 !ring-offset-1 !ring-offset-slate-900",
  connectable: "ring-2 !ring-emerald-300/60 !ring-offset-1 !ring-offset-slate-900 animate-pulse",
  blocked: "!opacity-30",
};

export function getPortColor(
  portKind: PortKind,
  portFlowState: boolean | undefined,
  visual: PortVisualState,
): string {
  if (visual === "selected") return selectedColor;
  if (visual === "blocked") return "#334155";
  if (visual === "connectable") return connectableColor;
  if (portKind === "state") return stateColor;
  if (portKind === "event") return eventColor;
  return portFlowState ? flowOnColor : flowOffColor;
}

function getHandlePosition(side: PortSide): Position {
  return {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
  }[side];
}

function getAnchorStyle({ side, offset }: PortPosition): React.CSSProperties {
  const value = `${offset * 100}%`;
  if (side === "top") return { left: value, top: 0 };
  if (side === "right") return { left: "100%", top: value };
  if (side === "bottom") return { left: value, top: "100%" };
  if (side === "left") return { left: 0, top: value };
  return {};
}

function getLabelStyle(side: PortSide): React.CSSProperties {
  const padded = `calc(100% + 8px)`;
  const middle = "50%";
  const centerHorizontally = "translateX(-50%)";
  const centerVertically = "translateY(-50%)";
  if (side === "top")
    return {
      bottom: padded,
      left: middle,
      transform: centerHorizontally,
    };
  if (side === "right")
    return {
      left: padded,
      top: middle,
      transform: centerVertically,
    };
  if (side === "bottom")
    return {
      left: middle,
      top: padded,
      transform: centerHorizontally,
    };
  if (side === "left")
    return {
      right: padded,
      top: middle,
      transform: centerVertically,
    };
  return {};
}

function constrainToBorder(clientX: number, clientY: number, rect: DOMRect): PortPosition {
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
  const nearest = Math.min(x, rect.width - x, y, rect.height - y);

  if (nearest === y) return { side: "top", offset: rect.width ? x / rect.width : 0.5 };
  if (nearest === rect.width - x)
    return { side: "right", offset: rect.height ? y / rect.height : 0.5 };
  if (nearest === rect.height - y)
    return { side: "bottom", offset: rect.width ? x / rect.width : 0.5 };
  if (nearest === x) return { side: "left", offset: rect.height ? y / rect.height : 0.5 };
  return { side: "top", offset: 0 };
}

function PartNode({ data }: NodeProps<PartNodeType>) {
  const {
    label,
    definitionId: type,
    inputPorts,
    outputPorts,
    selected,
    onContextMenu,
    onPortClick,
    onPortMove,
    onStateToggle,
  } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const draggedPort = useRef<{
    portRef: PortRef;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const ignoreNodeClick = useRef(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const visual = PART_DEFINITION_VISUALS[type];
  const ports = [...inputPorts, ...outputPorts];

  useEffect(() => {
    updateNodeInternals(data.partId);
  }, [data.partId, updateNodeInternals, inputPorts, outputPorts]);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ignoreNodeClick.current) {
      ignoreNodeClick.current = false;
      return;
    }
    if (!onContextMenu) return;
    const rect = nodeRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top : e.clientY;
    onContextMenu(data.partId, x, y);
  };

  const finishPortGesture = (portRef: PortRef, visual: PortVisualState) => {
    const drag = draggedPort.current;
    if (!drag) return;
    draggedPort.current = null;

    if (!drag.moved && deepEqual(drag.portRef, portRef) && visual !== "blocked") {
      onPortClick?.(portRef);
    }
  };

  const handlePortPointerDown = (e: React.PointerEvent, portKey: string) => {
    // Own the gesture so React Flow does not start its native drag-to-connect
    // interaction while this handle is being repositioned.
    e.preventDefault();
    e.stopPropagation();
    ignoreNodeClick.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggedPort.current = {
      portRef: { partId: data.partId, portKey: portKey },
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePortPointerMove = (e: React.PointerEvent) => {
    const drag = draggedPort.current;
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;

    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 3) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    e.preventDefault();
    onPortMove?.(drag.portRef, constrainToBorder(e.clientX, e.clientY, rect));
  };

  const handlePortPointerUp = (
    e: React.PointerEvent,
    portRef: PortRef,
    visual: PortVisualState,
  ) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    ignoreNodeClick.current = true;
    finishPortGesture(portRef, visual);
  };

  const handleStateToggle = (e: React.MouseEvent, portRef: PortRef) => {
    e.preventDefault();
    e.stopPropagation();
    onStateToggle?.(portRef);
  };

  const Icon = visual?.icon ?? Box;

  return (
    <div
      ref={nodeRef}
      onClick={handleNodeClick}
      className={`rounded-lg border bg-slate-800 px-3 py-2 shadow-lg min-w-[140px] cursor-pointer transition-shadow`}
      style={{
        boxShadow: selected ? `0 0 1px 2px ${selectedColor}` : undefined,
        ...getColorStyle(visual?.color),
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} />
        <span className="text-sm font-semibold text-slate-100">{label}</span>
      </div>

      {ports.map((port) => {
        const portDefinition = port.instance.definition;
        const direction = inputPorts.includes(port) ? "input" : "output";
        const portColor = getPortColor(
          portDefinition.kind,
          Boolean(port.value), // TODO handle generic type
          port.visual,
        );
        const positionRotation =
          port.instance.position.side === "top"
            ? 0
            : port.instance.position.side === "right"
              ? 90
              : port.instance.position.side === "bottom"
                ? 180
                : 270;
        const directionRotation = direction === "input" ? 180 : 0;
        const portValue = port.value; // TODO handle generic type
        return (
          <div /* Port */
            key={port.instance.key}
            className="absolute z-10"
            style={getAnchorStyle(port.instance.position)}
          >
            <div /* Port label */
              className={`nodrag nopan absolute flex items-center gap-1 whitespace-nowrap text-[11px] transition-colors`}
              style={{
                ...getLabelStyle(port.instance.position.side),
                color: portColor,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                padding: "1px",
                borderRadius: "4px",
              }}
            >
              {port.exposed && <Eye size={10} />}
              <span
                role="button"
                tabIndex={0}
                onPointerDown={(e) => handlePortPointerDown(e, port.instance.key)}
                onPointerMove={handlePortPointerMove}
                onPointerUp={(e) => handlePortPointerUp(e, port.ref, port.visual)}
                title={`${portDefinition.kind} port${portDefinition.kind === "flow" ? ` (${Boolean(port.value)})` : ""}`} // TODO
                className="cursor-grab active:cursor-grabbing"
              >
                {portDefinition.label}
              </span>
              {["state", "flow"].includes(portDefinition.kind) &&
                (portDefinition.direction === "input" && !port.connected ? (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleStateToggle(e, port.ref)}
                    className={`rounded px-1 py-px text-[9px] font-bold leading-none transition ${portValue ? "bg-violet-400/25 text-violet-100 ring-1 ring-violet-300/60" : "bg-slate-700 text-slate-400 ring-1 ring-slate-600"}`}
                    aria-label={`Set ${portDefinition.label} to ${portValue ? "off" : "on"}`}
                  >
                    {portValue ? "ON" : "OFF"}
                  </button>
                ) : portValue ? (
                  "ON"
                ) : (
                  "OFF"
                ))}
            </div>
            <Handle
              id={getPortPath(port.ref)}
              type={direction === "input" ? "target" : "source"}
              position={getHandlePosition(port.instance.position.side)}
              isConnectable={false}
              onPointerDown={(e) => handlePortPointerDown(e, port.instance.key)}
              onPointerMove={handlePortPointerMove}
              onPointerUp={(e) => handlePortPointerUp(e, port.ref, port.visual)}
              style={{
                left: 0,
                top: 0,
                transform: `translate(-50%, -50%) rotate(${positionRotation + directionRotation}deg)`,
                pointerEvents: "all",
                backgroundColor: "#0a0a0a",
              }}
              title={`${portDefinition.kind} port${portDefinition.kind === "flow" ? ` (${port.value ? "on" : "off"})` : ""}`}
              className={`nodrag nopan !w-3 !h-3 !border-2 !border-slate-900 transition-all ${HANDLE_CLASSES[port.visual]} cursor-grab active:cursor-grabbing`}
            >
              <svg
                height="8px"
                width="8px"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="100,10 190,180 10,180" fill={portColor} />
              </svg>
            </Handle>
          </div>
        );
      })}
    </div>
  );
}

export default memo(PartNode);
