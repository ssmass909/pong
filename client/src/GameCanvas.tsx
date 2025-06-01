import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { GameStore } from "./GameStore";
import { GAME_CONSTANTS } from "./types.ts";

interface GameCanvasProps {
  gameStore: GameStore;
}

export const GameCanvas: React.FC<GameCanvasProps> = observer(({ gameStore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation loop
    const animate = () => {
      drawGame(ctx);
      requestAnimationFrame(animate);
    };

    animate();
  }, [gameStore.gameState]);

  const drawGame = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    if (!gameStore.gameState) return;

    const { ball, players } = gameStore.gameState;

    // Draw center line
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(GAME_CONSTANTS.CANVAS_WIDTH / 2, 0);
    ctx.lineTo(GAME_CONSTANTS.CANVAS_WIDTH / 2, GAME_CONSTANTS.CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#fff";

    // Left paddle
    if (players.left) {
      const isCurrentPlayer = players.left.id === gameStore.currentPlayerId;
      ctx.fillStyle = isCurrentPlayer ? "#00ff00" : "#fff";
      ctx.fillRect(0, players.left.y, GAME_CONSTANTS.PADDLE_WIDTH, GAME_CONSTANTS.PADDLE_HEIGHT);
    }

    // Right paddle
    if (players.right) {
      const isCurrentPlayer = players.right.id === gameStore.currentPlayerId;
      ctx.fillStyle = isCurrentPlayer ? "#00ff00" : "#fff";
      ctx.fillRect(
        GAME_CONSTANTS.CANVAS_WIDTH - GAME_CONSTANTS.PADDLE_WIDTH,
        players.right.y,
        GAME_CONSTANTS.PADDLE_WIDTH,
        GAME_CONSTANTS.PADDLE_HEIGHT
      );
    }

    // Draw ball
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw ball trail effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(ball.x - ball.velocityX, ball.y - ball.velocityY, ball.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONSTANTS.CANVAS_WIDTH}
      height={GAME_CONSTANTS.CANVAS_HEIGHT}
      className="border border-white bg-black"
      style={{
        maxWidth: "100%",
        height: "auto",
        imageRendering: "pixelated",
      }}
    />
  );
});
