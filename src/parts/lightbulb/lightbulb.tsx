import z from "zod";
import { definePart } from "../../engine/parts.tsx";
import { LightbulbView } from "./LightbulbView.tsx";

export const Lightbulb = definePart({
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
  color: "#fdc700",
  description: "Lights up on power",
  render: ({ powerIn }, _, { lit }) => {
    return <LightbulbView powerIn={powerIn} lit={lit} />;
  },
  compute: ({ powerIn }) => ({
    lit: powerIn,
  }),
});
