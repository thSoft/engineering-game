import { Boxes } from "lucide-react";
import { useState } from "react";
import { PartDefinition, PartDefinitionId } from "../engine/parts";
import { useGameStore } from "../store/gameStore";
import { borderColor } from "./designTokens";
import { getColorStyle } from "./utils.tsx";

interface Props {
  onAdd?: () => void;
  availableParts?: PartDefinition<any, any, any>[];
}

export default function PartPalette({ onAdd, availableParts = [] }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const addPart = useGameStore((s) => s.addPart);

  const handleClick = (definitionId: PartDefinitionId) => {
    addPart(definitionId, {
      x: 180 + Math.random() * 160,
      y: 80 + Math.random() * 240,
    });
    onAdd?.();
  };

  const handleDragStart = (e: React.DragEvent, type: PartDefinitionId) => {
    e.dataTransfer.setData("application/x-part-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    availableParts.length > 0 && (
      <div
        className={`sm:flex flex-col shrink-0 border-r border-slate-700 overflow-hidden ${paletteOpen ? "w-48" : "w-10"}`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setPaletteOpen((v) => !v)}
          aria-label={paletteOpen ? "Collapse parts panel" : "Expand parts panel"}
          className="flex items-center justify-center h-10 w-full shrink-0 border-b border-slate-700/60 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition"
          title="Parts"
        >
          <Boxes size={16} />
        </button>
        {paletteOpen && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: borderColor }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Parts
              </p>
            </div>

            <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
              {availableParts.map(({ id, label, icon, color, description }) => {
                const Icon = icon;
                const colorStyle = getColorStyle(color);

                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onClick={() => handleClick(id)}
                    className={`flex flex-col gap-0.5 rounded-lg border px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition`}
                    title={`Click or drag to add ${label}`}
                    style={colorStyle}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      <span className="text-xs font-semibold text-slate-200">{label}</span>
                    </div>
                    {description && (
                      <span className="text-[10px] text-slate-500 leading-tight pl-5">
                        {description}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-slate-700/60">
              <p className="text-[10px] text-slate-600 leading-tight">
                Click or drag onto canvas to add.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  );
}
