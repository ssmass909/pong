import { makeAutoObservable } from "mobx";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents, GameState, PaddleMovement } from "./types";

export class GameStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  gameState: GameState | null = null;
  currentPlayerId: string | null = null;
  currentPlayerSide: "left" | "right" | null = null;
  connectionStatus: "disconnected" | "connecting" | "connected" = "disconnected";
  error: string | null = null;
  gameMessage: string = "";

  // Input handling
  private keysPressed: Set<string> = new Set();
  private inputInterval: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  connect() {
    if (this.socket?.connected) return;

    this.connectionStatus = "connecting";
    this.error = null;

    this.socket = io(import.meta.env.VITE_SERVER_URL);

    this.socket.on("connect", () => {
      this.connectionStatus = "connected";
      this.currentPlayerId = this.socket!.id ?? null;
      this.gameMessage = "Connected! Joining game...";
    });

    this.socket.on("disconnect", () => {
      this.connectionStatus = "disconnected";
      this.currentPlayerId = null;
      this.currentPlayerSide = null;
      this.gameMessage = "Disconnected from server";
    });

    this.socket.on("gameStateUpdate", (gameState: GameState) => {
      this.gameState = gameState;
    });

    this.socket.on("playerJoined", (playerId: string, side: "left" | "right") => {
      if (playerId === this.currentPlayerId) {
        this.currentPlayerSide = side;
        this.gameMessage = `You are the ${side} player! Waiting for opponent...`;
      } else {
        this.gameMessage = "Opponent joined! Get ready to play!";
      }
    });

    this.socket.on("playerLeft", (playerId: string) => {
      this.gameMessage = "Opponent left the game. Waiting for new opponent...";
    });

    this.socket.on("gameStarted", () => {
      this.gameMessage = "Game started! Use W/S or Arrow Keys to move your paddle!";
      this.startInputHandling();
    });

    this.socket.on("gameEnded", (winner: "left" | "right") => {
      const isWinner = winner === this.currentPlayerSide;
      this.gameMessage = isWinner ? "You won! 🎉" : "You lost! Better luck next time!";
      this.stopInputHandling();
    });

    this.socket.on("error", (message: string) => {
      this.error = message;
      this.gameMessage = `Error: ${message}`;
    });
  }

  joinGame() {
    if (this.socket?.connected) {
      this.socket.emit("joinGame");
    }
  }

  disconnect() {
    this.stopInputHandling();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = "disconnected";
    this.currentPlayerId = null;
    this.currentPlayerSide = null;
    this.gameState = null;
    this.gameMessage = "";
  }

  // Input handling methods
  private startInputHandling() {
    // Set up keyboard event listeners
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    // Start continuous input processing
    this.inputInterval = setInterval(() => {
      this.processInput();
    }, 1000 / 60); // 60 FPS
  }

  private stopInputHandling() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);

    if (this.inputInterval) {
      clearInterval(this.inputInterval);
      this.inputInterval = null;
    }

    this.keysPressed.clear();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
    this.keysPressed.add(event.key.toLowerCase());
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    event.preventDefault();
    this.keysPressed.delete(event.key.toLowerCase());
  };

  private processInput() {
    if (!this.socket?.connected || !this.currentPlayerId || !this.currentPlayerSide) {
      return;
    }

    let direction: "up" | "down" | "stop" = "stop";

    // Check for movement keys
    const upKeys = ["w", "arrowup"];
    const downKeys = ["s", "arrowdown"];

    const isUpPressed = upKeys.some((key) => this.keysPressed.has(key));
    const isDownPressed = downKeys.some((key) => this.keysPressed.has(key));

    if (isUpPressed && !isDownPressed) {
      direction = "up";
    } else if (isDownPressed && !isUpPressed) {
      direction = "down";
    }

    // Send paddle movement to server
    const movement: PaddleMovement = {
      playerId: this.currentPlayerId,
      direction,
    };

    this.socket.emit("paddleMove", movement);
  }

  // Computed properties
  get isConnected() {
    return this.connectionStatus === "connected";
  }

  get isInGame() {
    return this.gameState !== null && this.currentPlayerSide !== null;
  }

  get canStartGame() {
    return this.isConnected && !this.isInGame;
  }

  get leftPlayerScore() {
    return this.gameState?.score.left || 0;
  }

  get rightPlayerScore() {
    return this.gameState?.score.right || 0;
  }

  get isGamePlaying() {
    return this.gameState?.gameStatus === "playing";
  }

  get isGameFinished() {
    return this.gameState?.gameStatus === "finished";
  }

  // Clean up on destroy
  destroy() {
    this.disconnect();
  }
}
