import { Card, Col, Flex, Row } from "antd";
import CardMeta from "antd/es/card/CardMeta";
import { Cpu } from "lucide-react";
import { loadLevel, useGameStore } from "../store/gameStore";
import { headerStyle } from "./designTokens";
import NewLevels from "./NewLevels";
import { getLevelIcon } from "./utils";
import { getLevelDefinitionById } from "../levels/levelDefinitions.ts";

function LevelSelector() {
  const showNewLevels = useGameStore.showNewLevels();
  const levelStates = useGameStore.levelStates();
  return (
    <div className="app-shell">
      {showNewLevels && <NewLevels />}
      {/* ── Header ── */}
      <header style={headerStyle}>
        <Flex gap={8} align="center">
          <Cpu size={18} className="project-icon" />
          <h1 className="project-title">Engineering Game</h1>
        </Flex>
        <Flex
          gap={8}
          justify="center"
          align="center"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          <h2 className="truncate-text">Projects</h2>
        </Flex>
      </header>
      <main>
        <div style={{ padding: 16 }}>
          <Row gutter={16}>
            {levelStates.map((levelState) => {
              const definition = getLevelDefinitionById(levelState.definitionId);
              if (!definition) return null;
              return (
                <Col span={8} key={levelState.definitionId}>
                  <Card
                    onClick={() => loadLevel(levelState.definitionId)}
                    style={{ cursor: "pointer", width: 300 }}
                  >
                    <CardMeta avatar={getLevelIcon(definition)} title={definition.label}></CardMeta>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </main>
    </div>
  );
}

export default LevelSelector;
