// Shared types between client and server
export interface GameState {
  ball: Ball;
  players: Players;
  score: Score;
  gameStatus: GameStatus;
  roomId: string;
}

export interface Ball {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

export interface Player {
  id: string;
  y: number;
  side: "left" | "right";
  connected: boolean;
}

export interface Players {
  left?: Player;
  right?: Player;
}

export interface Score {
  left: number;
  right: number;
}

export type GameStatus = "waiting" | "playing" | "paused" | "finished";

export interface PaddleMovement {
  playerId: string;
  direction: "up" | "down" | "stop";
}

export interface GameConstants {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  PADDLE_WIDTH: number;
  PADDLE_HEIGHT: number;
  BALL_RADIUS: number;
  BALL_SPEED: number;
  PADDLE_SPEED: number;
  WINNING_SCORE: number;
}

export const GAME_CONSTANTS: GameConstants = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 80,
  BALL_RADIUS: 8,
  BALL_SPEED: 5,
  PADDLE_SPEED: 8,
  WINNING_SCORE: 5,
};

// Socket.IO Events
export interface ServerToClientEvents {
  gameStateUpdate: (gameState: GameState) => void;
  playerJoined: (playerId: string, side: "left" | "right") => void;
  playerLeft: (playerId: string) => void;
  gameStarted: () => void;
  gameEnded: (winner: "left" | "right") => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinGame: () => void;
  paddleMove: (movement: PaddleMovement) => void;
  leaveGame: () => void;
}
