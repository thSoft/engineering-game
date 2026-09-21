import { assertion, defineLevel } from "../../engine/levels.ts";
import { createPartInstance, inPort, outPort } from "../../engine/parts.tsx";
import { action } from "../../engine/simulation.ts";

export const plug = createPartInstance("Plug", "plug-0", { x: -150, y: 4 });
export const switchPart = createPartInstance("Switch", "switch-0", { x: 5.5, y: 4 });
export const lightbulb = createPartInstance("Lightbulb", "lightbulb-0", { x: 150, y: -42 });

export const DeskLamp = defineLevel("deskLamp", {
  label: "Desk Lamp",
  availableParts: [],
  fixedParts: [plug, switchPart, lightbulb],
  exposedPorts: [inPort(plug, "plugged"), inPort(switchPart, "toggle"), outPort(lightbulb, "lit")],
  testCase: {
    input: {
      startTime: 0,
      actions: [
        action(1, inPort(plug, "plugged"), true),
        action(2, inPort(switchPart, "toggle"), true),
        action(3, inPort(switchPart, "toggle"), false),
      ],
    },
    assertions: [
      assertion(2, outPort(lightbulb, "lit"), true),
      assertion(3, outPort(lightbulb, "lit"), false),
    ],
  },
  userName: "Ada",
  userNeedQuote: "I can't read when it's dark.",
  successQuote: "Nothing is better than reading my favorite book before bed.",
});
