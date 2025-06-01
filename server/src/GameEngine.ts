import { GameState, Ball, Players, Score, Player, GAME_CONSTANTS } from "./types";

export class GameEngine {
  private gameState: GameState;
  private gameLoop: NodeJS.Timeout | null = null;
  private paddleMovements: Map<string, "up" | "down" | "stop"> = new Map();

  constructor(roomId: string) {
    this.gameState = {
      ball: this.initializeBall(),
      players: {},
      score: { left: 0, right: 0 },
      gameStatus: "waiting",
      roomId,
    };
  }

  private initializeBall(): Ball {
    return {
      x: GAME_CONSTANTS.CANVAS_WIDTH / 2,
      y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
      velocityX: Math.random() > 0.5 ? GAME_CONSTANTS.BALL_SPEED : -GAME_CONSTANTS.BALL_SPEED,
      velocityY: (Math.random() - 0.5) * GAME_CONSTANTS.BALL_SPEED,
      radius: GAME_CONSTANTS.BALL_RADIUS,
    };
  }

  public addPlayer(playerId: string): "left" | "right" | null {
    if (!this.gameState.players.left) {
      this.gameState.players.left = {
        id: playerId,
        y: GAME_CONSTANTS.CANVAS_HEIGHT / 2 - GAME_CONSTANTS.PADDLE_HEIGHT / 2,
        side: "left",
        connected: true,
      };
      return "left";
    } else if (!this.gameState.players.right) {
      this.gameState.players.right = {
        id: playerId,
        y: GAME_CONSTANTS.CANVAS_HEIGHT / 2 - GAME_CONSTANTS.PADDLE_HEIGHT / 2,
        side: "right",
        connected: true,
      };
      return "right";
    }
    return null;
  }

  public removePlayer(playerId: string): void {
    if (this.gameState.players.left?.id === playerId) {
      this.gameState.players.left = undefined;
    } else if (this.gameState.players.right?.id === playerId) {
      this.gameState.players.right = undefined;
    }
    this.paddleMovements.delete(playerId);

    if (!this.gameState.players.left || !this.gameState.players.right) {
      this.stopGame();
    }
  }

  public startGame(): void {
    if (this.gameState.players.left && this.gameState.players.right) {
      this.gameState.gameStatus = "playing";
      this.gameLoop = setInterval(() => {
        this.updateGame();
      }, 1000 / 60); // 60 FPS
    }
  }

  public stopGame(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.gameState.gameStatus = "waiting";
  }

  public setPaddleMovement(playerId: string, direction: "up" | "down" | "stop"): void {
    this.paddleMovements.set(playerId, direction);
  }

  private updateGame(): void {
    this.updatePaddles();
    this.updateBall();
    this.checkCollisions();
    this.checkScore();
  }

  private updatePaddles(): void {
    this.paddleMovements.forEach((direction, playerId) => {
      const player = this.getPlayerById(playerId);
      if (!player) return;

      if (direction === "up") {
        player.y = Math.max(0, player.y - GAME_CONSTANTS.PADDLE_SPEED);
      } else if (direction === "down") {
        player.y = Math.min(
          GAME_CONSTANTS.CANVAS_HEIGHT - GAME_CONSTANTS.PADDLE_HEIGHT,
          player.y + GAME_CONSTANTS.PADDLE_SPEED
        );
      }
    });
  }

  private updateBall(): void {
    this.gameState.ball.x += this.gameState.ball.velocityX;
    this.gameState.ball.y += this.gameState.ball.velocityY;

    // Ball collision with top and bottom walls
    if (
      this.gameState.ball.y <= this.gameState.ball.radius ||
      this.gameState.ball.y >= GAME_CONSTANTS.CANVAS_HEIGHT - this.gameState.ball.radius
    ) {
      this.gameState.ball.velocityY = -this.gameState.ball.velocityY;
      this.gameState.ball.y = Math.max(
        this.gameState.ball.radius,
        Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - this.gameState.ball.radius, this.gameState.ball.y)
      );
    }
  }

  private checkCollisions(): void {
    // Left paddle collision
    if (this.gameState.players.left) {
      const leftPaddle = this.gameState.players.left;
      if (
        this.gameState.ball.x - this.gameState.ball.radius <= GAME_CONSTANTS.PADDLE_WIDTH &&
        this.gameState.ball.y >= leftPaddle.y &&
        this.gameState.ball.y <= leftPaddle.y + GAME_CONSTANTS.PADDLE_HEIGHT &&
        this.gameState.ball.velocityX < 0
      ) {
        this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
        this.gameState.ball.x = GAME_CONSTANTS.PADDLE_WIDTH + this.gameState.ball.radius;

        // Add some angle to the ball based on where it hits the paddle
        const hitPos = (this.gameState.ball.y - leftPaddle.y) / GAME_CONSTANTS.PADDLE_HEIGHT;
        this.gameState.ball.velocityY = (hitPos - 0.5) * GAME_CONSTANTS.BALL_SPEED;
      }
    }

    // Right paddle collision
    if (this.gameState.players.right) {
      const rightPaddle = this.gameState.players.right;
      if (
        this.gameState.ball.x + this.gameState.ball.radius >=
          GAME_CONSTANTS.CANVAS_WIDTH - GAME_CONSTANTS.PADDLE_WIDTH &&
        this.gameState.ball.y >= rightPaddle.y &&
        this.gameState.ball.y <= rightPaddle.y + GAME_CONSTANTS.PADDLE_HEIGHT &&
        this.gameState.ball.velocityX > 0
      ) {
        this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
        this.gameState.ball.x = GAME_CONSTANTS.CANVAS_WIDTH - GAME_CONSTANTS.PADDLE_WIDTH - this.gameState.ball.radius;

        // Add some angle to the ball based on where it hits the paddle
        const hitPos = (this.gameState.ball.y - rightPaddle.y) / GAME_CONSTANTS.PADDLE_HEIGHT;
        this.gameState.ball.velocityY = (hitPos - 0.5) * GAME_CONSTANTS.BALL_SPEED;
      }
    }
  }

  private checkScore(): void {
    // Ball went off left side
    if (this.gameState.ball.x < 0) {
      this.gameState.score.right++;
      this.resetBall();

      if (this.gameState.score.right >= GAME_CONSTANTS.WINNING_SCORE) {
        this.endGame("right");
      }
    }

    // Ball went off right side
    if (this.gameState.ball.x > GAME_CONSTANTS.CANVAS_WIDTH) {
      this.gameState.score.left++;
      this.resetBall();

      if (this.gameState.score.left >= GAME_CONSTANTS.WINNING_SCORE) {
        this.endGame("left");
      }
    }
  }

  private resetBall(): void {
    this.gameState.ball = this.initializeBall();
  }

  private endGame(winner: "left" | "right"): void {
    this.gameState.gameStatus = "finished";
    this.stopGame();
  }

  private getPlayerById(playerId: string): Player | undefined {
    if (this.gameState.players.left?.id === playerId) {
      return this.gameState.players.left;
    }
    if (this.gameState.players.right?.id === playerId) {
      return this.gameState.players.right;
    }
    return undefined;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public canStartGame(): boolean {
    return (
      this.gameState.players.left !== undefined &&
      this.gameState.players.right !== undefined &&
      this.gameState.gameStatus === "waiting"
    );
  }
}

export default GameEngine;
