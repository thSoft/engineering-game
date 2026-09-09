import { action } from "../../engine/simulation.ts";
import { assertion, defineLevel } from "../../engine/levels.ts";
import { Plug } from "../../parts/plug/plug.tsx";
import { Switch } from "../../parts/switch/switch.tsx";
import { Lightbulb } from "../../parts/lightbulb/lightbulb.tsx";

export const plug = Plug.instance("plug-0", { x: -150, y: 4 });
export const switchPart = Switch.instance("switch-0", { x: 5.5, y: 4 });
export const lightbulb = Lightbulb.instance("lightbulb-0", { x: 150, y: -42 });

export const DeskLamp = defineLevel("deskLamp", {
  label: "Desk Lamp",
  availableParts: [],
  fixedParts: [plug, switchPart, lightbulb],
  exposedPorts: [plug.in("plugged"), switchPart.in("toggle"), lightbulb.out("lit")],
  testCase: {
    input: {
      startTime: 0,
      actions: [
        action(1, plug.in("plugged"), true),
        action(2, switchPart.in("toggle"), true),
        action(3, switchPart.in("toggle"), false),
      ],
    },
    assertions: [
      assertion(2, lightbulb.out("lit"), true),
      assertion(3, lightbulb.out("lit"), false),
    ],
  },
  userName: "Ada",
  userNeedQuote: "I can't read when it's dark.",
  successQuote: "Nothing is better than reading my favorite book before bed.",
});
