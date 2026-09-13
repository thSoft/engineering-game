import { defineLevel } from "../../engine/levels.ts";
import { Pipe } from "../../parts/pipe/pipe.tsx";

export const Organ1Stop = defineLevel("organ1Stop", {
  label: "Organ with 1 Stop",
  availableParts: [Pipe],
  fixedParts: [],
  exposedPorts: [],
  testCase: {
    input: {
      startTime: 0,
      actions: [],
    },
    assertions: [],
  },
  userName: "Jean",
  userNeedQuote: "",
  successQuote: "",
});
