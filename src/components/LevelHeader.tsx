import { Button, Flex } from "antd";
import { ChevronLeft, Info } from "lucide-react";
import { LevelDefinition, LevelDefinitionId } from "../engine/levels.ts";
import { LevelPhase, LevelState } from "../engine/simulation.ts";
import LevelStatusView from "./LevelStatusView.tsx";

import { headerStyle } from "./designTokens.tsx";

interface Props {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
  loadLevel: (definitionId?: LevelDefinitionId | undefined) => void;
  setLevelPhase: (phase: LevelPhase) => void;
}

export function LevelHeader({ levelDefinition, levelState, loadLevel, setLevelPhase }: Props) {
  return (
    <header style={headerStyle}>
      <Flex gap={8} align="center">
        <Button onClick={() => loadLevel(undefined)} icon={<ChevronLeft />}>
          Back to projects
        </Button>
      </Flex>
      <Flex
        gap={8}
        justify="center"
        align="center"
        style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
      >
        <h2>{levelDefinition.label}</h2>
        <Button onClick={() => setLevelPhase(LevelPhase.GOAL)} icon={<Info />} variant="text" />
      </Flex>
      <Flex style={{ position: "absolute", right: 8 }} align="center">
        <LevelStatusView levelStatus={levelState.levelStatus} />
      </Flex>
    </header>
  );
}
