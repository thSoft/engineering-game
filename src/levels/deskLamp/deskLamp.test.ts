import { test } from "vitest";
import { connect } from "../../engine/connections.ts";
import { DeskLamp, lightbulb, plug, switchPart } from "./deskLamp.ts";
import { testLevel } from "../../engine/testing.ts";

test("Desk lamp", () => {
  testLevel(DeskLamp, [], false);
  testLevel(DeskLamp, [connect(plug.out("powerOut"), switchPart.in("powerIn"))], false);
  testLevel(
    DeskLamp,
    [
      connect(plug.out("powerOut"), switchPart.in("powerIn")),
      connect(switchPart.out("powerOut"), lightbulb.in("powerIn")),
    ],
    true,
  );
});
