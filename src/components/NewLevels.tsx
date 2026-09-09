import { Button, Card, Flex } from "antd";
import CardMeta from "antd/es/card/CardMeta";
import Modal from "antd/es/modal/Modal";
import Link from "antd/es/typography/Link";
import { LevelStatus } from "../engine/simulation";
import { loadLevel, setShowNewLevels, useGameStore } from "../store/gameStore";
import { modalWidth } from "./designTokens";
import { getLevelIcon } from "./utils";
import { getLevelDefinitionById } from "../levels/levelDefinitions.ts";

interface Props {}

function NewLevels({}: Props) {
  const levelStates = useGameStore.levelStates();
  const newLevels = levelStates.filter(
    (levelState) => levelState.status === LevelStatus.NOT_STARTED,
  );
  const newLevelCount = newLevels.length;
  const handleClose = () => setShowNewLevels(false);
  return (
    <Modal
      open
      title={
        newLevelCount > 1
          ? `You got ${newLevelCount} new commissions!`
          : newLevelCount == 1
            ? "You got a new commission!"
            : "You have no new commissions"
      }
      onCancel={handleClose}
      footer={
        levelStates.length > 1 && (
          <>
            <Button onClick={handleClose}>Back to projects</Button>
          </>
        )
      }
      mask={{ blur: true }}
      width={modalWidth}
    >
      <Flex vertical gap={8} style={{ paddingTop: 8 }}>
        {newLevels.map((levelState) => {
          const levelDefinition = getLevelDefinitionById(levelState.definitionId)!;
          return (
            <Card key={levelState.definitionId}>
              <CardMeta
                avatar={getLevelIcon(levelDefinition)}
                description={
                  <span>
                    <Link
                      onClick={() => {
                        setShowNewLevels(false);
                        loadLevel(levelState.definitionId);
                      }}
                    >
                      Build a <strong>{levelDefinition.label}</strong>
                    </Link>{" "}
                    for <strong>{levelDefinition.userName}</strong>
                  </span>
                }
              />
            </Card>
          );
        })}
      </Flex>
    </Modal>
  );
}

export default NewLevels;
