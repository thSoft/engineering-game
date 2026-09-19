import { defineLevel } from "../../engine/levels.ts";
import { Blower } from "../../parts/blower/blower.tsx";
import { OrganKey } from "../../parts/organKey/organKey.tsx";
import { Pipe } from "../../parts/pipe/pipe.tsx";
import { Windchest } from "../../parts/windchest/windchest.tsx";

export const Organ1Stop = defineLevel("organ1Stop", {
  label: "Organ with 1 Stop",
  availableParts: [Pipe, Blower, Windchest, OrganKey],
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
