"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { saveResult } from "@/lib/game";

type GameStatus = "ready" | "playing" | "paused" | "game-over";

type ObstacleType = "cactus" | "rock";

type Obstacle = {
  x: number;
  width: number;
  height: number;
  type: ObstacleType;
  variant: number;
};

type Cloud = {
  x: number;
  y: number;
  speed: number;
  scale: number;
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
  dinoY: number;
  velocityY: number;
  grounded: boolean;
  obstacles: Obstacle[];
  clouds: Cloud[];
  particles: Particle[];
  groundOffset: number;
  score: number;
  speed: number;
  elapsed: number;
  spawnTimer: number;
  runFrame: number;
  flash: number;
  distance: number;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 430;

const GROUND_Y = 342;

const DINO_WIDTH = 56;
const DINO_HEIGHT = 64;

const GRAVITY = 0.72;
const JUMP_VELOCITY = -13.5;

const BASE_SPEED = 6;
const MAX_SPEED = 13;

const HIGH_SCORE_KEY = "gamehub-dino-runner-high-score";

function createInitialGame(): GameState {
  return {
    dinoY: GROUND_Y - DINO_HEIGHT,
    velocityY: 0,
    grounded: true,
    obstacles: [],
    clouds: [
      { x: 130, y: 75, speed: 0.35, scale: 1 },
      { x: 480, y: 120, speed: 0.22, scale: 0.72 },
      { x: 760, y: 65, speed: 0.3, scale: 0.9 },
    ],
    particles: [],
    groundOffset: 0,
    score: 0,
    speed: BASE_SPEED,
    elapsed: 0,
    spawnTimer: 1.25,
    runFrame: 0,
    flash: 0,
    distance: 0,
  };
}

function pixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.round(width),
    Math.round(height),
  );
}

function drawPixelCloud(
  ctx: CanvasRenderingContext2D,
  cloud: Cloud,
) {
  const s = cloud.scale;
  const x = Math.round(cloud.x);
  const y = Math.round(cloud.y);

  pixel(ctx, x, y + 12 * s, 74 * s, 15 * s, "#ffffff");
  pixel(ctx, x + 10 * s, y + 4 * s, 24 * s, 18 * s, "#ffffff");
  pixel(ctx, x + 30 * s, y - 2 * s, 27 * s, 24 * s, "#ffffff");
  pixel(ctx, x + 51 * s, y + 7 * s, 22 * s, 18 * s, "#ffffff");
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  y: number,
  frame: number,
  grounded: boolean,
) {
  const x = 95;
  const step = frame % 2 === 0 ? 0 : 4;

  const dark = "#172033";
  const body = "#4ade80";
  const bodyDark = "#22c55e";
  const light = "#86efac";
  const eye = "#ffffff";
  const pupil = "#111827";

  // Tail
  pixel(ctx, x - 15, y + 30, 20, 9, bodyDark);
  pixel(ctx, x - 23, y + 35, 12, 7, bodyDark);

  // Main body
  pixel(ctx, x + 8, y + 24, 38, 29, body);
  pixel(ctx, x + 17, y + 16, 28, 16, body);

  // Head
  pixel(ctx, x + 31, y + 3, 34, 29, body);
  pixel(ctx, x + 47, y + 13, 25, 16, body);

  // Snout
  pixel(ctx, x + 63, y + 19, 17, 9, bodyDark);

  // Back / spikes
  pixel(ctx, x + 10, y + 17, 8, 9, bodyDark);
  pixel(ctx, x + 19, y + 12, 8, 11, bodyDark);
  pixel(ctx, x + 29, y + 10, 8, 10, bodyDark);

  // Eye
  pixel(ctx, x + 51, y + 9, 7, 7, eye);
  pixel(ctx, x + 54, y + 11, 4, 4, pupil);

  // Jaw
  pixel(ctx, x + 52, y + 29, 18, 5, dark);

  // Belly
  pixel(ctx, x + 17, y + 43, 27, 9, light);

  // Arm
  pixel(ctx, x + 39, y + 34, 8, 18, bodyDark);
  pixel(ctx, x + 45, y + 48, 11, 6, bodyDark);

  // Legs
  if (!grounded) {
    pixel(ctx, x + 17, y + 50, 10, 14, bodyDark);
    pixel(ctx, x + 35, y + 50, 10, 10, bodyDark);

    pixel(ctx, x + 12, y + 61, 17, 5, dark);
    pixel(ctx, x + 33, y + 58, 17, 5, dark);
  } else if (step === 0) {
    pixel(ctx, x + 14, y + 49, 11, 15, bodyDark);
    pixel(ctx, x + 37, y + 50, 10, 12, bodyDark);

    pixel(ctx, x + 10, y + 61, 18, 5, dark);
    pixel(ctx, x + 35, y + 59, 17, 5, dark);
  } else {
    pixel(ctx, x + 18, y + 49, 10, 12, bodyDark);
    pixel(ctx, x + 38, y + 49, 11, 15, bodyDark);

    pixel(ctx, x + 16, y + 58, 17, 5, dark);
    pixel(ctx, x + 39, y + 61, 18, 5, dark);
  }

  // Pixel highlights
  pixel(ctx, x + 12, y + 29, 7, 7, light);
  pixel(ctx, x + 25, y + 25, 6, 6, light);
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
) {
  const x = obstacle.x;
  const bottom = GROUND_Y;
  const top = bottom - obstacle.height;

  const dark = "#14532d";
  const green = "#22c55e";
  const light = "#86efac";

  pixel(ctx, x + 12, top, obstacle.width - 20, obstacle.height, dark);
  pixel(ctx, x + 17, top + 4, obstacle.width - 28, obstacle.height - 4, green);

  if (obstacle.variant % 2 === 0) {
    pixel(ctx, x, top + 25, 15, 9, dark);
    pixel(ctx, x - 6, top + 17, 10, 18, dark);

    pixel(ctx, x + obstacle.width - 5, top + 42, 14, 9, dark);
    pixel(ctx, x + obstacle.width + 3, top + 33, 8, 19, dark);
  } else {
    pixel(ctx, x + obstacle.width - 7, top + 18, 15, 9, dark);
    pixel(ctx, x + obstacle.width + 3, top + 10, 9, 18, dark);
  }

  pixel(ctx, x + 20, top + 10, 5, 12, light);
  pixel(ctx, x + 20, top + 32, 5, 10, light);
}

