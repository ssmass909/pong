import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import GameEngine from "./GameEngine";
import "dotenv/config";
import { ServerToClientEvents, ClientToServerEvents, PaddleMovement } from "./types";

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Game room management
const gameRooms: Map<string, GameEngine> = new Map();
const playerRooms: Map<string, string> = new Map();

// Find or create a game room
function findAvailableRoom(): string {
  for (const [roomId, game] of gameRooms.entries()) {
    const gameState = game.getGameState();
    if (!gameState.players.left || !gameState.players.right) {
      return roomId;
    }
  }

  // Create new room
  const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  gameRooms.set(roomId, new GameEngine(roomId));
  return roomId;
}

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("joinGame", () => {
    const roomId = findAvailableRoom();
    const game = gameRooms.get(roomId)!;

    const playerSide = game.addPlayer(socket.id);

    if (playerSide) {
      socket.join(roomId);
      playerRooms.set(socket.id, roomId);

      // Notify all players in the room
      io.to(roomId).emit("playerJoined", socket.id, playerSide);

      // Send current game state
      io.to(roomId).emit("gameStateUpdate", game.getGameState());

      // Start game if room is full
      if (game.canStartGame()) {
        game.startGame();
        io.to(roomId).emit("gameStarted");

        // Start broadcasting game state updates
        const gameStateInterval = setInterval(() => {
          if (game.getGameState().gameStatus === "playing") {
            io.to(roomId).emit("gameStateUpdate", game.getGameState());
          } else {
            clearInterval(gameStateInterval);
          }
        }, 1000 / 60); // 60 FPS
      }
    } else {
      socket.emit("error", "Game room is full");
    }
  });

  socket.on("paddleMove", (movement: PaddleMovement) => {
    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const game = gameRooms.get(roomId);
      if (game) {
        game.setPaddleMovement(movement.playerId, movement.direction);
      }
    }
  });

  socket.on("leaveGame", () => {
    handlePlayerDisconnect(socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    handlePlayerDisconnect(socket.id);
  });

  function handlePlayerDisconnect(playerId: string) {
    const roomId = playerRooms.get(playerId);
    if (roomId) {
      const game = gameRooms.get(roomId);
      if (game) {
        game.removePlayer(playerId);
        socket.to(roomId).emit("playerLeft", playerId);

        // Clean up empty rooms
        const gameState = game.getGameState();
        if (!gameState.players.left && !gameState.players.right) {
          gameRooms.delete(roomId);
        }
      }
      playerRooms.delete(playerId);
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeRooms: gameRooms.size,
    activePlayers: playerRooms.size,
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 Ready for multiplayer Ping Pong!`);
});
