import { Box } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "reactflow";
import type { AnyPartParameters, PartId, PartType } from "../engine/parts";
import type {
  AnyPortState,
  PortId,
  PortKind,
  PortPosition,
  PortSide,
} from "../engine/ports";
import { selectedColor } from "./GraphEditor";
import { getColorClasses, PART_DEFINITION_VISUALS } from "./PartPalette";
import {
  connectableColor,
  eventColor,
  flowOffColor,
  flowOnColor,
  stateColor,
} from "./designTokens";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export interface PortInfo {
  id: string;
  name: string;
  position: PortPosition;
  kind: PortKind;
  state: AnyPortState;
  visual: PortVisualState;
}

export interface PartNodeData {
  label: string;
  type: PartType;
  inputPorts: PortInfo[];
  outputPorts: PortInfo[];
  selected?: boolean;
  parameters?: AnyPartParameters;
  onContextMenu?: (partId: PartId, x: number, y: number) => void;
  onPortClick?: (portId: PortId) => void;
  onPortMove?: (portId: PortId, position: PortPosition) => void;
  onStateToggle?: (portId: PortId) => void;
}

// Per-visual-state styling for handles
const HANDLE_CLASSES: Record<PortVisualState, string> = {
  idle: "",
  selected: "!ring-2 !ring-white/40 !ring-offset-1 !ring-offset-slate-900",
  connectable:
    "ring-2 !ring-emerald-300/60 !ring-offset-1 !ring-offset-slate-900 animate-pulse",
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

function constrainToBorder(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): PortPosition {
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
  const nearest = Math.min(x, rect.width - x, y, rect.height - y);

  if (nearest === y)
    return { side: "top", offset: rect.width ? x / rect.width : 0.5 };
  if (nearest === rect.width - x)
    return { side: "right", offset: rect.height ? y / rect.height : 0.5 };
  if (nearest === rect.height - y)
    return { side: "bottom", offset: rect.width ? x / rect.width : 0.5 };
  if (nearest === x)
    return { side: "left", offset: rect.height ? y / rect.height : 0.5 };
  return { side: "top", offset: 0 };
}

function PartNode({ id, data }: NodeProps<PartNodeData>) {
  const {
    label,
    type,
    inputPorts,
    outputPorts,
    selected,
    parameters,
    onContextMenu,
    onPortClick,
    onPortMove,
    onStateToggle,
  } = data;
  const nodeRef = useRef<HTMLDivElement>(null);
  const draggedPort = useRef<{
    id: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const ignoreNodeClick = useRef(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const visual = PART_DEFINITION_VISUALS[type];
  const ports = [...inputPorts, ...outputPorts];

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, inputPorts, outputPorts]);

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
    onContextMenu(id, x, y);
  };

  const finishPortGesture = (portId: string, visual: PortVisualState) => {
    const drag = draggedPort.current;
    if (!drag) return;
    draggedPort.current = null;

    if (!drag.moved && drag.id === portId && visual !== "blocked") {
      onPortClick?.(portId);
    }
  };

  const handlePortPointerDown = (e: React.PointerEvent, portId: string) => {
    // Own the gesture so React Flow does not start its native drag-to-connect
    // interaction while this handle is being repositioned.
    e.preventDefault();
    e.stopPropagation();
    ignoreNodeClick.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggedPort.current = {
      id: portId,
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
    onPortMove?.(drag.id, constrainToBorder(e.clientX, e.clientY, rect));
  };

  const handlePortPointerUp = (
    e: React.PointerEvent,
    portId: string,
    visual: PortVisualState,
  ) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    ignoreNodeClick.current = true;
    finishPortGesture(portId, visual);
  };

  const handleStateToggle = (e: React.MouseEvent, portId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onStateToggle?.(portId);
  };

  const Icon = visual?.icon ?? Box;

  return (
    <div
      ref={nodeRef}
      onClick={handleNodeClick}
      className={`rounded-lg border bg-slate-800 px-3 py-2 shadow-lg min-w-[140px] cursor-pointer transition-shadow ${getColorClasses(visual?.colorName)}`}
      style={{
        boxShadow: selected ? `0 0 1px 2px ${selectedColor}` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} />
        <span className="text-sm font-semibold text-slate-100">{label}</span>
      </div>

      {ports.map((port) => {
        const direction = inputPorts.includes(port) ? "input" : "output";
        const portColor = getPortColor(port.kind, port.state.on, port.visual);
        const positionRotation =
          port.position.side === "top"
            ? 0
            : port.position.side === "right"
              ? 90
              : port.position.side === "bottom"
                ? 180
                : 270;
        const directionRotation = direction === "input" ? 180 : 0;
        return (
          <div /* Port */
            key={port.id}
            className="absolute z-10"
            style={getAnchorStyle(port.position)}
          >
            <div /* Port label */
              className={`nodrag nopan absolute flex items-center gap-1 whitespace-nowrap text-[11px] transition-colors`}
              style={{
                ...getLabelStyle(port.position.side),
                color: portColor,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                padding: "1px",
                borderRadius: "4px",
              }}
            >
              <span
                role="button"
                tabIndex={0}
                onPointerDown={(e) => handlePortPointerDown(e, port.id)}
                onPointerMove={handlePortPointerMove}
                onPointerUp={(e) =>
                  handlePortPointerUp(e, port.id, port.visual)
                }
                title={`${port.kind} port${port.kind === "flow" ? ` (${port.state.on})` : ""}`}
                className="cursor-grab active:cursor-grabbing"
              >
                {port.name}
              </span>
              {port.kind === "state" && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleStateToggle(e, port.id)}
                  className={`rounded px-1 py-px text-[9px] font-bold leading-none transition ${port.state.on ? "bg-violet-400/25 text-violet-100 ring-1 ring-violet-300/60" : "bg-slate-700 text-slate-400 ring-1 ring-slate-600"}`}
                  aria-label={`Set ${port.name} ${port.state.on ? "off" : "on"}`}
                >
                  {port.state.on ? "ON" : "OFF"}
                </button>
              )}
            </div>
            <Handle
              id={port.id}
              type={direction === "input" ? "target" : "source"}
              position={getHandlePosition(port.position.side)}
              isConnectable={false}
              onPointerDown={(e) => handlePortPointerDown(e, port.id)}
              onPointerMove={handlePortPointerMove}
              onPointerUp={(e) => handlePortPointerUp(e, port.id, port.visual)}
              style={{
                left: 0,
                top: 0,
                transform: `translate(-50%, -50%) rotate(${positionRotation + directionRotation}deg)`,
                pointerEvents: "all",
              }}
              title={`${port.kind} port${port.kind === "flow" ? ` (${port.state.on ? "on" : "off"})` : ""}`}
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
