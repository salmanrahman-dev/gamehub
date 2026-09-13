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

type Pattern = 0 | 1 | 2;

type Pipe = {
  x: number;
  gapY: number;
  gapSize: number;
  width: number;
  passed: boolean;
  pattern: Pattern;
};

type Coin = {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  rotation: number;
  bob: number;
};

type Cloud = {
  x: number;
  y: number;
  width: number;
  speed: number;
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

type Star = {
  x: number;
  y: number;
  size: number;
  twinkle: number;
};

type GameState = {
  birdY: number;
  velocityY: number;
  rotation: number;

  pipes: Pipe[];
  coins: Coin[];
  clouds: Cloud[];
  particles: Particle[];
  stars: Star[];

  groundOffset: number;

  score: number;
  coinsCollected: number;
  lives: number;

  speed: number;
  elapsed: number;
  pipeTimer: number;
  coinTimer: number;

  flapFrame: number;
  flash: number;
  distance: number;

  pattern: Pattern;
  patternTimer: number;

  started: boolean;
  invulnerable: number;
};

const WIDTH = 900;
const HEIGHT = 560;

const BIRD_X = 190;
const BIRD_SIZE = 34;

const GRAVITY = 0.38;
const FLAP_POWER = -7.6;

const BASE_SPEED = 3.25;
const MAX_SPEED = 7.2;

const PIPE_WIDTH = 72;
const INITIAL_LIVES = 3;

const GROUND_HEIGHT = 72;
const PLAY_BOTTOM = HEIGHT - GROUND_HEIGHT;

const STORAGE_KEY = "gamehub-sky-hopper-best";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createInitialGame(bestScore = 0): GameState {
  const stars: Star[] = Array.from({ length: 65 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * (HEIGHT - GROUND_HEIGHT - 100),
    size: randomBetween(1, 3),
    twinkle: Math.random() * Math.PI * 2,
  }));

  const clouds: Cloud[] = Array.from({ length: 7 }, (_, index) => ({
    x: index * 170 + Math.random() * 80,
    y: 70 + Math.random() * 170,
    width: 70 + Math.random() * 80,
    speed: 0.25 + Math.random() * 0.35,
  }));

  return {
    birdY: HEIGHT / 2 - 30,
    velocityY: 0,
    rotation: 0,

    pipes: [],
    coins: [],
    clouds,
    particles: [],
    stars,

    groundOffset: 0,

    score: 0,
    coinsCollected: 0,
    lives: INITIAL_LIVES,

    speed: BASE_SPEED,
    elapsed: 0,
    pipeTimer: 0,
    coinTimer: 0,

    flapFrame: 0,
    flash: 0,
    distance: 0,

    pattern: 0,
    patternTimer: 0,

    started: false,
    invulnerable: 0,
  };
}

