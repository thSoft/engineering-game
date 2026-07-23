import { Lightbulb, ToggleRight, Zap, type LucideIcon } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "reactflow";
import type {
  AnyPartState,
  PartType,
  PortKind,
  PortPosition,
  PortSide,
  SwitchState,
} from "../engine/types";
import { selectedColor } from "./GraphEditor";

export type PortVisualState = "idle" | "selected" | "connectable" | "blocked";

export interface PortInfo {
  id: string;
  name: string;
  position: PortPosition;
  kind: PortKind;
  stateValue?: boolean;
  flowState?: boolean;
  visual: PortVisualState;
}

export interface PartNodeData {
  label: string;
  type: PartType;
  inputPorts: PortInfo[];
  outputPorts: PortInfo[];
  selected?: boolean;
  state?: AnyPartState;
  onContextMenu?: (partId: string, x: number, y: number) => void;
  onPortClick?: (portId: string) => void;
  onPortMove?: (portId: string, position: PortPosition) => void;
  onStateToggle?: (portId: string) => void;
}

interface PartStatusVisual {
  label: string;
  className: string;
}

interface PartVisualInfo {
  Icon: LucideIcon;
  iconClassName: string;
  accent: (state?: AnyPartState) => string;
  status: (state?: AnyPartState) => PartStatusVisual | null;
}

const PART_VISUALS: Record<PartType, PartVisualInfo> = {
  POWER_SOURCE: {
    Icon: Zap,
    iconClassName: "text-amber-400",
    accent: () => "border-amber-500/50 shadow-amber-500/10",
    status: () => null,
  },
  SWITCH: {
    Icon: ToggleRight,
    iconClassName: "text-sky-400",
    accent: () => "border-sky-500/50 shadow-sky-500/10",
    status: (state) => ({
      label: (state as SwitchState | undefined)?.on ? "ON" : "OFF",
      className: "text-slate-400",
    }),
  },
  LIGHT_BULB: {
    Icon: Lightbulb,
    iconClassName: "text-yellow-400",
    accent: () => "border-slate-600/50 shadow-slate-900/20",
    status: () => null,
  },
};

// Per-visual-state styling for handles
const HANDLE_CLASSES: Record<PortVisualState, string> = {
  idle: "!w-3 !h-3 !border-2 !border-slate-900 transition-all",
  selected:
    "!w-4 !h-4 !border-2 !border-white !ring-2 !ring-white/40 !ring-offset-1 !ring-offset-slate-900 transition-all",
  connectable:
    "!w-3.5 !h-3.5 !border-2 !border-slate-900 !ring-2 !ring-emerald-300/60 !ring-offset-1 !ring-offset-slate-900 transition-all animate-pulse",
  blocked: "!w-3 !h-3 !border-2 !border-slate-900 !opacity-30 transition-all",
};

export const stateColor = "#A78BFA";
export const eventColor = "#FB923C";
export const flowOffColor = "#8CA0B3";
export const flowOnColor = "yellow";

export function getPortColor(
  portKind: PortKind,
  portFlowState: boolean | undefined,
  visual: PortVisualState,
): string {
  if (visual === "selected") return selectedColor;
  if (visual === "blocked") return "#334155";
  if (visual === "connectable") return "#6ee7b7";
  if (portKind === "state") return stateColor;
  if (portKind === "event") return eventColor;
  return portFlowState ? flowOnColor : flowOffColor;
}

function handlePosition(side: PortSide): Position {
  return {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
  }[side];
}

function anchorStyle({ side, offset }: PortPosition): React.CSSProperties {
  const value = `${offset * 100}%`;
  if (side === "top") return { left: value, top: 0 };
  if (side === "right") return { left: "100%", top: value };
  if (side === "bottom") return { left: value, top: "100%" };
  return { left: 0, top: value };
}

function labelStyle(side: PortSide): React.CSSProperties {
  if (side === "top")
    return {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)",
    };
  if (side === "right")
    return {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)",
    };
  if (side === "bottom")
    return {
      left: "50%",
      top: "calc(100% + 8px)",
      transform: "translateX(-50%)",
    };
  return {
    right: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)",
  };
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
  return { side: "left", offset: rect.height ? y / rect.height : 0.5 };
}

function PartNode({ id, data }: NodeProps<PartNodeData>) {
  const {
    label,
    type,
    inputPorts,
    outputPorts,
    selected,
    state,
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
  const visual = PART_VISUALS[type];
  const accent = visual.accent(state);
  const status = visual.status(state);
  const { Icon } = visual;
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

  return (
    <div
      ref={nodeRef}
      onClick={handleNodeClick}
      className={`rounded-lg border bg-slate-800 px-3 py-2 shadow-lg min-w-[140px] cursor-pointer transition-shadow ${accent}`}
      style={{
        boxShadow: selected ? `0 0 1px 2px ${selectedColor}` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={visual.iconClassName} />
        <span className="text-sm font-semibold text-slate-100">{label}</span>
      </div>

      {status && (
        <div className={`text-[11px] mb-1 ${status.className}`}>
          {status.label}
        </div>
      )}

      {ports.map((port) => {
        const direction = inputPorts.includes(port) ? "input" : "output";
        const portColor = getPortColor(port.kind, port.flowState, port.visual);
        return (
          <div
            key={port.id}
            className="absolute z-10 h-0 w-0"
            style={anchorStyle(port.position)}
          >
            <div
              className={`nodrag nopan absolute flex items-center gap-1 whitespace-nowrap text-[11px] transition-colors`}
              style={{
                ...labelStyle(port.position.side),
                pointerEvents: "all",
                color: portColor,
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
                title={`${port.kind} port${port.kind === "flow" ? ` (${port.flowState})` : ""}`}
                className="cursor-grab active:cursor-grabbing"
              >
                {port.name}
              </span>
              {port.kind === "state" && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleStateToggle(e, port.id)}
                  className={`rounded px-1 py-px text-[9px] font-bold leading-none transition ${port.stateValue ? "bg-violet-400/25 text-violet-100 ring-1 ring-violet-300/60" : "bg-slate-700 text-slate-400 ring-1 ring-slate-600"}`}
                  aria-label={`Set ${port.name} ${port.stateValue ? "off" : "on"}`}
                >
                  {port.stateValue ? "ON" : "OFF"}
                </button>
              )}
            </div>
            <Handle
              id={port.id}
              type={direction === "input" ? "target" : "source"}
              position={handlePosition(port.position.side)}
              isConnectable={false}
              onPointerDown={(e) => handlePortPointerDown(e, port.id)}
              onPointerMove={handlePortPointerMove}
              onPointerUp={(e) => handlePortPointerUp(e, port.id, port.visual)}
              style={{
                left: 0,
                top: 0,
                transform: "translate(-50%, -50%)",
                pointerEvents: "all",
                backgroundColor: portColor,
              }}
              title={`${port.kind} port${port.kind === "flow" ? ` (${port.flowState ? "on" : "off"})` : ""}`}
              className={`nodrag nopan ${HANDLE_CLASSES[port.visual]} cursor-grab active:cursor-grabbing`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default memo(PartNode);
