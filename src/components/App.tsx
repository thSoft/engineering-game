import { ReactFlowProvider } from "@xyflow/react";
import { Button, ConfigProvider, theme } from "antd";
import { Boxes, Check, Cpu } from "lucide-react";
import { useState } from "react";
import { evaluateTestCase, getLevelDefinitionById } from "../engine/levels";
import { useGameStore } from "../store/gameStore";
import GraphEditor from "./GraphEditor";
import PartPalette from "./PartPalette";
import { SimulationTimeline } from "./SimulationTimeline";

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const currentLevelDefinitionId = useGameStore((s) => s.currentLevelDefinitionId);
  const levelState = useGameStore((s) => s.levelStates[currentLevelDefinitionId]);
  const setCurrentTime = useGameStore((s) => s.setCurrentTime);
  const parts = levelState?.parts ?? [];

  const currentLevelDefinition = getLevelDefinitionById(currentLevelDefinitionId);
  return (
    <ConfigProvider theme={{ algorithm: [theme.darkAlgorithm] }}>
      <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center gap-3 border-b border-slate-700/80 px-4 py-3 bg-slate-800/90 backdrop-blur shrink-0 z-20">
          <Cpu size={18} className="text-emerald-400 shrink-0" />
          <h1 className="text-sm font-bold tracking-tight text-slate-100 hidden sm:block">
            Engineering Game
          </h1>
          {currentLevelDefinition && (
            <>
              {
                <>
                  <span className="text-slate-600 hidden sm:block">/</span>
                  <span className="text-sm text-slate-400 truncate">
                    {currentLevelDefinition.label}
                  </span>
                </>
              }
              {levelState && (
                <Button
                  onClick={() => {
                    const result = evaluateTestCase(currentLevelDefinition.testCase, levelState);
                    alert(result.success ? "PASS" : "FAIL");
                  }}
                >
                  <Check size={14} />
                  Verify
                </Button>
              )}
            </>
          )}
        </header>

        {/* ── Body ── */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* ── Left panel: Parts palette ── */}

          {/* Desktop sidebar */}
          <div
            className={`
          sm:flex flex-col shrink-0 border-r border-slate-700 bg-slate-800/50
          transition-all duration-200 overflow-hidden
          ${paletteOpen ? "w-48" : "w-10"}
        `}
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

          {/* ── Canvas ── */}
          <div className="flex-1 relative min-w-0">
            <ReactFlowProvider>
              <GraphEditor />
            </ReactFlowProvider>
          </div>
        </main>
        <footer>
          {levelState && (
            <SimulationTimeline
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
