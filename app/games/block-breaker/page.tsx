"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResult } from "@/lib/game";

type Brick = {
  x: number;
  y: number;
  alive: boolean;
  hitFlash: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type GameState = {
  ballX: number;
  ballY: number;
  dx: number;
  dy: number;
  paddleX: number;
  bricks: Brick[];
  particles: Particle[];
  trail: { x: number; y: number; life: number }[];
  lives: number;
  level: number;
};

type GameStatus = "ready" | "playing" | "paused" | "won" | "game-over";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 560;

const PADDLE_WIDTH = 125;
const PADDLE_HEIGHT = 13;
const PADDLE_Y = CANVAS_HEIGHT - 42;
const PADDLE_SPEED = 9;

const BALL_RADIUS = 8;

const BRICK_ROWS = 6;
const BRICK_COLUMNS = 10;
const BRICK_WIDTH = 72;
const BRICK_HEIGHT = 24;
const BRICK_GAP = 10;
const BRICK_TOP = 70;

const STARTING_LIVES = 3;

const BRICK_COLORS = [
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
];

function createBricks(level: number): Brick[] {
  const bricks: Brick[] = [];

  const totalWidth =
    BRICK_COLUMNS * BRICK_WIDTH +
    (BRICK_COLUMNS - 1) * BRICK_GAP;

  const startX = (CANVAS_WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      /*
       * Higher levels introduce a few strategically placed gaps,
       * making later boards slightly more interesting.
       */
      const shouldCreate =
        level === 1 ||
        !(
          level > 1 &&
          row > 0 &&
          row < BRICK_ROWS - 1 &&
          (column + row + level) % 7 === 0
        );

      if (!shouldCreate) continue;

      bricks.push({
        x: startX + column * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        alive: true,
        hitFlash: 0,
      });
    }
  }

  return bricks;
}

function createInitialGame(): GameState {
  return {
    ballX: CANVAS_WIDTH / 2,
    ballY: PADDLE_Y - 30,
    dx: 4.2,
    dy: -4.2,
    paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    bricks: createBricks(1),
    particles: [],
    trail: [],
    lives: STARTING_LIVES,
    level: 1,
  };
}

function createParticles(
  game: GameState,
  x: number,
  y: number,
  amount = 12,
) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;

    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.45,
      maxLife: 0.9,
      size: 2 + Math.random() * 3,
    });
  }
}

function resetBall(game: GameState) {
  game.ballX = CANVAS_WIDTH / 2;
  game.ballY = PADDLE_Y - 30;

  const direction = Math.random() > 0.5 ? 1 : -1;

  game.dx = direction * (3.8 + game.level * 0.35);
  game.dy = -(4 + game.level * 0.25);

  game.paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
  game.trail = [];
}

