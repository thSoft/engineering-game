import {
  Lightbulb,
  Plus,
  ToggleRight,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { partDefinitions, type PartType } from "../engine/parts";
import { useGameStore } from "../store/gameStore";

const partPalette: { type: PartType; label: string }[] = Object.entries(
  partDefinitions,
).map(([type, definition]) => ({
  type: type as PartType,
  label: definition.label,
}));

type PartDefinitionVisual = {
  icon: LucideIcon;
  color: string;
  description: string;
};

const PART_DEFINITION_VISUALS: Record<PartType, PartDefinitionVisual> = {
  POWER_SOURCE: {
    icon: Zap,
    color:
      "text-amber-400 bg-amber-400/10 border-amber-500/30 hover:border-amber-400/60",
    description: "Emits power",
  },
  SWITCH: {
    icon: ToggleRight,
    color:
      "text-sky-400 bg-sky-400/10 border-sky-500/30 hover:border-sky-400/60",
    description: "Toggles power flow",
  },
  LIGHT_BULB: {
    icon: Lightbulb,
    color:
      "text-yellow-400 bg-yellow-400/10 border-yellow-500/30 hover:border-yellow-400/60",
    description: "Lights up on power",
  },
};

interface Props {
  onAdd?: () => void;
}

export default function PartPalette({ onAdd }: Props) {
  const addPart = useGameStore((s) => s.addPart);

  const handleClick = (type: PartType) => {
    addPart(type, {
      x: 180 + Math.random() * 160,
      y: 80 + Math.random() * 240,
    });
    onAdd?.();
  };

  const handleDragStart = (e: React.DragEvent, type: PartType) => {
    e.dataTransfer.setData("application/x-part-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-slate-700/60">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Parts
        </p>
      </div>

      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        {partPalette.map(({ type, label }) => {
          const Icon = PART_DEFINITION_VISUALS[type]?.icon ?? Plus;
          const color =
            PART_DEFINITION_VISUALS[type]?.color ??
            "text-slate-400 bg-slate-700/40 border-slate-600/40 hover:border-slate-500/60";
          const desc = PART_DEFINITION_VISUALS[type]?.description ?? "";

          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              onClick={() => handleClick(type)}
              className={`flex flex-col gap-0.5 rounded-lg border px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition ${color}`}
              title={`Click or drag to add ${label}`}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} />
                <span className="text-xs font-semibold text-slate-200">
                  {label}
                </span>
              </div>
              {desc && (
                <span className="text-[10px] text-slate-500 leading-tight pl-5">
                  {desc}
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
  );
}
