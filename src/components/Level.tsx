import { ReactFlowProvider } from "@xyflow/react";
import { Button, Flex } from "antd";
import { ChevronLeft, Info } from "lucide-react";
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
import { headerStyle } from "./designTokens";

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
        {/* Left panel: Part palette */}
        <PartPalette availableParts={levelDefinition?.availableParts} />

        {/* Graph editor */}
        <ReactFlowProvider>
          <GraphEditor levelDefinitionId={levelDefinitionId} />
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