function drawRock(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
) {
  const x = obstacle.x;
  const bottom = GROUND_Y;
  const top = bottom - obstacle.height;

  pixel(ctx, x + 3, top + 10, obstacle.width - 6, obstacle.height - 10, "#334155");
  pixel(ctx, x + 10, top + 3, obstacle.width - 18, obstacle.height - 3, "#64748b");
  pixel(ctx, x + 17, top, 15, 8, "#94a3b8");

  pixel(ctx, x + 12, top + 13, 7, 6, "#cbd5e1");
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  offset: number,
) {
  pixel(ctx, 0, GROUND_Y, CANVAS_WIDTH, 88, "#d1d5db");
  pixel(ctx, 0, GROUND_Y, CANVAS_WIDTH, 6, "#475569");

  for (let x = -40; x < CANVAS_WIDTH + 40; x += 40) {
    const px = x - (offset % 40);

    pixel(ctx, px, GROUND_Y + 18, 22, 5, "#64748b");
    pixel(ctx, px + 25, GROUND_Y + 34, 10, 4, "#94a3b8");
    pixel(ctx, px + 7, GROUND_Y + 52, 16, 4, "#64748b");
    pixel(ctx, px + 29, GROUND_Y + 68, 8, 4, "#94a3b8");
  }
}

function drawMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
  height: number,
  color: string,
) {
  const base = GROUND_Y;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + width * 0.45, base - height);
  ctx.lineTo(x + width, base);
  ctx.closePath();
  ctx.fill();

  pixel(
    ctx,
    x + width * 0.38,
    base - height * 0.48,
    width * 0.12,
    7,
    "#ffffff",
  );
  pixel(
    ctx,
    x + width * 0.48,
    base - height * 0.38,
    width * 0.1,
    7,
    "#ffffff",
  );
}

