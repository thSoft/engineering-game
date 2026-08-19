import { Button, Card } from "antd";
import CardMeta from "antd/es/card/CardMeta";
import Modal from "antd/es/modal/Modal";
import { LevelDefinition } from "../engine/levels";
import { LevelPhase, LevelState } from "../engine/simulation";
import { useGameStore } from "../store/gameStore";

interface Props {
  levelDefinition: LevelDefinition;
  levelState: LevelState;
}

function SuccessView({ levelDefinition, levelState }: Props) {
  const setLevelPhase = useGameStore((state) => state.setLevelPhase);
  const handleClose = () => {
    setLevelPhase(LevelPhase.BUILD);
  };
  return (
    <Modal
      title={`${levelDefinition.label} is ready!`}
      open={levelState.phase === LevelPhase.SUCCESS}
      onCancel={handleClose}
      footer={
        <Button type="primary" onClick={handleClose}>
          Back to projects
        </Button>
      }
      mask={{ blur: true }}
    >
      <Card
        title={
          <span>
            <strong>{levelDefinition.userName}</strong> got a{" "}
            <strong>{levelDefinition.label}.</strong>
          </span>
        }
      >
        <CardMeta
          avatar={
            <img
              src={`levels/${levelDefinition.id}/success.svg`}
              alt={`${levelDefinition.userName} satisfied`}
            />
          }
          description={<em>"{levelDefinition.successQuote}"</em>}
        />
      </Card>
    </Modal>
  );
}

export default SuccessView;
