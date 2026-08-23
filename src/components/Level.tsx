import { ReactFlowProvider } from "@xyflow/react";
import { Button, Flex } from "antd";
import { Boxes, ChevronLeft, Info } from "lucide-react";
import { useState } from "react";
import { evaluateTestCase, getLevelDefinitionById, LevelDefinitionId } from "../engine/levels";
import { LevelPhase } from "../engine/simulation";
import { getLevelStateByDefinitionId, useGameStore } from "../store/gameStore";
import GoalView from "./GoalView";
import GraphEditor from "./GraphEditor";
import LevelStatusView from "./LevelStatusView";
import PartPalette from "./PartPalette";
import { SimulationTimeline } from "./SimulationTimeline";
import SuccessView from "./SuccessView";
import TestView from "./TestView";
import { borderColor, headerStyle } from "./designTokens";

interface Props {
  levelDefinitionId: LevelDefinitionId;
}

function Level({ levelDefinitionId }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const setCurrentTime = useGameStore((s) => s.setCurrentTime);
  const setLevelPhase = useGameStore((s) => s.setLevelPhase);
  const loadLevel = useGameStore((s) => s.loadLevel);
  const levelState = useGameStore((s) => getLevelStateByDefinitionId(s, levelDefinitionId));
  const parts = levelState?.parts ?? [];
  const levelDefinition = getLevelDefinitionById(levelDefinitionId);
  const testCaseResult =
    levelState && levelDefinition
      ? evaluateTestCase(levelDefinition.testCase, levelState)
      : undefined;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      {levelDefinition && levelState && (
        <>
          <GoalView levelDefinition={levelDefinition} levelState={levelState} />
          <SuccessView levelDefinition={levelDefinition} levelState={levelState} />
        </>
      )}
      {/* ── Header ── */}
      <header style={headerStyle}>
        <Flex gap={8} align="center">
          <Button onClick={() => loadLevel(undefined)} icon={<ChevronLeft />}>
            Back to projects
          </Button>
        </Flex>
        <Flex style={{ position: "absolute", right: 8 }} align="center">
          {levelState && <LevelStatusView levelStatus={levelState.levelStatus} />}
        </Flex>
        {levelDefinition && (
          <Flex
            gap={8}
            justify="center"
            align="center"
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          >
            <h2>{levelDefinition.label}</h2>
            <Button onClick={() => setLevelPhase(LevelPhase.GOAL)} icon={<Info />} variant="text" />
          </Flex>
        )}
      </header>

      {/* ── Body ── */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* ── Left panel: Parts palette ── */}

        {/* Left panel: Part palette */}
        <div
          className={`sm:flex flex-col shrink-0 border-r border-slate-700 overflow-hidden ${paletteOpen ? "w-48" : "w-10"}`}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setPaletteOpen((v) => !v)}
            aria-label={paletteOpen ? "Collapse parts panel" : "Expand parts panel"}
            className="flex items-center justify-center h-10 w-full shrink-0 border-b border-slate-700/60 text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition"
            title="Parts"
          >
            <Boxes size={16} />
          </button>
          {paletteOpen && <PartPalette onAdd={() => setPaletteOpen(false)} />}
        </div>

        {/* Graph editor */}
        <div className="flex-1 relative min-w-0">
          <ReactFlowProvider>
            <GraphEditor levelDefinitionId={levelDefinitionId} />
          </ReactFlowProvider>
        </div>

        {/* Right panel: Status view */}
        {levelState && levelDefinition && testCaseResult && (
          <div
            style={{
              width: 300,
              paddingLeft: 12,
              paddingRight: 12,
              borderLeft: `1px solid ${borderColor}`,
            }}
          >
            <TestView
              levelState={levelState}
              levelDefinition={levelDefinition}
              testCaseResult={testCaseResult}
            />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer>
        {levelState && levelDefinition && (
          <SimulationTimeline
            levelDefinition={levelDefinition}
            levelState={levelState}
            setCurrentTime={setCurrentTime}
            parts={parts}
          />
        )}
      </footer>
    </div>
  );
}

export default Level;
