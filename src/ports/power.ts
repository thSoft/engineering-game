import { PortType } from "../engine/parts.ts";
import z from "zod";

export const Power = z.boolean();

export type Power = z.infer<typeof Power>;

export const power: PortType<boolean> = {
  schema: Power,
  renderConnection: (value, selected, selectedColor) => {
    const glowColor = "yellow";
    const cableColor = "#8CA0B3";
    const color = selected ? selectedColor : cableColor;
    return [
      {
        strokeWidth: 4,
        stroke: color,
        filter: value ? `drop-shadow(0px 0px 2px ${glowColor})` : undefined,
      },
    ];
  },
};
