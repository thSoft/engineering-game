import { Lightbulb as LightbulbIcon } from "lucide-react";
import { LightbulbView } from "./LightbulbView.tsx";
import { definePart } from "../../engine/parts.tsx";
import z from "zod";

export const Lightbulb = definePart("lightbulb", {
  label: "Lightbulb",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
    },
  },
  outputPorts: {
    lit: {
      label: "lit",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      renderAssertion: (expectedValue, partLabel) =>
        expectedValue ? `${partLabel} should be lit` : `${partLabel} should not be lit`,
    },
  },
  icon: LightbulbIcon,
  color: "#fdc700",
  description: "Lights up on power",
  render: ({ powerIn }, _, { lit }) => {
    return <LightbulbView powerIn={powerIn} lit={lit} />;
  },
  compute: ({ powerIn }) => ({
    lit: powerIn,
  }),
});
