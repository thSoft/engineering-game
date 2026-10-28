import { definePart } from "../../engine/parts.ts";
import { WindSupplyView } from "./WindSupplyView.tsx";
import { mechanical } from "../../ports/mechanical.ts";
import { air } from "../../ports/air.ts";

export const WindSupply = definePart({
  label: "Wind Supply",
  parameters: {},
  inputPorts: {
    toggle: {
      label: "toggle",
      kind: "state",
      type: mechanical,
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Turn on ${partLabel}` : `Turn off ${partLabel}`,
    },
  },
  outputPorts: {
    airOut: {
      label: "air out",
      kind: "flow",
      type: air,
      defaultValue: false,
    },
  },
  color: "#00adee",
  description: "Provides air flow",
  render: ({ toggle }, _, { airOut }) => {
    return <WindSupplyView toggle={toggle} airOut={airOut} />;
  },
  compute: ({ toggle }) => ({
    airOut: toggle,
  }),
});
