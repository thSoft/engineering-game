import { Boxes } from "lucide-react";
import { useState } from "react";
import { PartDefinitionId } from "../engine/parts.ts";
import { getPartDefinitionById } from "../parts/partDefinitions.ts";
import { addPart } from "../store/gameStore.ts";
import { getColorStyle } from "./utils.tsx";

interface Props {
  availableParts: PartDefinitionId[];
}

export default function PartPalette({ availableParts }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleClick = (definitionId: PartDefinitionId) => {
    addPart(definitionId, {
      x: 180 + Math.random() * 160,
      y: 80 + Math.random() * 240,
    });
  };

  const handleDragStart = (e: React.DragEvent, type: PartDefinitionId) => {
    e.dataTransfer.setData("application/x-part-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    availableParts.length > 0 && (
      <div className={`part-palette${paletteOpen ? " part-palette-open" : ""}`}>
        {/* Collapse toggle */}
        <button
          onClick={() => setPaletteOpen((v) => !v)}
          aria-label={paletteOpen ? "Collapse parts panel" : "Expand parts panel"}
          className="part-palette-toggle"
          title="Parts"
        >
          <Boxes size={16} />
          {paletteOpen && <p className="part-palette-heading">Parts</p>}
        </button>
        {paletteOpen && (
          <div className="part-palette-content">
            <div className="part-palette-list">
              {availableParts.map((id) => {
                const { label, color, description } = getPartDefinitionById(id);
                const colorStyle = getColorStyle(color);

                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onClick={() => handleClick(id)}
                    className="part-palette-item"
                    title={`Click or drag to add ${label}`}
                    style={colorStyle}
                  >
                    <div className="part-palette-item-heading">
                      {/* TODO render part in small non-interactively */}
                      <span className="part-palette-item-label">{label}</span>
                    </div>
                    {description && (
                      <span className="part-palette-item-description">{description}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="part-palette-footer">
              <p className="part-palette-footer-text">Click or drag onto canvas to add.</p>
            </div>
          </div>
        )}
      </div>
    )
  );
}
