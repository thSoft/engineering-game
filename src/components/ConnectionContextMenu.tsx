import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ConnectionId } from "../engine/connections";

export interface ConnectionContextMenuState {
  connectionId: ConnectionId;
  x: number;
  y: number;
}

interface Props {
  menu: ConnectionContextMenuState;
  onDelete: (connectionId: ConnectionId) => void;
  onClose: () => void;
}

export default function ConnectionContextMenu({
  menu,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handlePointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [onClose]);

  const menuWidth = 180;
  const menuHeight = 42;
  const left = Math.min(
    menu.x - menuWidth / 2,
    window.innerWidth - menuWidth - 8,
  );
  const top =
    menu.y - menuHeight - 8 < 8 ? menu.y + 8 : menu.y - menuHeight - 8;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left, top, width: menuWidth }}
      className="fixed z-50 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 py-1 text-sm shadow-2xl shadow-black/40"
    >
      <button
        role="menuitem"
        onClick={() => {
          onDelete(menu.connectionId);
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-rose-400 transition hover:bg-rose-500/10"
      >
        <Trash2 size={14} className="shrink-0" />
        <span className="text-xs font-medium">Delete connection</span>
      </button>
    </div>,
    document.body,
  );
}
