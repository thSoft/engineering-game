import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LevelDefinition } from "../engine/levels";
import { PartId } from "../engine/parts";

export interface ContextMenuState {
  partId: PartId;
  x: number;
  y: number;
}

interface Props {
  menu: ContextMenuState;
  onDelete: (partId: PartId) => void;
  onClose: () => void;
  levelDefinition: LevelDefinition | undefined;
}

export default function PartContextMenu({ menu, onDelete, onClose, levelDefinition }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const menuWidth = 180;
  const menuHeight = 42;
  const vw = window.innerWidth;
  const left = Math.min(menu.x - menuWidth / 2, vw - menuWidth - 8);
  const top =
    menu.y - menuHeight - 8 < 8
      ? menu.y + 8 // flip below if too close to top
      : menu.y - menuHeight - 8;

  const disabled = levelDefinition?.fixedParts?.some((fixedPart) => fixedPart.id === menu.partId);
  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left, top, width: menuWidth }}
      className="fixed z-50 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl shadow-black/40 py-1 text-sm overflow-hidden"
    >
      {disabled ? (
        <div className="text-xs font-medium text-gray-400 px-3">Can't delete fixed part</div>
      ) : (
        <button
          role="menuitem"
          onClick={() => {
            onDelete(menu.partId);
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition text-left"
        >
          <Trash2 size={14} className="shrink-0" />
          <span className="text-xs font-medium">Delete part</span>
        </button>
      )}
    </div>,
    document.body,
  );
}
