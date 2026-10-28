import { PortType } from "../engine/parts.ts";
import z from "zod";
import { workbenchBackgroundColor } from "../components/designTokens.tsx";

export const Air = z.boolean();

export type Air = z.infer<typeof Air>;

export const air: PortType<boolean> = {
  schema: Air,
  renderConnection: (value, selected, selectedColor) => {
    const ductColor = "#8CA0B3";
    const color = selected ? selectedColor : ductColor;

    return [
      {
        strokeWidth: 24,
        stroke: color,
      },
      {
        strokeWidth: 20,
        stroke: value ? airColor : workbenchBackgroundColor,
      },
    ];
  },
};

export const airColor = "lightblue";
