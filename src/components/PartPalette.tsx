import {
  Lightbulb as LightbulbIcon,
  Plug as PlugIcon,
  Plus,
  ToggleRight,
  type LucideIcon,
} from "lucide-react";
import { Lightbulb, PartDefinitionId, partDefinitions, Plug, Switch } from "../engine/parts";
import { useGameStore } from "../store/gameStore";
import { borderColor } from "./designTokens";

type PartDefinitionVisual = {
  icon: LucideIcon;
  color: string;
  description: string;
};

export const PART_DEFINITION_VISUALS: Record<PartDefinitionId, PartDefinitionVisual> = {
  [Plug.id]: {
    icon: PlugIcon,
    color: "#00d492",
    description: "Emits power if plugged in",
  },
  [Switch.id]: {
    icon: ToggleRight,
    color: "#00bcff",
    description: "Toggles power flow",
  },
  [Lightbulb.id]: {
    icon: LightbulbIcon,
    color: "#fdc700",
    description: "Lights up on power",
  },
};

export function getColorStyle(color?: string) {
  const realColor = color ?? "#f1f5f9";
  return {
    borderColor: `${realColor}99`,
    backgroundColor: `${color}19`,
    color: color,
  };
}

interface Props {
  onAdd?: () => void;
}

export default function PartPalette({ onAdd }: Props) {
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
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: borderColor }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Parts</p>
      </div>

      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        {partDefinitions.map(({ id, label }) => {
          const visual = PART_DEFINITION_VISUALS[id];
          const Icon = visual?.icon ?? Plus;
          const colorStyle = getColorStyle(visual?.color);
          const description = visual?.description ?? "";

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
                <span className="text-[10px] text-slate-500 leading-tight pl-5">{description}</span>
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
