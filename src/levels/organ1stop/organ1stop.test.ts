import { test } from "vitest";
import { createPartInstance, inPort, outPort } from "../../engine/parts.ts";
import { testLevel } from "../../engine/testing.ts";
import { Organ1Stop, organKeyboard, windSupply } from "./organ1stop.ts";
import { actionTriggeredPorts } from "../../parts/organKeyboard/organKeyboard.tsx";
import _ from "lodash";
import { airOutPorts, valvePorts } from "../../parts/windchest/windchest.tsx";
import { connect } from "../../engine/connections.ts";
import { keys } from "../../engine/utils.ts";
import { pitches } from "../../parts/pitches.ts";
import { frequencyToLength } from "../../parts/pipe/pipe.tsx";

test("Organ with 1 stop", () => {
  const windchest = createPartInstance("Windchest", "windchest", { x: 0, y: 0 });
  const organKeyboardToWindchestConnections = _.zip(
    keys(actionTriggeredPorts),
    keys(valvePorts),
  ).map(([actionTriggeredPortId, valvePortId]) =>
    connect(outPort(organKeyboard, actionTriggeredPortId!), inPort(windchest, valvePortId!)),
  );
  const pipes = Object.values(pitches).map((pitch, index) =>
    createPartInstance("Pipe", `pipe_${pitch.name}`, { x: index * 100, y: 100 }, pitch.name, {
      length: frequencyToLength(pitch.frequency),
    }),
  );
  const windchestToPipesConnections = _.zip(keys(airOutPorts), pipes).map(([airOutPortId, pipe]) =>
    connect(outPort(windchest, airOutPortId!), inPort(pipe!, "air")),
  );
  const windSupplyToWindchestConnection = connect(
    outPort(windSupply, "airOut"),
    inPort(windchest, "airIn"),
  );

  testLevel(Organ1Stop, [windchest], [], false);
  testLevel(Organ1Stop, [windchest], organKeyboardToWindchestConnections, false);
  testLevel(
    Organ1Stop,
    [windchest, ...pipes],
    [...organKeyboardToWindchestConnections, ...windchestToPipesConnections],
    false,
  );
  testLevel(
    Organ1Stop,
    [windchest, ...pipes],
    [
      ...organKeyboardToWindchestConnections,
      ...windchestToPipesConnections,
      windSupplyToWindchestConnection,
    ],
    true,
  );
});
