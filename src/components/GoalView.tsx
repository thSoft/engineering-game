import { Button, Card } from "antd";
import CardMeta from "antd/es/card/CardMeta";
import Modal from "antd/es/modal/Modal";
import { LevelDefinition } from "../engine/levels";
import { LevelPhase, LevelState } from "../engine/simulation";
import { modalWidth } from "./designTokens";
import { loadLevel, setLevelPhase } from "../store/gameStore.ts";

interface Props {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
}

function GoalView({ levelDefinition, levelState }: Props) {
  const handleClose = () => {
    setLevelPhase(LevelPhase.BUILD);
  };
  return (
    <Modal
      title={levelDefinition.label}
      open={levelState.phase === LevelPhase.GOAL}
      onCancel={handleClose}
      footer={
        <>
          <Button type="primary" onClick={handleClose}>
            Build
          </Button>
          <Button onClick={() => loadLevel(undefined)}>Back to projects</Button>
        </>
      }
      mask={{ blur: true }}
      width={modalWidth}
    >
      <Card
        title={
          <span>
            <strong>{levelDefinition.userName}</strong> needs a{" "}
            <strong>{levelDefinition.label}.</strong>
          </span>
        }
      >
        <CardMeta
          avatar={
            <img
              src={`levels/${levelDefinition.id}/goal.svg`}
              alt={`${levelDefinition.userName} unsatisfied`}
              width={192}
            />
          }
          description={<em>"{levelDefinition.userNeedQuote}"</em>}
        />
      </Card>
    </Modal>
  );
}

export default GoalView;
