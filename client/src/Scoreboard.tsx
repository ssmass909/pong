import { observer } from "mobx-react";
import { GameStore } from "./GameStore";

interface ScoreboardProps {
  gameStore: GameStore;
}

export const Scoreboard = observer(({ gameStore }: ScoreboardProps) => {
  if (!gameStore.gameState) return null;

  const { score } = gameStore.gameState;
  const currentPlayerSide = gameStore.currentPlayerSide;

  return (
    <div className="flex justify-center items-center space-x-8 text-white text-4xl font-bold mb-4">
      <div className={`text-center ${currentPlayerSide === "left" ? "text-green-400" : ""}`}>
        <div className="text-lg font-normal">Player 1</div>
        <div>{score.left}</div>
        {currentPlayerSide === "left" && <div className="text-sm text-green-400">YOU</div>}
      </div>

      <div className="text-white text-2xl">-</div>

      <div className={`text-center ${currentPlayerSide === "right" ? "text-green-400" : ""}`}>
        <div className="text-lg font-normal">Player 2</div>
        <div>{score.right}</div>
        {currentPlayerSide === "right" && <div className="text-sm text-green-400">YOU</div>}
      </div>
    </div>
  );
});
