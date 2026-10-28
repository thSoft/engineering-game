import { definePart } from "../../engine/parts.ts";
import { LightbulbView } from "./LightbulbView.tsx";
import { power } from "../../ports/power.ts";

export const Lightbulb = definePart({
  label: "Lightbulb",
  parameters: {},
  inputPorts: {
    powerIn: {
      label: "power in",
      kind: "flow",
      type: power,
      defaultValue: false,
    },
  },
  outputPorts: {
    lit: {
      label: "lit",
      kind: "flow",
      type: power,
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