export default function SkyHopperPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gameRef = useRef<GameState | null>(null);
  const animationRef = useRef<number | null>(null);

  const statusRef = useRef<GameStatus>("ready");
  const highScoreRef = useRef(0);
  const resultSavedRef = useRef(false);

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [pattern, setPattern] = useState<Pattern>(0);

  const setGameStatus = useCallback((next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY) || 0);

      highScoreRef.current = saved;
      setHighScore(saved);
    } catch {
      highScoreRef.current = 0;
    }
  }, []);

  const addParticles = useCallback(
    (
      game: GameState,
      x: number,
      y: number,
      count: number,
      spread = 2.5,
    ) => {
      for (let i = 0; i < count; i += 1) {
        game.particles.push({
          x,
          y,
          vx: randomBetween(-spread, spread),
          vy: randomBetween(-spread, spread),
          life: randomBetween(0.35, 0.8),
          maxLife: 0.8,
          size: randomBetween(2, 5),
        });
      }
    },
    [],
  );

  const flap = useCallback(() => {
    const game = gameRef.current;

    if (!game) return;

    if (statusRef.current === "ready") {
      game.started = true;
      game.velocityY = FLAP_POWER;
      game.flapFrame = 1;
      setGameStatus("playing");
      return;
    }

    if (statusRef.current !== "playing") return;

    game.velocityY = FLAP_POWER;
    game.flapFrame = 1;

    addParticles(game, BIRD_X - 12, game.birdY + 10, 4, 1.5);
  }, [addParticles, setGameStatus]);

  const resetGame = useCallback(() => {
    gameRef.current = createInitialGame(highScoreRef.current);

    resultSavedRef.current = false;

    setScore(0);
    setCoins(0);
    setLives(INITIAL_LIVES);
    setSpeed(BASE_SPEED);
    setPattern(0);

    setGameStatus("ready");
  }, [setGameStatus]);

  const finishGame = useCallback(() => {
    if (resultSavedRef.current) return;

    resultSavedRef.current = true;

    const game = gameRef.current;

    if (!game) return;

    const finalScore = Math.floor(game.score + game.coinsCollected * 5);

    if (finalScore > highScoreRef.current) {
      highScoreRef.current = finalScore;
      setHighScore(finalScore);

      try {
        localStorage.setItem(STORAGE_KEY, String(finalScore));
      } catch {
        // Ignore storage failures.
      }
    }

    saveResult("loss", finalScore);

    setScore(finalScore);
    setGameStatus("game-over");
  }, [setGameStatus]);

  const loseLife = useCallback(
    (game: GameState) => {
      if (game.invulnerable > 0) return;

      game.lives -= 1;
      game.invulnerable = 1.5;
      game.flash = 1;

      addParticles(game, BIRD_X, game.birdY, 18, 4);

      setLives(game.lives);

      if (game.lives <= 0) {
        finishGame();
        return;
      }

      game.birdY = HEIGHT / 2;
      game.velocityY = -3;
    },
    [addParticles, finishGame],
  );

  const spawnPipe = useCallback((game: GameState) => {
    const pattern = game.pattern;

    const gapSize =
      pattern === 0 ? 190 : pattern === 1 ? 175 : 165;

    const minGapY = 115;
    const maxGapY = PLAY_BOTTOM - 115 - gapSize;

    let gapY = randomBetween(minGapY, maxGapY);

    if (pattern === 1) {
      gapY += Math.sin(game.elapsed * 0.7) * 30;
    }

    if (pattern === 2) {
      gapY += Math.cos(game.elapsed * 0.55) * 45;
    }

    gapY = clamp(gapY, minGapY, maxGapY);

    game.pipes.push({
      x: WIDTH + 40,
      gapY,
      gapSize,
      width: PIPE_WIDTH,
      passed: false,
      pattern,
    });
  }, []);

  const spawnCoin = useCallback((game: GameState) => {
    const pipe = game.pipes[game.pipes.length - 1];

    if (!pipe) return;

    game.coins.push({
      x: pipe.x + PIPE_WIDTH / 2,
      y: pipe.gapY + pipe.gapSize / 2 + randomBetween(-45, 45),
      radius: 11,
      collected: false,
      rotation: Math.random() * Math.PI * 2,
      bob: Math.random() * Math.PI * 2,
    });
  }, []);

  const update = useCallback(
    (dt: number) => {
      const game = gameRef.current;

      if (!game || statusRef.current !== "playing") return;

      game.elapsed += dt;

      /*
       * Gradually accelerate the world.
       */
      game.speed = Math.min(
        MAX_SPEED,
        BASE_SPEED + game.elapsed * 0.055,
      );

      game.distance += game.speed * dt * 3;

      /*
       * Change visual pattern every ~22 seconds.
       * The player is never told this is a pattern system.
       */
      game.patternTimer += dt;

      if (game.patternTimer >= 22) {
        game.patternTimer = 0;
        game.pattern = ((game.pattern + 1) % 3) as Pattern;

        setPattern(game.pattern);

        addParticles(
          game,
          WIDTH / 2,
          150,
          22,
          3,
        );
      }

      /*
       * Bird physics.
       */
      game.velocityY += GRAVITY * dt * 60;
      game.birdY += game.velocityY * dt * 60;

      game.rotation = clamp(
        game.velocityY * 0.055,
        -0.5,
        1.0,
      );

      if (game.flapFrame > 0) {
        game.flapFrame += dt * 12;

        if (game.flapFrame > 3) {
          game.flapFrame = 0;
        }
      }

      /*
       * Pipes.
       */
      game.pipeTimer += dt;

      const pipeInterval =
        Math.max(1.35, 2.05 - game.speed * 0.055);

      if (game.pipeTimer >= pipeInterval) {
        game.pipeTimer = 0;

        spawnPipe(game);

        /*
         * Some pipes have a coin reward.
         */
        if (Math.random() > 0.2) {
          spawnCoin(game);
        }
      }

      for (const pipe of game.pipes) {
        pipe.x -= game.speed * dt * 60;

        if (
          !pipe.passed &&
          pipe.x + pipe.width < BIRD_X
        ) {
          pipe.passed = true;
          game.score += 10;

          addParticles(
            game,
            BIRD_X,
            game.birdY,
            7,
            2,
          );
        }
      }

      game.pipes = game.pipes.filter(
        (pipe) => pipe.x + pipe.width > -100,
      );

      /*
       * Coins.
       */
      for (const coin of game.coins) {
        coin.x -= game.speed * dt * 60;
        coin.rotation += dt * 7;
        coin.bob += dt * 4;

        const coinY =
          coin.y + Math.sin(coin.bob) * 5;

        const dx = coin.x - BIRD_X;
        const dy = coinY - game.birdY;

        if (
          !coin.collected &&
          Math.sqrt(dx * dx + dy * dy) <
            coin.radius + BIRD_SIZE * 0.45
        ) {
          coin.collected = true;

          game.coinsCollected += 1;
          game.score += 25;

          addParticles(
            game,
            coin.x,
            coinY,
            16,
            3,
          );
        }
      }

      game.coins = game.coins.filter(
        (coin) =>
          !coin.collected &&
          coin.x > -50,
      );

      /*
       * Collision with pipes.
       */
      if (game.invulnerable > 0) {
        game.invulnerable -= dt;
      }

      if (game.invulnerable <= 0) {
        for (const pipe of game.pipes) {
          const horizontalHit =
            BIRD_X + BIRD_SIZE * 0.35 >
              pipe.x &&
            BIRD_X - BIRD_SIZE * 0.35 <
              pipe.x + pipe.width;

          const topPipeBottom = pipe.gapY;
          const bottomPipeTop =
            pipe.gapY + pipe.gapSize;

          const verticalHit =
            game.birdY - BIRD_SIZE * 0.35 <
              topPipeBottom ||
            game.birdY + BIRD_SIZE * 0.35 >
              bottomPipeTop;

          if (horizontalHit && verticalHit) {
            loseLife(game);
            break;
          }
        }
      }

      /*
       * Ceiling / ground collision.
       */
      if (
        game.birdY - BIRD_SIZE / 2 < 0 ||
        game.birdY + BIRD_SIZE / 2 >
          PLAY_BOTTOM
      ) {
        loseLife(game);
      }

      /*
       * Clouds and environment.
       */
      for (const cloud of game.clouds) {
        cloud.x -= cloud.speed * game.speed * dt * 10;

        if (cloud.x + cloud.width < 0) {
          cloud.x =
            WIDTH + randomBetween(30, 180);
          cloud.y = randomBetween(55, 210);
        }
      }

      game.groundOffset =
        (game.groundOffset +
          game.speed * dt * 60) %
        48;

      /*
       * Particles.
       */
      for (const particle of game.particles) {
        particle.x += particle.vx * dt * 60;
        particle.y += particle.vy * dt * 60;

        particle.vy += 0.08 * dt * 60;

        particle.life -= dt;
      }

      game.particles = game.particles.filter(
        (particle) => particle.life > 0,
      );

      /*
       * Score / HUD.
       */
      const displayScore =
        Math.floor(
          game.score +
            game.coinsCollected * 5,
        );

      setScore(displayScore);
      setCoins(game.coinsCollected);
      setSpeed(game.speed);
      setLives(game.lives);

      if (displayScore > highScoreRef.current) {
        highScoreRef.current = displayScore;
        setHighScore(displayScore);

        try {
          localStorage.setItem(
            STORAGE_KEY,
            String(displayScore),
          );
        } catch {
          // Ignore storage failures.
        }
      }
    },
    [
      addParticles,
      loseLife,
      spawnCoin,
      spawnPipe,
    ],
  );

  const drawCloud = (
    ctx: CanvasRenderingContext2D,
    cloud: Cloud,
    alpha = 1,
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(255,255,255,0.78)";

    const x = cloud.x;
    const y = cloud.y;
    const w = cloud.width;

    ctx.beginPath();
    ctx.arc(
      x + w * 0.28,
      y,
      w * 0.18,
      0,
      Math.PI * 2,
    );

    ctx.arc(
      x + w * 0.48,
      y - w * 0.08,
      w * 0.24,
      0,
      Math.PI * 2,
    );

    ctx.arc(
      x + w * 0.7,
      y,
      w * 0.18,
      0,
      Math.PI * 2,
    );

    ctx.fill();

    ctx.restore();
  };

  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    game: GameState,
  ) => {
    let gradient: CanvasGradient;

    if (game.pattern === 0) {
      gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT,
      );

      gradient.addColorStop(0, "#6dd5fa");
      gradient.addColorStop(1, "#dff9ff");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      /*
       * Sun.
       */
      ctx.fillStyle =
        "rgba(255,235,130,0.9)";

      ctx.beginPath();
      ctx.arc(720, 100, 44, 0, Math.PI * 2);
      ctx.fill();
    } else if (game.pattern === 1) {
      gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT,
      );

      gradient.addColorStop(0, "#ff9966");
      gradient.addColorStop(0.55, "#ffd27d");
      gradient.addColorStop(1, "#f5e0b7");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle =
        "rgba(255,245,190,0.9)";

      ctx.beginPath();
      ctx.arc(700, 135, 58, 0, Math.PI * 2);
      ctx.fill();
    } else {
      gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT,
      );

      gradient.addColorStop(0, "#10183b");
      gradient.addColorStop(0.55, "#26366b");
      gradient.addColorStop(1, "#405b82");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      /*
       * Stars.
       */
      for (const star of game.stars) {
        const alpha =
          0.45 +
          Math.sin(
            game.elapsed * 2 +
              star.twinkle,
          ) *
            0.3;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
          star.x,
          star.y,
          star.size,
          star.size,
        );
      }

      ctx.globalAlpha = 1;

      /*
       * Moon.
       */
      ctx.fillStyle =
        "rgba(245,248,255,0.95)";

      ctx.beginPath();
      ctx.arc(710, 115, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#182348";

      ctx.beginPath();
      ctx.arc(
        728,
        102,
        40,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    /*
     * Clouds.
     */
    for (const cloud of game.clouds) {
      drawCloud(
        ctx,
        cloud,
        game.pattern === 2 ? 0.35 : 0.72,
      );
    }

    /*
     * Distant landscape.
     */
    ctx.fillStyle =
      game.pattern === 2
        ? "#18294b"
        : game.pattern === 1
          ? "#bd825d"
          : "#67b59a";

    ctx.beginPath();

    ctx.moveTo(0, PLAY_BOTTOM - 80);

    for (
      let x = 0;
      x <= WIDTH + 80;
      x += 80
    ) {
      const wave =
        Math.sin(
          x * 0.018 +
            game.elapsed * 0.12,
        ) * 28;

      ctx.lineTo(
        x,
        PLAY_BOTTOM - 80 - wave,
      );
    }

    ctx.lineTo(WIDTH, PLAY_BOTTOM);
    ctx.lineTo(0, PLAY_BOTTOM);
    ctx.closePath();
    ctx.fill();
  };

  const drawPipe = (
    ctx: CanvasRenderingContext2D,
    pipe: Pipe,
    game: GameState,
  ) => {
    const x = pipe.x;
    const width = pipe.width;

    let body = "#27a66f";
    let cap = "#198a5a";
    let highlight = "#57d99a";

    if (pipe.pattern === 1) {
      body = "#d36b42";
      cap = "#ad4e2d";
      highlight = "#f39a68";
    }

    if (pipe.pattern === 2) {
      body = "#5566c9";
      cap = "#3e4ca2";
      highlight = "#8392ff";
    }

    const topHeight = pipe.gapY;
    const bottomY =
      pipe.gapY + pipe.gapSize;

    ctx.fillStyle = body;

    ctx.fillRect(
      x,
      0,
      width,
      topHeight,
    );

    ctx.fillRect(
      x,
      bottomY,
      width,
      PLAY_BOTTOM - bottomY,
    );

    /*
     * Pipe caps.
     */
    ctx.fillStyle = cap;

    ctx.fillRect(
      x - 7,
      topHeight - 26,
      width + 14,
      26,
    );

    ctx.fillRect(
      x - 7,
      bottomY,
      width + 14,
      26,
    );

    /*
     * Highlights.
     */
    ctx.fillStyle = highlight;

    ctx.globalAlpha = 0.55;

    ctx.fillRect(
      x + 10,
      0,
      10,
      Math.max(0, topHeight - 28),
    );

    ctx.fillRect(
      x + 10,
      bottomY + 28,
      10,
      Math.max(
        0,
        PLAY_BOTTOM - bottomY - 28,
      ),
    );

    ctx.globalAlpha = 1;
  };

  const drawCoin = (
    ctx: CanvasRenderingContext2D,
    coin: Coin,
  ) => {
    const y =
      coin.y +
      Math.sin(coin.bob) * 5;

    const scale =
      0.65 +
      Math.abs(Math.cos(coin.rotation)) *
        0.35;

    ctx.save();

    ctx.translate(coin.x, y);
    ctx.scale(scale, 1);

    ctx.fillStyle = "#facc15";

    ctx.beginPath();
    ctx.arc(
      0,
      0,
      coin.radius,
      0,
      Math.PI * 2,
    );

    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle =
      "rgba(255,255,255,0.65)";

    ctx.fillRect(
      -3,
      -7,
      3,
      7,
    );

    ctx.restore();
  };

  const drawBird = (
    ctx: CanvasRenderingContext2D,
    game: GameState,
  ) => {
    if (
      game.invulnerable > 0 &&
      Math.floor(game.invulnerable * 12) % 2 ===
        0
    ) {
      return;
    }

    ctx.save();

    ctx.translate(
      BIRD_X,
      game.birdY,
    );

    ctx.rotate(game.rotation);

    /*
     * Pixel-art body.
     */
    const pixel = 6;

    ctx.fillStyle = "#facc15";

    ctx.fillRect(
      -pixel * 3,
      -pixel * 2,
      pixel * 6,
      pixel * 5,
    );

    ctx.fillRect(
      -pixel * 2,
      -pixel * 3,
      pixel * 4,
      pixel,
    );

    ctx.fillRect(
      pixel * 2,
      -pixel,
      pixel * 3,
      pixel * 2,
    );

    /*
     * Wing animation.
     */
    const wingOffset =
      game.flapFrame > 0
        ? -pixel * 2
        : pixel;

    ctx.fillStyle = "#eab308";

    ctx.fillRect(
      -pixel * 2,
      wingOffset,
      pixel * 3,
      pixel * 2,
    );

    /*
     * Eye.
     */
    ctx.fillStyle = "#111827";

    ctx.fillRect(
      pixel,
      -pixel * 2,
      pixel,
      pixel,
    );

    /*
     * Beak.
     */
    ctx.fillStyle = "#f97316";

    ctx.fillRect(
      pixel * 5,
      -pixel,
      pixel * 2,
      pixel,
    );

    /*
     * Tail.
     */
    ctx.fillStyle = "#f59e0b";

    ctx.fillRect(
      -pixel * 5,
      -pixel,
      pixel * 2,
      pixel,
    );

    ctx.restore();
  };

  const drawGround = (
    ctx: CanvasRenderingContext2D,
    game: GameState,
  ) => {
    const groundY = PLAY_BOTTOM;

    ctx.fillStyle =
      game.pattern === 0
        ? "#315f48"
        : game.pattern === 1
          ? "#78452f"
          : "#202e4c";

    ctx.fillRect(
      0,
      groundY,
      WIDTH,
      GROUND_HEIGHT,
    );

    ctx.fillStyle =
      game.pattern === 0
        ? "#4ade80"
        : game.pattern === 1
          ? "#e08b5d"
          : "#6677b7";

    ctx.fillRect(
      0,
      groundY,
      WIDTH,
      9,
    );

    /*
     * Moving pixel tiles.
     */
    for (
      let x = -48 - game.groundOffset;
      x < WIDTH + 48;
      x += 48
    ) {
      ctx.fillStyle =
        game.pattern === 0
          ? "#244936"
          : game.pattern === 1
            ? "#5e3828"
            : "#18233d";

      ctx.fillRect(
        x,
        groundY + 24,
        24,
        8,
      );

      ctx.fillRect(
        x + 30,
        groundY + 42,
        14,
        7,
      );
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const game = gameRef.current;

    if (!canvas || !game) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      WIDTH,
      HEIGHT,
    );

    ctx.imageSmoothingEnabled = false;

    drawBackground(ctx, game);

    /*
     * Pipes.
     */
    for (const pipe of game.pipes) {
      drawPipe(ctx, pipe, game);
    }

    /*
     * Coins.
     */
    for (const coin of game.coins) {
      drawCoin(ctx, coin);
    }

    /*
     * Particles.
     */
    for (const particle of game.particles) {
      ctx.globalAlpha =
        particle.life /
        particle.maxLife;

      ctx.fillStyle = "#facc15";

      ctx.fillRect(
        particle.x,
        particle.y,
        particle.size,
        particle.size,
      );
    }

    ctx.globalAlpha = 1;

    drawBird(ctx, game);
    drawGround(ctx, game);

    /*
     * Damage flash.
     */
    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255,70,70,${game.flash * 0.18})`;

      ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT,
      );

      game.flash = Math.max(
        0,
        game.flash - 0.05,
      );
    }

    /*
     * Canvas border.
     */
    ctx.strokeStyle =
      "rgba(255,255,255,0.12)";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      1,
      1,
      WIDTH - 2,
      HEIGHT - 2,
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    gameRef.current =
      createInitialGame(
        highScoreRef.current,
      );

    const context =
      canvas.getContext("2d");

    if (!context) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(
        0.035,
        (time - lastTime) / 1000,
      );

      lastTime = time;

      if (
        statusRef.current === "playing"
      ) {
        update(delta);
      }

      draw();

      animationRef.current =
        requestAnimationFrame(loop);
    };

    animationRef.current =
      requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current,
        );
      }
    };
  }, [draw, update]);

  const togglePause = () => {
    if (statusRef.current === "playing") {
      setGameStatus("paused");
      return;
    }

    if (statusRef.current === "paused") {
      setGameStatus("playing");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
      ) {
        event.preventDefault();
        flap();
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        togglePause();
      }

      if (
        event.code === "Enter" &&
        statusRef.current === "game-over"
      ) {
        resetGame();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [flap, resetGame]);

  const patternName =
    pattern === 0
      ? "Meadow"
      : pattern === 1
        ? "Sunset"
        : "Night";

  const patternDescription =
    pattern === 0
      ? "Bright skies and rolling green islands."
      : pattern === 1
        ? "Warm skies with a faster, more intense rhythm."
        : "A darker sky with stars and tighter routes.";

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="mb-2 text-sm font-semibold"
              style={{
                color: "var(--primary)",
              }}
            >
              GAMEHUB · MINI GAME
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              🐦 Sky Hopper
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm sm:text-base"
              style={{
                color: "var(--muted)",
              }}
            >
              Flap through changing skies, collect
              coins, protect your lives, and chase
              your highest score.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/leaderboard"
              className="rounded-xl border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
              }}
            >
              🏆 Leaderboard
            </Link>

            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
              }}
            >
              ← GameHub
            </Link>
          </div>
        </div>

        {/* HUD */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          {[
            ["Score", score.toString()],
            ["Coins", `🪙 ${coins}`],
            [
              "Lives",
              `${"❤️".repeat(lives)}${"🖤".repeat(
                Math.max(0, INITIAL_LIVES - lives),
              )}`,
            ],
            ["Best", highScore.toString()],
            ["Speed", `${speed.toFixed(1)}x`],
            ["Pattern", patternName],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                boxShadow:
                  "0 8px 25px var(--shadow-color)",
              }}
            >
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: "var(--muted)",
                }}
              >
                {label}
              </div>

              <div className="mt-1 truncate text-lg font-black">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Game */}
        <section
          className="overflow-hidden rounded-[1.75rem] border p-2 sm:p-3"
          style={{
            borderColor: "var(--border)",
            background: "var(--card-elevated)",
            boxShadow:
              "0 20px 55px var(--shadow-color)",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[1.35rem]"
            style={{
              background: "#101827",
            }}
          >
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              onPointerDown={() => flap()}
              className="block h-auto w-full cursor-pointer touch-none"
              style={{
                imageRendering: "pixelated",
              }}
            />

            {/* Overlay */}
            {status !== "playing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 p-6 backdrop-blur-[2px]">
                <div
                  className="w-full max-w-md rounded-[1.5rem] border p-6 text-center"
                  style={{
                    borderColor:
                      "rgba(255,255,255,0.14)",
                    background:
                      "rgba(2,6,23,0.82)",
                    color: "#ffffff",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.35)",
                  }}
                >
                  {status === "ready" && (
                    <>
                      <div className="mb-3 text-5xl">
                        🐦
                      </div>

                      <h2 className="text-2xl font-black">
                        Ready to Fly?
                      </h2>

                      <p className="mt-2 text-sm text-white/70">
                        The hopper starts completely
                        still. Make your first flap
                        to launch the world.
                      </p>

                      <button
                        type="button"
                        onClick={flap}
                        className="mt-5 rounded-xl px-6 py-3 font-black transition hover:scale-105"
                        style={{
                          background:
                            "var(--primary)",
                          color: "#ffffff",
                        }}
                      >
                        🪽 Start Flying
                      </button>
                    </>
                  )}

                  {status === "paused" && (
                    <>
                      <div className="mb-3 text-5xl">
                        ⏸️
                      </div>

                      <h2 className="text-2xl font-black">
                        Game Paused
                      </h2>

                      <button
                        type="button"
                        onClick={togglePause}
                        className="mt-5 rounded-xl px-6 py-3 font-black"
                        style={{
                          background:
                            "var(--primary)",
                          color: "#ffffff",
                        }}
                      >
                        ▶ Resume
                      </button>
                    </>
                  )}

                  {status === "game-over" && (
                    <>
                      <div className="mb-3 text-5xl">
                        💥
                      </div>

                      <h2 className="text-2xl font-black">
                        Flight Over
                      </h2>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/10 p-3">
                          <div className="text-xs text-white/60">
                            Score
                          </div>
                          <div className="text-2xl font-black">
                            {score}
                          </div>
                        </div>

                        <div className="rounded-xl bg-white/10 p-3">
                          <div className="text-xs text-white/60">
                            Coins
                          </div>
                          <div className="text-2xl font-black">
                            🪙 {coins}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={resetGame}
                        className="mt-5 rounded-xl px-6 py-3 font-black"
                        style={{
                          background:
                            "var(--primary)",
                          color: "#ffffff",
                        }}
                      >
                        🔄 Fly Again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={flap}
              className="rounded-xl px-4 py-3 font-black transition hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
              }}
            >
              🪽 FLAP
            </button>

            <button
              type="button"
              onClick={togglePause}
              className="rounded-xl border px-4 py-3 font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
              }}
            >
              {status === "paused"
                ? "▶ Resume"
                : "⏸ Pause"}
            </button>

            <button
              type="button"
              onClick={resetGame}
              className="rounded-xl border px-4 py-3 font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
              }}
            >
              🔄 Restart
            </button>

            <Link
              href="/leaderboard"
              className="rounded-xl border px-4 py-3 text-center font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
              }}
            >
              🏆 Scores
            </Link>
          </div>
        </section>

        {/* Pattern information */}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
            }}
          >
            <div className="text-2xl">🪙</div>
            <h2 className="mt-3 font-black">
              Collect Coins
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{
                color: "var(--muted)",
              }}
            >
              Coins add bonus points and create
              optional risk-reward routes through
              the gaps.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
            }}
          >
            <div className="text-2xl">❤️</div>
            <h2 className="mt-3 font-black">
              Three Lives
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{
                color: "var(--muted)",
              }}
            >
              Mistakes cost a life instead of
              instantly ending the run. Use the
              temporary invulnerability wisely.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
            }}
          >
            <div className="text-2xl">🌈</div>
            <h2 className="mt-3 font-black">
              Changing Skies
            </h2>
            <p
              className="mt-2 text-sm leading-6"
              style={{
                color: "var(--muted)",
              }}
            >
              {patternDescription}
            </p>
          </div>
        </section>

        {/* Controls / footer */}
        <section
          className="mt-5 rounded-2xl border p-5"
          style={{
            borderColor: "var(--border)",
            background: "var(--card)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black">
                Controls
              </h2>

              <p
                className="mt-1 text-sm"
                style={{
                  color: "var(--muted)",
                }}
              >
                Space / ↑ / W / Tap = Flap · P =
                Pause · Enter = Restart
              </p>
            </div>

            <div
              className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{
                background:
                  "var(--primary-soft)",
                color: "var(--primary)",
              }}
            >
              🏆 Best: {highScore}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}