export default function BlockBreakerPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createInitialGame());
  const animationRef = useRef<number | null>(null);

  const keysRef = useRef({
    left: false,
    right: false,
  });

  const pointerActiveRef = useRef(false);

  /*
   * --------------------------------------------------------------------------
   * Leaderboard / result tracking
   * --------------------------------------------------------------------------
   *
   * scoreRef keeps the latest score immediately available to the game loop.
   * resultSavedRef prevents the same run from being recorded more than once.
   */
  const scoreRef = useRef(0);
  const resultSavedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [blocksLeft, setBlocksLeft] = useState(
    createBricks(1).length,
  );
  const [gameStatus, setGameStatus] =
    useState<GameStatus>("ready");

  const [highScore, setHighScore] = useState(0);

  /*
   * --------------------------------------------------------------------------
   * High score
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "gamehub-block-breaker-high-score",
      );

      if (saved) {
        setHighScore(Number(saved));
      }
    } catch {
      // localStorage can be unavailable in restricted environments.
    }
  }, []);

  const updateHighScore = useCallback((value: number) => {
    setHighScore((current) => {
      if (value <= current) return current;

      try {
        window.localStorage.setItem(
          "gamehub-block-breaker-high-score",
          String(value),
        );
      } catch {
        // Ignore storage failures.
      }

      return value;
    });
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Save completed game result
   * --------------------------------------------------------------------------
   *
   * A result is saved only when the run actually ends:
   *
   * - win       -> board completely cleared
   * - loss      -> all lives lost
   *
   * Pause, restart, and losing an individual life do not save anything.
   */
  const saveCompletedResult = useCallback(
    (result: "win" | "loss") => {
      if (resultSavedRef.current) {
        return;
      }

      resultSavedRef.current = true;

      saveResult(result, scoreRef.current);
    },
    [],
  );

  /*
   * --------------------------------------------------------------------------
   * Canvas drawing
   * --------------------------------------------------------------------------
   */

  const drawGame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      game: GameState,
    ) => {
      ctx.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      /*
       * Background
       */

      const background = ctx.createLinearGradient(
        0,
        0,
        0,
        CANVAS_HEIGHT,
      );

      background.addColorStop(0, "#020617");
      background.addColorStop(0.55, "#071126");
      background.addColorStop(1, "#020617");

      ctx.fillStyle = background;
      ctx.fillRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      /*
       * Ambient glow.
       */

      const ambient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.35,
        20,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.35,
        CANVAS_WIDTH * 0.65,
      );

      ambient.addColorStop(
        0,
        "rgba(20, 184, 166, 0.10)",
      );

      ambient.addColorStop(
        0.5,
        "rgba(59, 130, 246, 0.045)",
      );

      ambient.addColorStop(
        1,
        "rgba(2, 6, 23, 0)",
      );

      ctx.fillStyle = ambient;
      ctx.fillRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      /*
       * Grid.
       */

      ctx.strokeStyle =
        "rgba(148, 163, 184, 0.055)";
      ctx.lineWidth = 1;

      for (
        let x = 0;
        x <= CANVAS_WIDTH;
        x += 45
      ) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      for (
        let y = 0;
        y <= CANVAS_HEIGHT;
        y += 45
      ) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      /*
       * Decorative top line.
       */

      const topGlow = ctx.createLinearGradient(
        0,
        0,
        CANVAS_WIDTH,
        0,
      );

      topGlow.addColorStop(
        0,
        "rgba(20, 184, 166, 0)",
      );

      topGlow.addColorStop(
        0.5,
        "rgba(20, 184, 166, 0.55)",
      );

      topGlow.addColorStop(
        1,
        "rgba(59, 130, 246, 0)",
      );

      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 2);

      /*
       * Bricks.
       */

      game.bricks.forEach((brick, index) => {
        if (!brick.alive) return;

        const row = Math.floor(
          index / BRICK_COLUMNS,
        );

        const color =
          BRICK_COLORS[row % BRICK_COLORS.length];

        /*
         * Outer glow.
         */

        ctx.shadowColor = color;
        ctx.shadowBlur =
          brick.hitFlash > 0 ? 18 : 8;

        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.roundRect(
          brick.x,
          brick.y,
          BRICK_WIDTH,
          BRICK_HEIGHT,
          7,
        );
        ctx.fill();

        ctx.shadowBlur = 0;

        /*
         * Inner highlight.
         */

        const highlight = ctx.createLinearGradient(
          brick.x,
          brick.y,
          brick.x,
          brick.y + BRICK_HEIGHT,
        );

        highlight.addColorStop(
          0,
          "rgba(255,255,255,0.30)",
        );

        highlight.addColorStop(
          0.25,
          "rgba(255,255,255,0.08)",
        );

        highlight.addColorStop(
          1,
          "rgba(0,0,0,0.14)",
        );

        ctx.fillStyle = highlight;

        ctx.beginPath();
        ctx.roundRect(
          brick.x + 1,
          brick.y + 1,
          BRICK_WIDTH - 2,
          BRICK_HEIGHT - 2,
          6,
        );
        ctx.fill();

        /*
         * Tiny center shine.
         */

        ctx.fillStyle =
          "rgba(255,255,255,0.20)";

        ctx.fillRect(
          brick.x + 9,
          brick.y + 4,
          BRICK_WIDTH - 18,
          2,
        );
      });

      /*
       * Ball trail.
       */

      game.trail.forEach((point) => {
        const alpha = Math.max(
          0,
          point.life / 0.35,
        );

        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          BALL_RADIUS * alpha,
          0,
          Math.PI * 2,
        );

        ctx.fillStyle = `rgba(103, 232, 249, ${alpha * 0.28})`;

        ctx.fill();
      });

      /*
       * Particles.
       */

      game.particles.forEach((particle) => {
        const alpha = Math.max(
          0,
          particle.life / particle.maxLife,
        );

        ctx.beginPath();

        ctx.arc(
          particle.x,
          particle.y,
          particle.size * alpha,
          0,
          Math.PI * 2,
        );

        ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`;

        ctx.fill();
      });

      /*
       * Paddle glow.
       */

      ctx.shadowColor = "#14b8a6";
      ctx.shadowBlur = 22;

      const paddleGradient =
        ctx.createLinearGradient(
          game.paddleX,
          PADDLE_Y,
          game.paddleX + PADDLE_WIDTH,
          PADDLE_Y,
        );

      paddleGradient.addColorStop(
        0,
        "#0bb4aa",
      );

      paddleGradient.addColorStop(
        0.5,
        "#22d3ee",
      );

      paddleGradient.addColorStop(
        1,
        "#3b82f6",
      );

      ctx.fillStyle = paddleGradient;

      ctx.beginPath();
      ctx.roundRect(
        game.paddleX,
        PADDLE_Y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
        8,
      );

      ctx.fill();

      ctx.shadowBlur = 0;

      /*
       * Paddle highlight.
       */

      ctx.fillStyle =
        "rgba(255,255,255,0.32)";

      ctx.beginPath();

      ctx.roundRect(
        game.paddleX + 12,
        PADDLE_Y + 2,
        PADDLE_WIDTH - 24,
        3,
        2,
      );

      ctx.fill();

      /*
       * Ball glow.
       */

      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = 24;

      const ballGradient =
        ctx.createRadialGradient(
          game.ballX - 3,
          game.ballY - 3,
          1,
          game.ballX,
          game.ballY,
          BALL_RADIUS,
        );

      ballGradient.addColorStop(
        0,
        "#ffffff",
      );

      ballGradient.addColorStop(
        0.4,
        "#a5f3fc",
      );

      ballGradient.addColorStop(
        1,
        "#06b6d4",
      );

      ctx.fillStyle = ballGradient;

      ctx.beginPath();

      ctx.arc(
        game.ballX,
        game.ballY,
        BALL_RADIUS,
        0,
        Math.PI * 2,
      );

      ctx.fill();

      ctx.shadowBlur = 0;
    },
    [],
  );

  /*
   * --------------------------------------------------------------------------
   * Start / restart
   * --------------------------------------------------------------------------
   */

  const startGame = useCallback(() => {
    const game = createInitialGame();

    gameRef.current = game;

    /*
     * New run = new leaderboard result opportunity.
     */
    resultSavedRef.current = false;

    /*
     * Reset the mutable score immediately so the game loop and
     * leaderboard always use the new run's score.
     */
    scoreRef.current = 0;

    keysRef.current.left = false;
    keysRef.current.right = false;

    setScore(0);
    setBlocksLeft(game.bricks.length);
    setGameStatus("playing");
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Pause
   * --------------------------------------------------------------------------
   */

  const togglePause = useCallback(() => {
    setGameStatus((current) => {
      if (current === "playing") {
        return "paused";
      }

      if (current === "paused") {
        return "playing";
      }

      return current;
    });
  }, []);

  /*
   * --------------------------------------------------------------------------
   * Initial canvas render
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    drawGame(ctx, gameRef.current);
  }, [drawGame]);

  /*
   * --------------------------------------------------------------------------
   * Main game loop
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (gameStatus !== "playing") {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current,
        );

        animationRef.current = null;
      }

      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min(
        (currentTime - lastTime) / 16.67,
        2,
      );

      lastTime = currentTime;

      const game = gameRef.current;

      /*
       * Paddle.
       */

      if (keysRef.current.left) {
        game.paddleX -=
          PADDLE_SPEED * delta;
      }

      if (keysRef.current.right) {
        game.paddleX +=
          PADDLE_SPEED * delta;
      }

      game.paddleX = Math.max(
        0,
        Math.min(
          CANVAS_WIDTH - PADDLE_WIDTH,
          game.paddleX,
        ),
      );

      /*
       * Ball trail.
       */

      game.trail.unshift({
        x: game.ballX,
        y: game.ballY,
        life: 0.35,
      });

      if (game.trail.length > 8) {
        game.trail.pop();
      }

      game.trail.forEach((point) => {
        point.life -= 0.025 * delta;
      });

      game.trail = game.trail.filter(
        (point) => point.life > 0,
      );

      /*
       * Ball movement.
       */

      game.ballX += game.dx * delta;
      game.ballY += game.dy * delta;

      /*
       * Walls.
       */

      if (
        game.ballX - BALL_RADIUS <= 0 ||
        game.ballX + BALL_RADIUS >=
          CANVAS_WIDTH
      ) {
        game.dx *= -1;

        game.ballX = Math.max(
          BALL_RADIUS,
          Math.min(
            CANVAS_WIDTH - BALL_RADIUS,
            game.ballX,
          ),
        );
      }

      if (game.ballY - BALL_RADIUS <= 0) {
        game.dy *= -1;
        game.ballY = BALL_RADIUS;
      }

      /*
       * Paddle collision.
       */

      const hitsPaddle =
        game.ballY + BALL_RADIUS >=
          PADDLE_Y &&
        game.ballY - BALL_RADIUS <=
          PADDLE_Y + PADDLE_HEIGHT &&
        game.ballX >= game.paddleX &&
        game.ballX <=
          game.paddleX + PADDLE_WIDTH &&
        game.dy > 0;

      if (hitsPaddle) {
        game.ballY =
          PADDLE_Y - BALL_RADIUS;

        const paddleCenter =
          game.paddleX +
          PADDLE_WIDTH / 2;

        const hitPosition =
          (game.ballX - paddleCenter) /
          (PADDLE_WIDTH / 2);

        game.dx =
          hitPosition *
          (5 + game.level * 0.2);

        if (Math.abs(game.dx) < 1) {
          game.dx =
            game.dx < 0 ? -1 : 1;
        }

        game.dy = -Math.abs(game.dy);

        createParticles(
          game,
          game.ballX,
          PADDLE_Y,
          5,
        );
      }

      /*
       * Brick collision.
       */

      let hitBrick = false;

      for (const brick of game.bricks) {
        if (!brick.alive || hitBrick) {
          continue;
        }

        const ballLeft =
          game.ballX - BALL_RADIUS;

        const ballRight =
          game.ballX + BALL_RADIUS;

        const ballTop =
          game.ballY - BALL_RADIUS;

        const ballBottom =
          game.ballY + BALL_RADIUS;

        const brickLeft = brick.x;
        const brickRight =
          brick.x + BRICK_WIDTH;

        const brickTop = brick.y;
        const brickBottom =
          brick.y + BRICK_HEIGHT;

        const collision =
          ballRight >= brickLeft &&
          ballLeft <= brickRight &&
          ballBottom >= brickTop &&
          ballTop <= brickBottom;

        if (!collision) continue;

        brick.alive = false;
        brick.hitFlash = 1;

        hitBrick = true;

        /*
         * Update score both in React state and in the mutable
         * score ref. The ref guarantees the terminal result
         * includes the points from the final brick.
         */
        const nextScore =
          scoreRef.current +
          10 * game.level;

        scoreRef.current = nextScore;

        setScore(nextScore);

        updateHighScore(nextScore);

        setBlocksLeft((current) =>
          Math.max(0, current - 1),
        );

        createParticles(
          game,
          brick.x + BRICK_WIDTH / 2,
          brick.y + BRICK_HEIGHT / 2,
          16,
        );

        const overlapLeft =
          ballRight - brickLeft;

        const overlapRight =
          brickRight - ballLeft;

        const overlapTop =
          ballBottom - brickTop;

        const overlapBottom =
          brickBottom - ballTop;

        const horizontalOverlap =
          Math.min(
            overlapLeft,
            overlapRight,
          );

        const verticalOverlap =
          Math.min(
            overlapTop,
            overlapBottom,
          );

        if (
          horizontalOverlap <
          verticalOverlap
        ) {
          game.dx *= -1;
        } else {
          game.dy *= -1;
        }
      }

      /*
       * Particle updates.
       */

      game.particles.forEach(
        (particle) => {
          particle.x +=
            particle.vx * delta;

          particle.y +=
            particle.vy * delta;

          particle.vy +=
            0.08 * delta;

          particle.life -=
            0.018 * delta;
        },
      );

      game.particles =
        game.particles.filter(
          (particle) =>
            particle.life > 0,
        );

      /*
       * Brick flash updates.
       */

      game.bricks.forEach((brick) => {
        if (brick.hitFlash > 0) {
          brick.hitFlash -=
            0.08 * delta;
        }
      });

      /*
       * Board cleared.
       */

      const remaining =
        game.bricks.some(
          (brick) => brick.alive,
        );

      if (!remaining) {
        drawGame(ctx, game);

        updateHighScore(scoreRef.current);

        /*
         * Save exactly one WIN result.
         */
        saveCompletedResult("win");

        setGameStatus("won");

        return;
      }

      /*
       * Ball lost.
       */

      if (
        game.ballY - BALL_RADIUS >
        CANVAS_HEIGHT
      ) {
        game.lives -= 1;

        if (game.lives <= 0) {
          drawGame(ctx, game);

          updateHighScore(scoreRef.current);

          /*
           * Save exactly one LOSS result only when
           * all lives have actually been exhausted.
           */
          saveCompletedResult("loss");

          setGameStatus("game-over");

          return;
        }

        /*
         * Losing one life does NOT save a leaderboard result.
         * The run continues.
         */
        resetBall(game);

        createParticles(
          game,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT - 35,
          20,
        );
      }

      drawGame(ctx, game);

      animationRef.current =
        requestAnimationFrame(loop);
    };

    animationRef.current =
      requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current,
        );

        animationRef.current = null;
      }
    };
  }, [
    drawGame,
    gameStatus,
    saveCompletedResult,
    score,
    updateHighScore,
  ]);

  /*
   * --------------------------------------------------------------------------
   * Keyboard
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        event.preventDefault();
        keysRef.current.left = true;
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();
        keysRef.current.right = true;
      }

      if (
        event.key === " " ||
        key === "p"
      ) {
        event.preventDefault();

        if (
          gameStatus === "playing" ||
          gameStatus === "paused"
        ) {
          togglePause();
        } else if (
          gameStatus === "ready"
        ) {
          startGame();
        }
      }

      if (
        key === "enter" &&
        gameStatus === "ready"
      ) {
        event.preventDefault();
        startGame();
      }
    };

    const handleKeyUp = (
      event: KeyboardEvent,
    ) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        keysRef.current.left = false;
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
        keysRef.current.right = false;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    window.addEventListener(
      "keyup",
      handleKeyUp,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp,
      );
    };
  }, [
    gameStatus,
    startGame,
    togglePause,
  ]);

  /*
   * --------------------------------------------------------------------------
   * Pointer / touch paddle movement
   * --------------------------------------------------------------------------
   */

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (gameStatus !== "playing") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      CANVAS_WIDTH / rect.width;

    const pointerX =
      (event.clientX - rect.left) *
      scaleX;

    gameRef.current.paddleX =
      pointerX -
      PADDLE_WIDTH / 2;

    gameRef.current.paddleX =
      Math.max(
        0,
        Math.min(
          CANVAS_WIDTH - PADDLE_WIDTH,
          gameRef.current.paddleX,
        ),
      );
  };

  /*
   * --------------------------------------------------------------------------
   * Mobile buttons
   * --------------------------------------------------------------------------
   */

  const setLeftPressed = (
    pressed: boolean,
  ) => {
    keysRef.current.left = pressed;
  };

  const setRightPressed = (
    pressed: boolean,
  ) => {
    keysRef.current.right = pressed;
  };

  const statusLabel =
    gameStatus === "playing"
      ? "LIVE"
      : gameStatus === "paused"
        ? "PAUSED"
        : gameStatus === "won"
          ? "CLEARED"
          : gameStatus === "game-over"
            ? "FINISHED"
            : "READY";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* ================================================================== */}
        {/* GameHub heading                                                     */}
        {/* ================================================================== */}

        <header className="mb-7 text-center">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-xl border-2 border-transparent bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              ← Back to GameHub
            </Link>
          </div>

          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
            style={{
              background:
                "var(--primary-soft)",
              borderColor:
                "var(--border)",
              color:
                "var(--primary-dark)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  "var(--primary)",
              }}
            />

            GameHub Mini Game
          </div>

          <h1
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{
              color:
                "var(--foreground)",
            }}
          >
            🟣 Block Breaker
          </h1>

          <p
            className="mx-auto mt-2 max-w-xl text-sm leading-6 sm:text-base"
            style={{
              color:
                "var(--muted)",
            }}
          >
            Break the blocks, control the paddle,
            survive the bounce, and chase your
            highest score.
          </p>
        </header>

        {/* ================================================================== */}
        {/* Main game shell                                                     */}
        {/* ================================================================== */}

        <section
          className="overflow-hidden rounded-[2rem] border"
          style={{
            background:
              "var(--card)",
            borderColor:
              "var(--border)",
            boxShadow:
              "0 24px 80px var(--shadow-color)",
          }}
        >
          {/* ================================================================ */}
          {/* HUD                                                               */}
          {/* ================================================================ */}

          <div
            className="grid grid-cols-2 gap-px border-b sm:grid-cols-5"
            style={{
              background:
                "var(--border)",
              borderColor:
                "var(--border)",
            }}
          >
            <div
              className="px-4 py-4 sm:px-5"
              style={{
                background:
                  "var(--card)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Score
              </p>

              <p
                className="mt-1 text-xl font-black tabular-nums"
                style={{
                  color:
                    "var(--foreground)",
                }}
              >
                {score}
              </p>
            </div>

            <div
              className="px-4 py-4 sm:px-5"
              style={{
                background:
                  "var(--card)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Blocks
              </p>

              <p
                className="mt-1 text-xl font-black tabular-nums"
                style={{
                  color:
                    "var(--foreground)",
                }}
              >
                {blocksLeft}
              </p>
            </div>

            <div
              className="px-4 py-4 sm:px-5"
              style={{
                background:
                  "var(--card)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Level
              </p>

              <p
                className="mt-1 text-xl font-black"
                style={{
                  color:
                    "var(--foreground)",
                }}
              >
                {gameRef.current.level}
              </p>
            </div>

            <div
              className="px-4 py-4 sm:px-5"
              style={{
                background:
                  "var(--card)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Lives
              </p>

              <p
                className="mt-1 text-lg font-black"
                aria-label={`${gameRef.current.lives} lives remaining`}
              >
                {"❤️".repeat(
                  Math.max(
                    0,
                    gameRef.current.lives,
                  ),
                )}
                {"🖤".repeat(
                  Math.max(
                    0,
                    STARTING_LIVES -
                      gameRef.current.lives,
                  ),
                )}
              </p>
            </div>

            <div
              className="col-span-2 flex items-center justify-between px-4 py-4 sm:col-span-1 sm:px-5"
              style={{
                background:
                  "var(--card)",
              }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  Status
                </p>

                <p
                  className="mt-1 text-sm font-black"
                  style={{
                    color:
                      gameStatus ===
                      "playing"
                        ? "var(--primary)"
                        : "var(--foreground)",
                  }}
                >
                  {statusLabel}
                </p>
              </div>

              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    gameStatus ===
                    "playing"
                      ? "var(--primary)"
                      : "var(--border)",
                  boxShadow:
                    gameStatus ===
                    "playing"
                      ? "0 0 14px var(--primary)"
                      : "none",
                }}
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* Canvas stage                                                      */}
          {/* ================================================================ */}

          <div className="p-3 sm:p-5">
            <div
              className="relative overflow-hidden rounded-[1.5rem] border"
              style={{
                background:
                  "#020617",
                borderColor:
                  "var(--border)",
                boxShadow:
                  "inset 0 0 60px rgba(0,0,0,0.35)",
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerMove={
                  handlePointerMove
                }
                onPointerEnter={() => {
                  pointerActiveRef.current =
                    true;
                }}
                onPointerLeave={() => {
                  pointerActiveRef.current =
                    false;
                }}
                className="block h-auto w-full select-none"
                style={{
                  touchAction:
                    "none",
                }}
              />

              {/* ------------------------------------------------------------ */}
              {/* Center overlay                                                 */}
              {/* ------------------------------------------------------------ */}

              {gameStatus !==
                "playing" && (
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <div
                    className="w-full max-w-sm rounded-[1.75rem] border p-7 text-center backdrop-blur-xl"
                    style={{
                      background:
                        "rgba(15, 23, 42, 0.88)",
                      borderColor:
                        "rgba(148,163,184,0.18)",
                      boxShadow:
                        "0 24px 70px rgba(0,0,0,0.40)",
                    }}
                  >
                    <div
                      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                      style={{
                        background:
                          "rgba(20,184,166,0.12)",
                        border:
                          "1px solid rgba(20,184,166,0.20)",
                      }}
                    >
                      {gameStatus ===
                      "won"
                        ? "🏆"
                        : gameStatus ===
                            "game-over"
                          ? "💥"
                          : gameStatus ===
                              "paused"
                            ? "⏸️"
                            : "🧱"}
                    </div>

                    <h2 className="text-2xl font-black text-white">
                      {gameStatus ===
                      "won"
                        ? "Board Cleared!"
                        : gameStatus ===
                            "game-over"
                          ? "Game Over"
                          : gameStatus ===
                              "paused"
                            ? "Game Paused"
                            : "Ready to Break?"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {gameStatus ===
                      "won"
                        ? `You finished with ${score} points.`
                        : gameStatus ===
                            "game-over"
                          ? `Final score: ${score}. Try another run.`
                          : gameStatus ===
                              "paused"
                            ? "Take a breath. Resume when you're ready."
                            : "Destroy every block while keeping the ball in play."}
                    </p>

                    <button
                      type="button"
                      onClick={
                        gameStatus ===
                        "paused"
                          ? togglePause
                          : startGame
                      }
                      className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background:
                          "var(--primary)",
                        boxShadow:
                          "0 10px 30px rgba(20,184,166,0.20)",
                      }}
                    >
                      {gameStatus ===
                      "paused"
                        ? "Resume Game"
                        : gameStatus ===
                            "ready"
                          ? "Start Game"
                          : "Play Again"}

                      <span className="ml-2">
                        →
                      </span>
                    </button>

                    {gameStatus !==
                      "paused" &&
                      highScore > 0 && (
                        <p className="mt-4 text-xs font-medium text-slate-500">
                          Best score:{" "}
                          <span className="font-bold text-slate-300">
                            {highScore}
                          </span>
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* Pause button                                                   */}
              {/* ------------------------------------------------------------ */}

              {gameStatus ===
                "playing" && (
                <button
                  type="button"
                  onClick={
                    togglePause
                  }
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-0.5"
                  style={{
                    background:
                      "rgba(15,23,42,0.60)",
                    borderColor:
                      "rgba(148,163,184,0.18)",
                  }}
                  aria-label="Pause game"
                  title="Pause game"
                >
                  ⏸
                </button>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Controls                                                          */}
          {/* ================================================================ */}

          <div
            className="border-t px-4 py-5 sm:px-6"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--surface-soft)",
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p
                  className="font-bold"
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  Controls
                </p>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  Move with{" "}
                  <strong>
                    ← →
                  </strong>{" "}
                  or{" "}
                  <strong>
                    A / D
                  </strong>
                  . You can also move the paddle
                  with your mouse or finger.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {gameStatus ===
                  "playing" && (
                  <button
                    type="button"
                    onClick={
                      togglePause
                    }
                    className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
                    style={{
                      background:
                        "var(--card)",
                      borderColor:
                        "var(--border)",
                      color:
                        "var(--foreground)",
                    }}
                  >
                    Pause
                  </button>
                )}

                {gameStatus !==
                  "ready" && (
                  <button
                    type="button"
                    onClick={
                      startGame
                    }
                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                    style={{
                      background:
                        "var(--primary)",
                    }}
                  >
                    Restart
                  </button>
                )}
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Mobile controls                                                 */}
            {/* -------------------------------------------------------------- */}

            {gameStatus ===
              "playing" && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
                <button
                  type="button"
                  aria-label="Move paddle left"
                  onPointerDown={() =>
                    setLeftPressed(
                      true,
                    )
                  }
                  onPointerUp={() =>
                    setLeftPressed(
                      false,
                    )
                  }
                  onPointerCancel={() =>
                    setLeftPressed(
                      false,
                    )
                  }
                  onPointerLeave={() =>
                    setLeftPressed(
                      false,
                    )
                  }
                  className="flex h-14 items-center justify-center rounded-2xl border text-2xl font-black"
                  style={{
                    background:
                      "var(--card)",
                    borderColor:
                      "var(--border)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  ←
                </button>

                <button
                  type="button"
                  aria-label="Move paddle right"
                  onPointerDown={() =>
                    setRightPressed(
                      true,
                    )
                  }
                  onPointerUp={() =>
                    setRightPressed(
                      false,
                    )
                  }
                  onPointerCancel={() =>
                    setRightPressed(
                      false,
                    )
                  }
                  onPointerLeave={() =>
                    setRightPressed(
                      false,
                    )
                  }
                  className="flex h-14 items-center justify-center rounded-2xl border text-2xl font-black"
                  style={{
                    background:
                      "var(--card)",
                    borderColor:
                      "var(--border)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================== */}
        {/* Game information                                                    */}
        {/* ================================================================== */}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-5"
            style={{
              background:
                "var(--card)",
              borderColor:
                "var(--border)",
            }}
          >
            <div className="mb-3 text-xl">
              🎯
            </div>

            <h3
              className="font-bold"
              style={{
                color:
                  "var(--foreground)",
              }}
            >
              Break the Board
            </h3>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Hit every brick to clear the
              level and maximize your score.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              background:
                "var(--card)",
              borderColor:
                "var(--border)",
            }}
          >
            <div className="mb-3 text-xl">
              ❤️
            </div>

            <h3
              className="font-bold"
              style={{
                color:
                  "var(--foreground)",
              }}
            >
              Protect Your Lives
            </h3>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              You have three lives. Keep the
              ball bouncing to stay in the game.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              background:
                "var(--card)",
              borderColor:
                "var(--border)",
            }}
          >
            <div className="mb-3 text-xl">
              🏆
            </div>

            <h3
              className="font-bold"
              style={{
                color:
                  "var(--foreground)",
              }}
            >
              Chase Your Record
            </h3>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Your best score is saved locally
              so every run becomes a challenge.
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Footer hint                                                         */}
        {/* ================================================================== */}

        <p
          className="mt-6 text-center text-xs"
          style={{
            color:
              "var(--muted)",
          }}
        >
          Press{" "}
          <strong
            style={{
              color:
                "var(--foreground)",
            }}
          >
            Space
          </strong>{" "}
          or{" "}
          <strong
            style={{
              color:
                "var(--foreground)",
            }}
          >
            P
          </strong>{" "}
          to pause or resume.
        </p>
      </div>
    </main>
  );
}