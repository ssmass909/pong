import React, { useEffect, useState } from "react";
import { GameStore } from "./GameStore";
import { GameCanvas } from "./GameCanvas";
import { Scoreboard } from "./Scoreboard";
import { observer } from "mobx-react";

const gameStore = new GameStore();

export const Game: React.FC = observer(() => {
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      gameStore.destroy();
    };
  }, []);

  useEffect(() => {
    // Hide controls after game starts
    if (gameStore.isGamePlaying && showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameStore.isGamePlaying, showControls]);

  const handleConnect = () => {
    gameStore.connect();
  };

  const handleJoinGame = () => {
    gameStore.joinGame();
  };

  const handleDisconnect = () => {
    gameStore.disconnect();
  };

  const getConnectionStatusColor = () => {
    switch (gameStore.connectionStatus) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      default:
        return "text-red-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            PING PONG
          </h1>
          <p className="text-xl text-gray-300">Multiplayer Real-time Game</p>

          {/* Connection Status */}
          <div className={`mt-4 text-lg ${getConnectionStatusColor()}`}>
            Status: {gameStore.connectionStatus.toUpperCase()}
            {gameStore.connectionStatus === "connected" && gameStore.currentPlayerId && (
              <span className="text-sm text-gray-400 ml-2">(ID: {gameStore.currentPlayerId.slice(0, 8)}...)</span>
            )}
          </div>
        </div>

        {/* Game Message */}
        {gameStore.gameMessage && (
          <div className="text-center mb-4 p-3 bg-blue-900 rounded-lg border border-blue-700">
            <p className="text-lg">{gameStore.gameMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {gameStore.error && (
          <div className="text-center mb-4 p-3 bg-red-900 rounded-lg border border-red-700">
            <p className="text-lg text-red-300">{gameStore.error}</p>
          </div>
        )}

        {/* Connection Controls */}
        {!gameStore.isConnected && (
          <div className="text-center mb-8">
            <button
              onClick={handleConnect}
              disabled={gameStore.connectionStatus === "connecting"}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       rounded-lg text-xl font-semibold transition-colors duration-200"
            >
              {gameStore.connectionStatus === "connecting" ? "Connecting..." : "Connect to Server"}
            </button>
          </div>
        )}

        {/* Join Game Button */}
        {gameStore.canStartGame && (
          <div className="text-center mb-8">
            <button
              onClick={handleJoinGame}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 
                       rounded-lg text-xl font-semibold transition-colors duration-200"
            >
              Join Game
            </button>
          </div>
        )}

        {/* Game Area */}
        {gameStore.isInGame && (
          <div className="text-center">
            <Scoreboard gameStore={gameStore} />
            <div className="flex justify-center mb-4">
              <GameCanvas gameStore={gameStore} />
            </div>

            {/* Controls Instructions */}
            {(showControls || !gameStore.isGamePlaying) && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">Controls:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Player 1 (Left):</strong> W / S keys
                  </div>
                  <div>
                    <strong>Player 2 (Right):</strong> ↑ / ↓ arrow keys
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Your paddle is highlighted in green</p>
              </div>
            )}

            {/* Game Status */}
            <div className="text-center text-lg">
              Game Status: <span className="font-semibold">{gameStore.gameState?.gameStatus.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Disconnect Button */}
        {gameStore.isConnected && (
          <div className="text-center mt-8">
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 
                       rounded-lg font-semibold transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Built with React, Node.js, Socket.IO, and MobX</p>
          <p>Real-time multiplayer gaming experience</p>
        </div>
      </div>
    </div>
  );
});

export default Game;
