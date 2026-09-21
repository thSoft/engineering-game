import { test } from "vitest";
import { connect } from "../../engine/connections.ts";
import { inPort, outPort } from "../../engine/parts.tsx";
import { testLevel } from "../../engine/testing.ts";
import { DeskLamp, lightbulb, plug, switchPart } from "./deskLamp.ts";

test("Desk lamp", () => {
  testLevel(DeskLamp, [], false);
  testLevel(DeskLamp, [connect(outPort(plug, "powerOut"), inPort(switchPart, "powerIn"))], false);
  testLevel(
    DeskLamp,
    [
      connect(outPort(plug, "powerOut"), inPort(switchPart, "powerIn")),
      connect(outPort(switchPart, "powerOut"), inPort(lightbulb, "powerIn")),
    ],
    true,
  );
});
