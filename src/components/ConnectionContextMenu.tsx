import { Trash2 } from "lucide-react";
import type { ConnectionId } from "../engine/connections";
import { useGameStore } from "../store/gameStore.ts";

interface Props {
  connectionId: ConnectionId;
}

export default function ConnectionContextMenu({ connectionId }: Props) {
  return (
    <div role="menu">
      <button
        role="menuitem"
        onClick={() => useGameStore.getState().deleteConnection(connectionId)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-rose-400 transition hover:bg-rose-500/10"
      >
        <Trash2 size={14} className="shrink-0" />
        <span className="text-xs font-medium">Delete connection</span>
      </button>
    </div>
  );
}
