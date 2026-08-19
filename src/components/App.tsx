import { ReactFlowProvider } from "@xyflow/react";
import { Button, ConfigProvider, Flex, theme } from "antd";
import { Boxes, Cpu, Info } from "lucide-react";
import { useState } from "react";
import { evaluateTestCase, getLevelDefinitionById } from "../engine/levels";
import { LevelPhase } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";
import GoalView from "./GoalView";
import GraphEditor from "./GraphEditor";
import LevelStatusView from "./LevelStatusView";
import PartPalette from "./PartPalette";
import { SimulationTimeline } from "./SimulationTimeline";
import SuccessView from "./SuccessView";
import TestView from "./TestView";
import { borderColor } from "./designTokens";

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const currentLevelDefinitionId = useGameStore((s) => s.currentLevelDefinitionId);
  const levelState = useGameStore((s) => s.levelStates[currentLevelDefinitionId]);
  const setCurrentTime = useGameStore((s) => s.setCurrentTime);
  const setLevelPhase = useGameStore((s) => s.setLevelPhase);
  const parts = levelState?.parts ?? [];
  const levelDefinition = getLevelDefinitionById(currentLevelDefinitionId);
  const testCaseResult =
    levelState && levelDefinition
      ? evaluateTestCase(levelDefinition.testCase, levelState)
      : undefined;

  return (
    <ConfigProvider theme={{ algorithm: [theme.darkAlgorithm] }}>
      <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {levelDefinition && levelState && (
          <>
            <GoalView levelDefinition={levelDefinition} levelState={levelState} />
            <SuccessView levelDefinition={levelDefinition} levelState={levelState} />
          </>
        )}
        {/* ── Header ── */}
        <header style={{ padding: 8, borderBottom: `1px solid ${borderColor}` }}>
          <Flex style={{ float: "left", height: "100%" }} gap={8} align="center">
            <Cpu size={18} className="text-emerald-400 shrink-0" />
            <h1 className="text-slate-400">Engineering Game</h1>
          </Flex>
          <Flex style={{ float: "right", height: "100%" }} align="center">
            {levelState && <LevelStatusView levelStatus={levelState.levelStatus} />}
          </Flex>
          {levelDefinition && (
            <Flex
              gap={8}
              justify="center"
              align="center"
              style={{ margin: "0 auto", width: "400px" }}
            >
              <h2 className="truncate">{levelDefinition.label}</h2>
              <Button
                onClick={() => setLevelPhase(LevelPhase.GOAL)}
                icon={<Info />}
                variant="text"
              />
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
              <GraphEditor />
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
    </ConfigProvider>
  );
}

export default App;
