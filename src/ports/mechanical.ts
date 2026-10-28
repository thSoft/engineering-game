import { PortType } from "../engine/parts.ts";
import z from "zod";

export const Mechanical = z.boolean();

export type Mechanical = z.infer<typeof Mechanical>;

export const mechanical: PortType<boolean> = {
  schema: Mechanical,
  renderConnection: (_, selected, selectedColor) => {
    const wireColor = "#c9a450";
    const color = selected ? selectedColor : wireColor;
    return [
      {
        strokeWidth: 6,
        stroke: color,
      },
    ];
  },
};
