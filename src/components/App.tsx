import { ConfigProvider, theme } from "antd";
import { useGameStore } from "../store/gameStore";
import Level from "./Level";
import LevelSelector from "./LevelSelector";

function App() {
  const currentLevelDefinitionId = useGameStore.currentLevelDefinitionId();
  const content = currentLevelDefinitionId ? (
    <Level levelDefinitionId={currentLevelDefinitionId} />
  ) : (
    <LevelSelector />
  );
  return (
    <ConfigProvider theme={{ algorithm: [theme.darkAlgorithm], token: { fontSize: 16 } }}>
      {content}
    </ConfigProvider>
  );
}

export default App;
