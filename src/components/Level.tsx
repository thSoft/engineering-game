import { ReactFlowProvider } from "@xyflow/react";
import { evaluateTestCase, LevelDefinitionId } from "../engine/levels";
import { getLevelStateByDefinitionId, useGameStore } from "../store/gameStore";
import GoalView from "./GoalView";
import Workbench from "./Workbench.tsx";
import { LevelHeader } from "./LevelHeader.tsx";
import PartPalette from "./PartPalette";
import { BehaviorView } from "./BehaviorView.tsx";
import SuccessView from "./SuccessView";
import AcceptanceView from "./AcceptanceView.tsx";
import { getLevelDefinitionById } from "../levels/levelDefinitions.ts";

interface Props {
  levelDefinitionId: LevelDefinitionId;
}

function Level({ levelDefinitionId }: Props) {
  const levelState = useGameStore((s) => getLevelStateByDefinitionId(s, levelDefinitionId));
  const levelDefinition = getLevelDefinitionById(levelDefinitionId);
  if (!levelState || !levelDefinition) return null;
  const testCaseResult = evaluateTestCase(levelDefinition.testCase, levelState);

  return (
    <div className="app-shell">
      <GoalView levelDefinition={levelDefinition} levelState={levelState} />
      <SuccessView levelDefinition={levelDefinition} levelState={levelState} />

      {/* ── Header ── */}
      <LevelHeader levelDefinition={levelDefinition} levelState={levelState} />

      {/* ── Body ── */}
      <main className="level-main">
        {/* Left panel: Part palette */}
        <PartPalette availableParts={levelDefinition.availableParts} />

        {/* Workbench */}
        <ReactFlowProvider>
          <Workbench levelState={levelState} levelDefinition={levelDefinition} />
        </ReactFlowProvider>

        {/* Right panel: Acceptance view */}
        {levelState && levelDefinition && testCaseResult && (
          <AcceptanceView
            levelState={levelState}
            levelDefinition={levelDefinition}
            testCaseResult={testCaseResult}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer>
        {levelState && levelDefinition && (
          <BehaviorView levelDefinition={levelDefinition} levelState={levelState} />
        )}
      </footer>
    </div>
  );
}

export default Level;
