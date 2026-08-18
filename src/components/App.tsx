import { ReactFlowProvider } from "@xyflow/react";
import { ConfigProvider, Flex, theme } from "antd";
import { Boxes, Cpu } from "lucide-react";
import { useState } from "react";
import { evaluateTestCase, getLevelDefinitionById } from "../engine/levels";
import { useGameStore } from "../store/gameStore";
import GraphEditor from "./GraphEditor";
import LevelDashboard from "./LevelDashboard";
import LevelStatusView from "./LevelStatusView";
import PartPalette from "./PartPalette";
import { SimulationTimeline } from "./SimulationTimeline";

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const currentLevelDefinitionId = useGameStore((s) => s.currentLevelDefinitionId);
  const levelState = useGameStore((s) => s.levelStates[currentLevelDefinitionId]);
  const setCurrentTime = useGameStore((s) => s.setCurrentTime);
  const parts = levelState?.parts ?? [];
  const currentLevelDefinition = getLevelDefinitionById(currentLevelDefinitionId);
  const testCaseResult =
    levelState && currentLevelDefinition
      ? evaluateTestCase(currentLevelDefinition.testCase, levelState)
      : undefined;

  return (
    <ConfigProvider theme={{ algorithm: [theme.darkAlgorithm] }}>
      <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {/* ── Header ── */}
        <header style={{ padding: 12 }}>
          <Flex style={{ float: "left" }} gap={8} align="center">
            <Cpu size={18} className="text-emerald-400 shrink-0" />
            <h1 className="text-slate-400">Engineering Game</h1>
          </Flex>
          <div style={{ float: "right" }}>
            {levelState && <LevelStatusView levelStatus={levelState.levelStatus} />}
          </div>
          <div style={{ margin: "0 auto", width: "400px", textAlign: "center" }}>
            {currentLevelDefinition && <h2 className="truncate">{currentLevelDefinition.label}</h2>}
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* ── Left panel: Parts palette ── */}

          {/* Left panel: Part palette */}
          <div
            className={`sm:flex flex-col shrink-0 border-r border-slate-700 bg-slate-800/50 overflow-hidden ${paletteOpen ? "w-48" : "w-10"}`}
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
          <div style={{ width: 240, padding: 0 }}>
            <LevelDashboard levelState={levelState} testCaseResult={testCaseResult} />
          </div>
        </main>

        {/* ── Footer ── */}
        <footer>
          {levelState && currentLevelDefinition && (
            <SimulationTimeline
              levelDefinition={currentLevelDefinition}
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