export default function DinoRunnerPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createInitialGame());
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const resultSavedRef = useRef(false);

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState(BASE_SPEED);
  const [distance, setDistance] = useState(0);

  const drawScene = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      game: GameState,
    ) => {
      ctx.imageSmoothingEnabled = false;

      // Sky
      const sky = ctx.createLinearGradient(
        0,
        0,
        0,
        CANVAS_HEIGHT,
      );

      sky.addColorStop(0, "#bfdbfe");
      sky.addColorStop(0.62, "#e0f2fe");
      sky.addColorStop(1, "#fef3c7");

      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sun
      pixel(ctx, 720, 54, 42, 42, "#facc15");
      pixel(ctx, 710, 64, 62, 22, "#fde047");
      pixel(ctx, 730, 44, 22, 62, "#fde047");

      // Clouds
      game.clouds.forEach((cloud) => {
        drawPixelCloud(ctx, cloud);
      });

      // Distant mountains
      drawMountain(
        ctx,
        -40,
        280,
        105,
        "#bfdbfe",
      );

      drawMountain(
        ctx,
        170,
        320,
        135,
        "#93c5fd",
      );

      drawMountain(
        ctx,
        460,
        350,
        115,
        "#bfdbfe",
      );

      drawMountain(
        ctx,
        720,
        300,
        125,
        "#93c5fd",
      );

      // Distant bushes
      for (let x = 0; x < CANVAS_WIDTH; x += 55) {
        pixel(
          ctx,
          x - (game.groundOffset * 0.25) % 55,
          GROUND_Y - 19,
          32,
          19,
          "#86efac",
        );
      }

      // Ground
      drawGround(ctx, game.groundOffset);

      // Obstacles
      game.obstacles.forEach((obstacle) => {
        if (obstacle.type === "cactus") {
          drawCactus(ctx, obstacle);
        } else {
          drawRock(ctx, obstacle);
        }
      });

      // Dino shadow
      pixel(
        ctx,
        87,
        GROUND_Y + 2,
        74,
        6,
        "rgba(15,23,42,0.16)",
      );

      // Dino
      drawDino(
        ctx,
        game.dinoY,
        game.runFrame,
        game.grounded,
      );

      // Dust particles
      game.particles.forEach((particle) => {
        const alpha = Math.max(
          0,
          particle.life / particle.maxLife,
        );

        ctx.globalAlpha = alpha;

        pixel(
          ctx,
          particle.x,
          particle.y,
          particle.size,
          particle.size,
          "#64748b",
        );
      });

      ctx.globalAlpha = 1;

      // Pixel border
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

      // Damage flash
      if (game.flash > 0) {
        ctx.fillStyle = `rgba(239,68,68,${Math.min(
          0.45,
          game.flash,
        )})`;

        ctx.fillRect(
          0,
          0,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
        );
      }
    },
    [],
  );

  const resetGame = useCallback(() => {
    gameRef.current = createInitialGame();
    resultSavedRef.current = false;

    setScore(0);
    setSpeedDisplay(BASE_SPEED);
    setDistance(0);
    setStatus("ready");
  }, []);

  const startGame = useCallback(() => {
    const game = createInitialGame();

    gameRef.current = game;
    resultSavedRef.current = false;
    lastTimeRef.current = performance.now();

    setScore(0);
    setSpeedDisplay(BASE_SPEED);
    setDistance(0);
    setStatus("playing");
  }, []);

  const finishGame = useCallback(() => {
    const game = gameRef.current;

    if (resultSavedRef.current) {
      return;
    }

    resultSavedRef.current = true;

    const finalScore = Math.floor(game.score);

    setScore(finalScore);
    setDistance(Math.floor(game.distance));

    if (finalScore > highScore) {
      setHighScore(finalScore);

      try {
        localStorage.setItem(
          HIGH_SCORE_KEY,
          String(finalScore),
        );
      } catch {
        // Ignore storage failures.
      }
    }

    saveResult("loss", finalScore);
    setStatus("game-over");
  }, [highScore]);

  const jump = useCallback(() => {
    const game = gameRef.current;

    if (status === "ready") {
      startGame();
      return;
    }

    if (status !== "playing") {
      return;
    }

    if (!game.grounded) {
      return;
    }

    game.velocityY = JUMP_VELOCITY;
    game.grounded = false;

    for (let i = 0; i < 5; i += 1) {
      game.particles.push({
        x: 105 + Math.random() * 25,
        y: GROUND_Y - 3,
        vx: -Math.random() * 2,
        vy: -Math.random() * 2,
        life: 20,
        maxLife: 20,
        size: 4,
      });
    }
  }, [startGame, status]);

  const togglePause = useCallback(() => {
    setStatus((current) => {
      if (current === "playing") {
        return "paused";
      }

      if (current === "paused") {
        lastTimeRef.current = performance.now();
        return "playing";
      }

      return current;
    });
  }, []);

  // Load high score.
  useEffect(() => {
    try {
      const saved = Number(
        localStorage.getItem(HIGH_SCORE_KEY) ?? "0",
      );

      if (Number.isFinite(saved)) {
        setHighScore(saved);
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
      ) {
        event.preventDefault();
        jump();
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        togglePause();
      }

      if (
        event.code === "Enter" &&
        (status === "ready" || status === "game-over")
      ) {
        event.preventDefault();
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [jump, startGame, status, togglePause]);

  // Main game loop.
  useEffect(() => {
    if (status !== "playing") {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = Math.min(
        (now - lastTimeRef.current) / 1000,
        0.033,
      );

      lastTimeRef.current = now;

      const game = gameRef.current;

      game.elapsed += deltaSeconds;
      game.runFrame += 1;

      // Gradually increase difficulty.
      game.speed = Math.min(
        MAX_SPEED,
        BASE_SPEED + game.elapsed * 0.085,
      );

      game.distance +=
        game.speed * deltaSeconds * 8;

      game.score +=
        game.speed * deltaSeconds * 1.55;

      // Dino physics.
      game.velocityY +=
        GRAVITY * deltaSeconds * 60;

      game.dinoY +=
        game.velocityY * deltaSeconds * 60;

      const floorY = GROUND_Y - DINO_HEIGHT;

      if (game.dinoY >= floorY) {
        game.dinoY = floorY;
        game.velocityY = 0;

        if (!game.grounded) {
          for (let i = 0; i < 4; i += 1) {
            game.particles.push({
              x: 100 + Math.random() * 35,
              y: GROUND_Y - 3,
              vx: -Math.random() * 2,
              vy: -Math.random() * 1.5,
              life: 18,
              maxLife: 18,
              size: 4,
            });
          }
        }

        game.grounded = true;
      }

      // World movement.
      game.groundOffset +=
        game.speed * deltaSeconds * 60;

      game.clouds.forEach((cloud) => {
        cloud.x -=
          cloud.speed *
          game.speed *
          deltaSeconds *
          7;

        if (cloud.x < -120) {
          cloud.x = CANVAS_WIDTH + 80;
          cloud.y = 45 + Math.random() * 90;
        }
      });

      // Obstacle spawning.
      game.spawnTimer -= deltaSeconds;

      if (game.spawnTimer <= 0) {
        const cactus =
          Math.random() > 0.24;

        const width = cactus
          ? 38 + Math.random() * 12
          : 48 + Math.random() * 16;

        const height = cactus
          ? 52 + Math.random() * 45
          : 28 + Math.random() * 18;

        game.obstacles.push({
          x: CANVAS_WIDTH + 40,
          width,
          height,
          type: cactus
            ? "cactus"
            : "rock",
          variant: Math.floor(
            Math.random() * 4,
          ),
        });

        const difficultyFactor = Math.max(
          0.58,
          1 - game.elapsed / 140,
        );

        game.spawnTimer =
          (0.95 + Math.random() * 0.8) *
          difficultyFactor;
      }

      // Move obstacles.
      game.obstacles.forEach((obstacle) => {
        obstacle.x -=
          game.speed *
          deltaSeconds *
          60;
      });

      game.obstacles =
        game.obstacles.filter(
          (obstacle) =>
            obstacle.x >
            -obstacle.width - 40,
        );

      // Particles.
      game.particles.forEach((particle) => {
        particle.x +=
          particle.vx *
          deltaSeconds *
          60;

        particle.y +=
          particle.vy *
          deltaSeconds *
          60;

        particle.vy +=
          0.08 *
          deltaSeconds *
          60;

        particle.life -=
          deltaSeconds * 60;
      });

      game.particles =
        game.particles.filter(
          (particle) => particle.life > 0,
        );

      // Collision detection.
      const dinoBox = {
        x: 104,
        y: game.dinoY + 8,
        width: 43,
        height: 52,
      };

      const collision = game.obstacles.some(
        (obstacle) => {
          const obstacleTop =
            GROUND_Y - obstacle.height;

          const obstacleBox = {
            x: obstacle.x + 5,
            y: obstacleTop + 4,
            width: Math.max(
              8,
              obstacle.width - 10,
            ),
            height:
              obstacle.height - 4,
          };

          return (
            dinoBox.x <
              obstacleBox.x +
                obstacleBox.width &&
            dinoBox.x +
              dinoBox.width >
              obstacleBox.x &&
            dinoBox.y <
              obstacleBox.y +
                obstacleBox.height &&
            dinoBox.y +
              dinoBox.height >
              obstacleBox.y
          );
        },
      );

      if (collision) {
        game.flash = 0.45;

        for (let i = 0; i < 16; i += 1) {
          game.particles.push({
            x: 120 + Math.random() * 40,
            y:
              game.dinoY +
              20 +
              Math.random() * 35,
            vx:
              (Math.random() - 0.5) * 5,
            vy:
              (Math.random() - 0.5) * 5,
            life: 28,
            maxLife: 28,
            size:
              Math.random() > 0.5
                ? 4
                : 6,
          });
        }

        drawScene(ctx, game);
        finishGame();
        return;
      }

      game.flash = Math.max(
        0,
        game.flash -
          deltaSeconds * 2.5,
      );

      setScore(
        Math.floor(game.score),
      );

      setSpeedDisplay(
        Number(game.speed.toFixed(1)),
      );

      setDistance(
        Math.floor(game.distance),
      );

      if (game.score > highScore) {
        setHighScore(
          Math.floor(game.score),
        );
      }

      drawScene(ctx, game);

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
      }
    };
  }, [
    drawScene,
    finishGame,
    highScore,
    status,
  ]);

  // Draw ready / paused / game-over state.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    drawScene(ctx, gameRef.current);
  }, [drawScene, status]);

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link
            href="/"
            className="inline-flex w-fit items-center rounded-xl border-2 border-transparent bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            ← Back to GameHub
          </Link>
