import { ReactFlowProvider } from "@xyflow/react";
import { evaluateTestCase, getLevelDefinitionById, LevelDefinitionId } from "../engine/levels";
import { getLevelStateByDefinitionId, useGameStore } from "../store/gameStore";
import GoalView from "./GoalView";
import Workbench from "./Workbench.tsx";
import { LevelHeader } from "./LevelHeader.tsx";
import PartPalette from "./PartPalette";
import { SimulationTimeline } from "./SimulationTimeline";
import SuccessView from "./SuccessView";
import TestView from "./TestView";

interface Props {
  levelDefinitionId: LevelDefinitionId;
}

function Level({ levelDefinitionId }: Props) {
  const setCurrentTime = useGameStore((s) => s.setCurrentTime);
  const setLevelPhase = useGameStore((s) => s.setLevelPhase);
  const loadLevel = useGameStore((s) => s.loadLevel);
  const levelState = useGameStore((s) => getLevelStateByDefinitionId(s, levelDefinitionId));
  const parts = levelState?.parts ?? [];
  const levelDefinition = getLevelDefinitionById(levelDefinitionId);
  if (!levelState || !levelDefinition) return null;
  const testCaseResult = evaluateTestCase(levelDefinition.testCase, levelState);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      <GoalView levelDefinition={levelDefinition} levelState={levelState} />
      <SuccessView levelDefinition={levelDefinition} levelState={levelState} />

      {/* ── Header ── */}
      <LevelHeader
        levelDefinition={levelDefinition}
        levelState={levelState}
        loadLevel={loadLevel}
        setLevelPhase={setLevelPhase}
      />

      {/* ── Body ── */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left panel: Part palette */}
        <PartPalette availableParts={levelDefinition?.availableParts} />

        {/* Graph editor */}
        <ReactFlowProvider>
          <Workbench levelState={levelState} levelDefinition={levelDefinition} />
        </ReactFlowProvider>

        {/* Right panel: Status view */}
        {levelState && levelDefinition && testCaseResult && (
          <TestView
            levelState={levelState}
            levelDefinition={levelDefinition}
            testCaseResult={testCaseResult}
          />
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