</div>
            <h1 className="text-4xl font-black tracking-tight sm:text-4xl">
              🦖 Dino Runner
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"
              style={{
                color: "var(--muted)",
              }}
            >
              Run, jump, dodge obstacles, and
              survive the longest while chasing
              a new GameHub high score.
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--card)",
              color:
                "var(--foreground)",
              boxShadow:
                "0 8px 25px var(--shadow-color)",
            }}
          >
            🏆 View Leaderboard
          </Link>
        </div>

        {/* Game shell */}
        <section
          className="overflow-hidden rounded-[2rem] border"
          style={{
            borderColor:
              "var(--border)",
            background:
              "var(--card)",
            boxShadow:
              "0 20px 60px var(--shadow-color)",
          }}
        >
          {/* HUD */}
          <div
            className="grid grid-cols-2 border-b sm:grid-cols-5"
            style={{
              borderColor:
                "var(--border)",
            }}
          >
            {[
              ["Score", score],
              ["Best", highScore],
              ["Speed", `${speedDisplay}x`],
              ["Distance", `${distance}m`],
              [
                "Status",
                status === "game-over"
                  ? "Over"
                  : status === "paused"
                    ? "Paused"
                    : status === "playing"
                      ? "Running"
                      : "Ready",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-b p-4 sm:border-b-0 sm:border-r last:border-r-0"
                style={{
                  borderColor:
                    "var(--border)",
                }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  {label}
                </div>

                <div className="mt-1 font-mono text-xl font-black">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative overflow-hidden p-3 sm:p-5">
            <div
              className="relative overflow-hidden rounded-2xl border"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "#dbeafe",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,.25)",
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                aria-label="Dino Runner game"
                className="block h-auto w-full"
                style={{
                  imageRendering:
                    "pixelated",
                  touchAction:
                    "manipulation",
                }}
                onPointerDown={() => {
                  if (
                    status ===
                    "game-over"
                  ) {
                    startGame();
                  } else {
                    jump();
                  }
                }}
              />

              {/* Ready overlay */}
              {status === "ready" && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div
                    className="max-w-md rounded-3xl border p-7 text-center backdrop-blur-md"
                    style={{
                      borderColor:
                        "rgba(15,23,42,.15)",
                      background:
                        "rgba(255,255,255,.84)",
                      color:
                        "#0f172a",
                      boxShadow:
                        "0 20px 60px rgba(15,23,42,.18)",
                    }}
                  >
                    <div className="text-5xl">
                      🦖
                    </div>

                    <h2 className="mt-3 text-2xl font-black">
                      Ready to Run?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Press Space, ↑, W, or
                      tap the game to jump.
                    </p>

                    <button
                      type="button"
                      onClick={startGame}
                      className="mt-5 rounded-xl px-6 py-3 font-black text-white transition hover:-translate-y-0.5"
                      style={{
                        background:
                          "var(--primary-dark)",
                        boxShadow:
                          "0 10px 25px rgba(11,180,170,.25)",
                      }}
                    >
                      Start Run
                    </button>
                  </div>
                </div>
              )}

              {/* Paused overlay */}
              {status === "paused" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 p-6">
                  <div
                    className="rounded-3xl border p-7 text-center backdrop-blur-md"
                    style={{
                      borderColor:
                        "rgba(255,255,255,.2)",
                      background:
                        "rgba(15,23,42,.88)",
                      color:
                        "#ffffff",
                    }}
                  >
                    <div className="text-4xl">
                      ⏸️
                    </div>

                    <h2 className="mt-3 text-2xl font-black">
                      Game Paused
                    </h2>

                    <button
                      type="button"
                      onClick={togglePause}
                      className="mt-5 rounded-xl px-6 py-3 font-black text-white"
                      style={{
                        background:
                          "var(--primary)",
                      }}
                    >
                      Resume
                    </button>
                  </div>
                </div>
              )}

              {/* Game over overlay */}
              {status === "game-over" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 p-6">
                  <div
                    className="w-full max-w-md rounded-3xl border p-7 text-center backdrop-blur-md"
                    style={{
                      borderColor:
                        "rgba(255,255,255,.2)",
                      background:
                        "rgba(15,23,42,.9)",
                      color:
                        "#ffffff",
                    }}
                  >
                    <div className="text-5xl">
                      💥
                    </div>

                    <h2 className="mt-3 text-3xl font-black">
                      Run Over
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      The dinosaur hit an
                      obstacle.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                          Score
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black">
                          {score}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                          Best
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black">
                          {highScore}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={startGame}
                        className="flex-1 rounded-xl px-5 py-3 font-black text-white"
                        style={{
                          background:
                            "var(--primary)",
                        }}
                      >
                        Run Again
                      </button>

                      <Link
                        href="/leaderboard"
                        className="flex-1 rounded-xl border px-5 py-3 font-black"
                        style={{
                          borderColor:
                            "rgba(255,255,255,.2)",
                          background:
                            "rgba(255,255,255,.08)",
                        }}
                      >
                        🏆 Leaderboard
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div
            className="border-t p-5 sm:p-6"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--surface-soft)",
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  Controls
                </div>

                <p
                  className="mt-2 text-sm"
                  style={{
                    color:
                      "var(--foreground)",
                  }}
                >
                  Space / ↑ / W / Tap
                  <span
                    className="mx-2"
                    style={{
                      color:
                        "var(--muted)",
                    }}
                  >
                    →
                  </span>
                  Jump
                  <span
                    className="mx-2"
                    style={{
                      color:
                        "var(--muted)",
                    }}
                  >
                    •
                  </span>
                  P
                  <span
                    className="mx-2"
                    style={{
                      color:
                        "var(--muted)",
                    }}
                  >
                    →
                  </span>
                  Pause
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={
                    status === "ready" ||
                    status ===
                      "game-over"
                  }
                  className="rounded-xl border px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "var(--card)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  {status === "paused"
                    ? "▶ Resume"
                    : "⏸ Pause"}
                </button>

                <button
                  type="button"
                  onClick={resetGame}
                  className="rounded-xl px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                  style={{
                    background:
                      "var(--primary-dark)",
                  }}
                >
                  ↻ Restart
                </button>

                <Link
                  href="/leaderboard"
                  className="rounded-xl border px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "var(--card)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  🏆 Leaderboard
                </Link>
              </div>
            </div>

            {/* Mobile jump control */}
            <div className="mt-5 grid grid-cols-1 sm:hidden">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  jump();
                }}
                className="rounded-2xl px-6 py-5 text-lg font-black text-white active:scale-[0.98]"
                style={{
                  background:
                    "var(--primary)",
                  boxShadow:
                    "0 10px 25px rgba(11,180,170,.22)",
                }}
              >
                🦖 JUMP
              </button>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🦖",
              title: "React Fast",
              text: "Jump over every cactus and rock before it reaches your lane.",
            },
            {
              icon: "⚡",
              title: "Speed Increases",
              text: "The longer you survive, the faster the world moves.",
            },
            {
              icon: "🏆",
              title: "Build Your Score",
              text: "Finished runs contribute to your GameHub statistics and leaderboard.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border p-5"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
                boxShadow:
                  "0 8px 25px var(--shadow-color)",
              }}
            >
              <div className="text-2xl">
                {item.icon}
              </div>

              <h3 className="mt-3 font-black">
                {item.title}
              </h3>

              <p
                className="mt-2 text-sm leading-6"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </section>

        <p
          className="mt-6 text-center text-xs"
          style={{
            color: "var(--muted)",
          }}
        >
          GameHub • Dino Runner • Keep
          running, keep improving.
        </p>
      </div>
    </main>
  );
}