"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { saveResult } from "@/lib/game";

type GameStatus =
  | "ready"
  | "playing"
  | "paused"
  | "game-over"
  | "victory";

type EnemyType = "scout" | "tank" | "elite";

type Enemy = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: EnemyType;
  alive: boolean;
  animation: number;
};

type Bullet = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  enemy: boolean;
};

type Shield = {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: "spark" | "explosion" | "coin";
};

type Coin = {
  x: number;
  y: number;
  radius: number;
  velocityY: number;
  rotation: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
};

type GameState = {
  playerX: number;
  playerVelocity: number;

  enemies: Enemy[];
  bullets: Bullet[];
  shields: Shield[];
  particles: Particle[];
  coins: Coin[];
  stars: Star[];

  score: number;
  coinsCollected: number;
  lives: number;

  level: number;
  enemyDirection: number;
  enemyMoveTimer: number;
  enemyShootTimer: number;

  fireCooldown: number;
  elapsed: number;

  flash: number;
  shake: number;

  invulnerable: number;

  started: boolean;
};

const WIDTH = 900;
const HEIGHT = 620;

const PLAYER_Y = HEIGHT - 82;

const PLAYER_WIDTH = 54;
const PLAYER_HEIGHT = 32;

const INITIAL_LIVES = 3;

const STORAGE_KEY = "gamehub-space-invaders-best";

const ENEMY_ROWS = 5;
const ENEMY_COLUMNS = 9;

const ENEMY_WIDTH = 42;
const ENEMY_HEIGHT = 30;

const STARTING_ENEMY_SPEED = 26;

const PLAYER_SPEED = 430;

const BULLET_SPEED = 620;
const ENEMY_BULLET_SPEED = 300;

const FIRE_COOLDOWN = 0.24;

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(
  min: number,
  max: number,
) {
  return Math.random() * (max - min) + min;
}

function createStars(): Star[] {
  return Array.from({ length: 110 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    size: randomBetween(1, 3),
    speed: randomBetween(8, 35),
    alpha: randomBetween(0.3, 1),
  }));
}

function createEnemies(level = 1): Enemy[] {
  const enemies: Enemy[] = [];

  const startX = 150;
  const startY = 80;

  const gapX = 66;
  const gapY = 50;

  for (let row = 0; row < ENEMY_ROWS; row += 1) {
    for (
      let column = 0;
      column < ENEMY_COLUMNS;
      column += 1
    ) {
      let type: EnemyType = "scout";

      if (row === 0) {
        type = "elite";
      } else if (row <= 2) {
        type = "tank";
      }

      enemies.push({
        x: startX + column * gapX,
        y: startY + row * gapY,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        type,
        alive: true,
        animation:
          Math.random() * Math.PI * 2,
      });
    }
  }

  /*
   * Higher levels begin slightly farther down
   * and create a more aggressive formation.
   */
  if (level > 1) {
    for (const enemy of enemies) {
      enemy.y += Math.min(
        40,
        (level - 1) * 7,
      );
    }
  }

  return enemies;
}

function createShields(): Shield[] {
  return [
    {
      x: 150,
      y: HEIGHT - 190,
      width: 125,
      height: 42,
      health: 18,
    },
    {
      x: 388,
      y: HEIGHT - 190,
      width: 125,
      height: 42,
      health: 18,
    },
    {
      x: 626,
      y: HEIGHT - 190,
      width: 125,
      height: 42,
      health: 18,
    },
  ];
}

function createInitialGame(
  bestScore = 0,
): GameState {
  return {
    playerX: WIDTH / 2,
    playerVelocity: 0,

    enemies: createEnemies(1),
    bullets: [],
    shields: createShields(),
    particles: [],
    coins: [],
    stars: createStars(),

    score: 0,
    coinsCollected: 0,
    lives: INITIAL_LIVES,

    level: 1,
    enemyDirection: 1,
    enemyMoveTimer: 0,
    enemyShootTimer: 1.4,

    fireCooldown: 0,
    elapsed: 0,

    flash: 0,
    shake: 0,

    invulnerable: 0,

    started: false,
  };
}

export default function SpaceInvadersPage() {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const gameRef =
    useRef<GameState | null>(null);

  const animationRef =
    useRef<number | null>(null);

  const keysRef = useRef({
    left: false,
    right: false,
  });

  const statusRef =
    useRef<GameStatus>("ready");

  const highScoreRef = useRef(0);

  const resultSavedRef = useRef(false);

  const [status, setStatus] =
    useState<GameStatus>("ready");

  const [score, setScore] = useState(0);

  const [coins, setCoins] = useState(0);

  const [lives, setLives] =
    useState(INITIAL_LIVES);

  const [level, setLevel] = useState(1);

  const [highScore, setHighScore] =
    useState(0);

  const [enemyCount, setEnemyCount] =
    useState(ENEMY_ROWS * ENEMY_COLUMNS);

  const setGameStatus = useCallback(
    (next: GameStatus) => {
      statusRef.current = next;
      setStatus(next);
    },
    [],
  );

  useEffect(() => {
    try {
      const saved = Number(
        localStorage.getItem(STORAGE_KEY) || 0,
      );

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
      type:
        | "spark"
        | "explosion"
        | "coin" = "spark",
    ) => {
      for (let i = 0; i < count; i += 1) {
        game.particles.push({
          x,
          y,
          vx: randomBetween(-4, 4),
          vy: randomBetween(-4, 4),
          life:
            type === "explosion"
              ? randomBetween(0.45, 1)
              : randomBetween(0.25, 0.7),
          maxLife: 1,
          size: randomBetween(2, 6),
          type,
        });
      }
    },
    [],
  );

  const startGame = useCallback(() => {
    const game = gameRef.current;

    if (!game) return;

    game.started = true;

    setGameStatus("playing");
  }, [setGameStatus]);

  const fire = useCallback(() => {
    const game = gameRef.current;

    if (!game) return;

    if (statusRef.current === "ready") {
      startGame();
      return;
    }

    if (statusRef.current !== "playing") {
      return;
    }

    if (game.fireCooldown > 0) {
      return;
    }

    game.fireCooldown = FIRE_COOLDOWN;

    game.bullets.push({
      x: game.playerX,
      y: PLAYER_Y - 25,
      width: 5,
      height: 18,
      velocity: -BULLET_SPEED,
      enemy: false,
    });

    addParticles(
      game,
      game.playerX,
      PLAYER_Y - 25,
      5,
      "spark",
    );
  }, [
    addParticles,
    startGame,
  ]);

  const resetGame = useCallback(() => {
    gameRef.current =
      createInitialGame(
        highScoreRef.current,
      );

    resultSavedRef.current = false;

    setScore(0);
    setCoins(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setEnemyCount(
      ENEMY_ROWS * ENEMY_COLUMNS,
    );

    setGameStatus("ready");
  }, [setGameStatus]);

  const finishGame = useCallback(
    (
      finalStatus: "game-over" | "victory",
    ) => {
      if (resultSavedRef.current) {
        return;
      }

      resultSavedRef.current = true;

      const game = gameRef.current;

      if (!game) return;

      const finalScore = Math.floor(
        game.score +
          game.coinsCollected * 25,
      );

      if (
        finalScore >
        highScoreRef.current
      ) {
        highScoreRef.current =
          finalScore;

        setHighScore(finalScore);

        try {
          localStorage.setItem(
            STORAGE_KEY,
            String(finalScore),
          );
        } catch {
          // Ignore storage failures.
        }
      }

      saveResult(
        finalStatus === "victory"
          ? "win"
          : "loss",
        finalScore,
      );

      setScore(finalScore);
      setGameStatus(finalStatus);
    },
    [setGameStatus],
  );

  const loseLife = useCallback(() => {
    const game = gameRef.current;

    if (!game) return;

    if (game.invulnerable > 0) {
      return;
    }

    game.lives -= 1;

    game.invulnerable = 2;
    game.flash = 1;
    game.shake = 1;

    game.playerX = WIDTH / 2;

    addParticles(
      game,
      game.playerX,
      PLAYER_Y,
      28,
      "explosion",
    );

    setLives(game.lives);

    if (game.lives <= 0) {
      finishGame("game-over");
    }
  }, [
    addParticles,
    finishGame,
  ]);

  const nextLevel = useCallback(() => {
    const game = gameRef.current;

    if (!game) return;

    game.level += 1;

    game.enemies =
      createEnemies(game.level);

    game.bullets = [];

    game.enemyDirection = 1;

    game.enemyMoveTimer = 0;

    game.enemyShootTimer =
      Math.max(
        0.45,
        1.3 -
          game.level * 0.08,
      );

    /*
     * Shields partially regenerate between
     * waves, but never return completely.
     */
    for (const shield of game.shields) {
      shield.health = Math.min(
        18,
        shield.health + 7,
      );
    }

    addParticles(
      game,
      WIDTH / 2,
      HEIGHT / 2,
      35,
      "coin",
    );

    setLevel(game.level);
    setEnemyCount(game.enemies.length);
  }, [addParticles]);

  const update = useCallback(
    (dt: number) => {
      const game = gameRef.current;

      if (
        !game ||
        statusRef.current !== "playing"
      ) {
        return;
      }

      game.elapsed += dt;

      /*
       * Player movement.
       */
      let direction = 0;

      if (keysRef.current.left) {
        direction -= 1;
      }

      if (keysRef.current.right) {
        direction += 1;
      }

      game.playerVelocity =
        direction * PLAYER_SPEED;

      game.playerX +=
        game.playerVelocity * dt;

      game.playerX = clamp(
        game.playerX,
        35,
        WIDTH - 35,
      );

      /*
       * Timers.
       */
      game.fireCooldown = Math.max(
        0,
        game.fireCooldown - dt,
      );

      game.invulnerable = Math.max(
        0,
        game.invulnerable - dt,
      );

      /*
       * Enemy formation movement.
       */
      const aliveEnemies =
        game.enemies.filter(
          (enemy) => enemy.alive,
        );

      const enemySpeed =
        STARTING_ENEMY_SPEED +
        game.level * 8 +
        (1 -
          aliveEnemies.length /
            (ENEMY_ROWS *
              ENEMY_COLUMNS)) *
          75;

      game.enemyMoveTimer += dt;

      const moveInterval =
        Math.max(
          0.08,
          0.45 -
            enemySpeed * 0.003,
        );

      if (
        game.enemyMoveTimer >=
        moveInterval
      ) {
        game.enemyMoveTimer = 0;

        let hitEdge = false;

        for (const enemy of aliveEnemies) {
          enemy.x +=
            game.enemyDirection *
            14;

          enemy.animation += 0.5;

          if (
            enemy.x <
              55 ||
            enemy.x >
              WIDTH - 55
          ) {
            hitEdge = true;
          }
        }

        if (hitEdge) {
          game.enemyDirection *= -1;

          for (const enemy of aliveEnemies) {
            enemy.y += 18;
          }
        }
      }

      /*
       * Enemy shooting.
       */
      game.enemyShootTimer -= dt;

      if (
        game.enemyShootTimer <= 0 &&
        aliveEnemies.length > 0
      ) {
        game.enemyShootTimer =
          Math.max(
            0.35,
            1.4 -
              game.level * 0.08,
          );

        const shooter =
          aliveEnemies[
            Math.floor(
              Math.random() *
                aliveEnemies.length,
            )
          ];

        game.bullets.push({
          x: shooter.x,
          y:
            shooter.y +
            shooter.height / 2,
          width: 5,
          height: 16,
          velocity:
            ENEMY_BULLET_SPEED +
            game.level * 15,
          enemy: true,
        });
      }

      /*
       * Bullets.
       */
      for (const bullet of game.bullets) {
        bullet.y +=
          bullet.velocity * dt;
      }

      /*
       * Player bullet → enemy.
       */
      for (const bullet of game.bullets) {
        if (bullet.enemy) continue;

        for (const enemy of game.enemies) {
          if (!enemy.alive) continue;

          const hit =
            bullet.x >
              enemy.x -
                enemy.width / 2 &&
            bullet.x <
              enemy.x +
                enemy.width / 2 &&
            bullet.y <
              enemy.y +
                enemy.height / 2 &&
            bullet.y +
              bullet.height >
              enemy.y -
                enemy.height / 2;

          if (hit) {
            enemy.alive = false;

            bullet.y = -100;

            const points =
              enemy.type === "elite"
                ? 40
                : enemy.type === "tank"
                  ? 25
                  : 15;

            game.score += points;

            addParticles(
              game,
              enemy.x,
              enemy.y,
              enemy.type === "elite"
                ? 22
                : 14,
              "explosion",
            );

            /*
             * Coin drop.
             */
            if (
              Math.random() <
              (enemy.type === "elite"
                ? 0.7
                : 0.22)
            ) {
              game.coins.push({
                x: enemy.x,
                y: enemy.y,
                radius: 9,
                velocityY: 45,
                rotation: 0,
              });
            }

            break;
          }
        }
      }

      /*
       * Enemy bullet → player.
       */
      if (game.invulnerable <= 0) {
        for (const bullet of game.bullets) {
          if (!bullet.enemy) continue;

          const hit =
            bullet.x >
              game.playerX -
                PLAYER_WIDTH / 2 &&
            bullet.x <
              game.playerX +
                PLAYER_WIDTH / 2 &&
            bullet.y +
              bullet.height >
              PLAYER_Y -
                PLAYER_HEIGHT / 2 &&
            bullet.y <
              PLAYER_Y +
                PLAYER_HEIGHT / 2;

          if (hit) {
            bullet.y = HEIGHT + 100;

            loseLife();

            break;
          }
        }
      }

      /*
       * Shields absorb enemy bullets.
       */
      for (const bullet of game.bullets) {
        if (!bullet.enemy) continue;

        for (const shield of game.shields) {
          if (shield.health <= 0) continue;

          const hit =
            bullet.x >
              shield.x -
                shield.width / 2 &&
            bullet.x <
              shield.x +
                shield.width / 2 &&
            bullet.y +
              bullet.height >
              shield.y -
                shield.height / 2 &&
            bullet.y <
              shield.y +
                shield.height / 2;

          if (hit) {
            bullet.y = HEIGHT + 100;

            shield.health -= 2;

            addParticles(
              game,
              bullet.x,
              bullet.y,
              5,
              "spark",
            );

            break;
          }
        }
      }

      /*
       * Enemy formation reaching the player.
       */
      for (const enemy of aliveEnemies) {
        if (
          enemy.y +
            enemy.height / 2 >=
          PLAYER_Y - 45
        ) {
          finishGame("game-over");
          return;
        }
      }

      /*
       * Coins.
       */
      for (const coin of game.coins) {
        coin.y +=
          coin.velocityY * dt;

        coin.velocityY +=
          40 * dt;

        coin.rotation +=
          dt * 6;

        const dx =
          coin.x -
          game.playerX;

        const dy =
          coin.y -
          PLAYER_Y;

        if (
          Math.sqrt(
            dx * dx +
              dy * dy,
          ) < 30
        ) {
          coin.x = -100;

          game.coinsCollected += 1;

          game.score += 25;

          addParticles(
            game,
            game.playerX,
            PLAYER_Y,
            12,
            "coin",
          );
        }
      }

      game.coins =
        game.coins.filter(
          (coin) =>
            coin.x > -50 &&
            coin.y < HEIGHT + 50,
        );

      /*
       * Remove old bullets.
       */
      game.bullets =
        game.bullets.filter(
          (bullet) =>
            bullet.y > -80 &&
            bullet.y <
              HEIGHT + 80,
        );

      /*
       * Remove dead enemies.
       */
      const remaining =
        game.enemies.filter(
          (enemy) =>
            enemy.alive,
        );

      /*
       * Victory.
       */
      if (remaining.length === 0) {
        if (game.level >= 5) {
          finishGame("victory");
          return;
        }

        nextLevel();
      }

      /*
       * Particles.
       */
      for (const particle of game.particles) {
        particle.x +=
          particle.vx *
          dt *
          60;

        particle.y +=
          particle.vy *
          dt *
          60;

        particle.vy +=
          0.08 *
          dt *
          60;

        particle.life -= dt;
      }

      game.particles =
        game.particles.filter(
          (particle) =>
            particle.life > 0,
        );

      /*
       * Stars.
       */
      for (const star of game.stars) {
        star.y +=
          star.speed *
          dt;

        if (star.y > HEIGHT) {
          star.y = 0;
          star.x =
            Math.random() * WIDTH;
        }
      }

      /*
       * Effects.
       */
      game.flash = Math.max(
        0,
        game.flash - dt * 2,
      );

      game.shake = Math.max(
        0,
        game.shake - dt * 4,
      );

      /*
       * HUD.
       */
      const displayScore = Math.floor(
        game.score +
          game.coinsCollected * 25,
      );

      setScore(displayScore);
      setCoins(game.coinsCollected);
      setLives(game.lives);
      setLevel(game.level);

      setEnemyCount(
        remaining.length,
      );

      if (
        displayScore >
        highScoreRef.current
      ) {
        highScoreRef.current =
          displayScore;

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
      finishGame,
      loseLife,
      nextLevel,
    ],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const game = gameRef.current;

    if (!canvas || !game) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      WIDTH,
      HEIGHT,
    );

    ctx.imageSmoothingEnabled = false;

    /*
     * Screen shake.
     */
    ctx.save();

    if (game.shake > 0) {
      ctx.translate(
        randomBetween(
          -game.shake * 5,
          game.shake * 5,
        ),
        randomBetween(
          -game.shake * 5,
          game.shake * 5,
        ),
      );
    }

    /*
     * Space gradient.
     */
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT,
      );

    gradient.addColorStop(
      0,
      "#020617",
    );

    gradient.addColorStop(
      0.55,
      "#07142d",
    );

    gradient.addColorStop(
      1,
      "#0b1f3a",
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      WIDTH,
      HEIGHT,
    );

    /*
     * Stars.
     */
    for (const star of game.stars) {
      ctx.globalAlpha =
        star.alpha;

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        star.x,
        star.y,
        star.size,
        star.size,
      );
    }

    ctx.globalAlpha = 1;

    /*
     * Distant planet glow.
     */
    const planet =
      ctx.createRadialGradient(
        720,
        110,
        5,
        720,
        110,
        100,
      );

    planet.addColorStop(
      0,
      "rgba(45,212,191,0.20)",
    );

    planet.addColorStop(
      1,
      "rgba(45,212,191,0)",
    );

    ctx.fillStyle = planet;

    ctx.fillRect(
      610,
      0,
      220,
      220,
    );

    /*
     * Top line.
     */
    ctx.fillStyle =
      "rgba(20,184,173,0.22)";

    ctx.fillRect(
      0,
      54,
      WIDTH,
      2,
    );

    /*
     * Enemies.
     */
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;

      const x =
        enemy.x -
        enemy.width / 2;

      const y =
        enemy.y -
        enemy.height / 2;

      const bob =
        Math.sin(
          enemy.animation,
        ) * 2;

      let body =
        "#5eead4";

      let accent =
        "#14b8a6";

      if (
        enemy.type === "tank"
      ) {
        body = "#60a5fa";
        accent = "#2563eb";
      }

      if (
        enemy.type === "elite"
      ) {
        body = "#c084fc";
        accent = "#9333ea";
      }

      /*
       * Glow.
       */
      ctx.shadowBlur = 14;

      ctx.shadowColor =
        accent;

      ctx.fillStyle = body;

      /*
       * Pixel alien.
       */
      ctx.fillRect(
        x + 8,
        y + bob + 6,
        26,
        16,
      );

      ctx.fillRect(
        x + 3,
        y + bob + 11,
        36,
        8,
      );

      ctx.fillRect(
        x + 11,
        y + bob,
        8,
        7,
      );

      ctx.fillRect(
        x + 23,
        y + bob,
        8,
        7,
      );

      ctx.fillRect(
        x + 6,
        y + bob + 22,
        7,
        7,
      );

      ctx.fillRect(
        x + 29,
        y + bob + 22,
        7,
        7,
      );

      ctx.shadowBlur = 0;

      /*
       * Eyes.
       */
      ctx.fillStyle =
        "#020617";

      ctx.fillRect(
        x + 11,
        y + bob + 10,
        6,
        6,
      );

      ctx.fillRect(
        x + 25,
        y + bob + 10,
        6,
        6,
      );
    }

    /*
     * Shields.
     */
    for (const shield of game.shields) {
      if (shield.health <= 0) continue;

      const alpha =
        0.22 +
        (shield.health / 18) *
          0.58;

      ctx.globalAlpha =
        alpha;

      ctx.fillStyle =
        "#14b8a6";

      ctx.fillRect(
        shield.x -
          shield.width / 2,
        shield.y -
          shield.height / 2,
        shield.width,
        shield.height,
      );

      /*
       * Shield damage gaps.
       */
      ctx.globalCompositeOperation =
        "destination-out";

      const damage =
        18 -
        shield.health;

      for (
        let i = 0;
        i < damage;
        i += 1
      ) {
        const holeX =
          shield.x -
          shield.width / 2 +
          randomBetween(
            0,
            shield.width,
          );

        const holeY =
          shield.y -
          shield.height / 2 +
          randomBetween(
            0,
            shield.height,
          );

        ctx.fillRect(
          holeX,
          holeY,
          6,
          6,
        );
      }

      ctx.globalCompositeOperation =
        "source-over";

      ctx.globalAlpha = 1;
    }

    /*
     * Bullets.
     */
    for (const bullet of game.bullets) {
      ctx.shadowBlur = 12;

      ctx.shadowColor =
        bullet.enemy
          ? "#fb7185"
          : "#67e8f9";

      ctx.fillStyle =
        bullet.enemy
          ? "#fb7185"
          : "#67e8f9";

      ctx.fillRect(
        bullet.x -
          bullet.width / 2,
        bullet.y,
        bullet.width,
        bullet.height,
      );

      ctx.shadowBlur = 0;
    }

    /*
     * Coins.
     */
    for (const coin of game.coins) {
      ctx.save();

      ctx.translate(
        coin.x,
        coin.y,
      );

      const scale =
        0.65 +
        Math.abs(
          Math.cos(
            coin.rotation,
          ),
        ) *
          0.35;

      ctx.scale(
        scale,
        1,
      );

      ctx.shadowBlur = 12;

      ctx.shadowColor =
        "#facc15";

      ctx.fillStyle =
        "#facc15";

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        coin.radius,
        0,
        Math.PI * 2,
      );

      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.fillStyle =
        "#a16207";

      ctx.fillRect(
        -2,
        -6,
        4,
        12,
      );

      ctx.restore();
    }

    /*
     * Player ship.
     */
    const playerAlpha =
      game.invulnerable > 0 &&
      Math.floor(
        game.invulnerable * 10,
      ) %
        2 ===
        0
        ? 0.35
        : 1;

    ctx.globalAlpha =
      playerAlpha;

    ctx.shadowBlur = 18;

    ctx.shadowColor =
      "#14b8a6";

    ctx.fillStyle =
      "#14b8a6";

    /*
     * Pixel ship body.
     */
    ctx.fillRect(
      game.playerX - 25,
      PLAYER_Y,
      50,
      12,
    );

    ctx.fillRect(
      game.playerX - 16,
      PLAYER_Y - 10,
      32,
      10,
    );

    ctx.fillRect(
      game.playerX - 7,
      PLAYER_Y - 19,
      14,
      9,
    );

    ctx.fillRect(
      game.playerX - 32,
      PLAYER_Y + 7,
      12,
      8,
    );

    ctx.fillRect(
      game.playerX + 20,
      PLAYER_Y + 7,
      12,
      8,
    );

    /*
     * Engine glow.
     */
    ctx.fillStyle =
      "#67e8f9";

    ctx.fillRect(
      game.playerX - 13,
      PLAYER_Y + 14,
      8,
      randomBetween(
        8,
        17,
      ),
    );

    ctx.fillRect(
      game.playerX + 5,
      PLAYER_Y + 14,
      8,
      randomBetween(
        8,
        17,
      ),
    );

    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;

    /*
     * Particles.
     */
    for (const particle of game.particles) {
      ctx.globalAlpha =
        particle.life /
        particle.maxLife;

      if (
        particle.type ===
        "coin"
      ) {
        ctx.fillStyle =
          "#facc15";
      } else if (
        particle.type ===
        "explosion"
      ) {
        ctx.fillStyle =
          "#fb7185";
      } else {
        ctx.fillStyle =
          "#67e8f9";
      }

      ctx.fillRect(
        particle.x,
        particle.y,
        particle.size,
        particle.size,
      );
    }

    ctx.globalAlpha = 1;

    /*
     * Bottom boundary.
     */
    ctx.fillStyle =
      "rgba(20,184,173,0.35)";

    ctx.fillRect(
      0,
      HEIGHT - 35,
      WIDTH,
      2,
    );

    ctx.restore();

    /*
     * Damage flash.
     */
    if (game.flash > 0) {
      ctx.fillStyle =
        `rgba(248,113,113,${
          game.flash * 0.18
        })`;

      ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT,
      );
    }

    /*
     * Canvas frame.
     */
    ctx.strokeStyle =
      "rgba(94,234,212,0.18)";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      1,
      1,
      WIDTH - 2,
      HEIGHT - 2,
    );
  }, []);

  useEffect(() => {
    gameRef.current =
      createInitialGame(
        highScoreRef.current,
      );

    let lastTime =
      performance.now();

    const loop = (
      time: number,
    ) => {
      const dt = Math.min(
        0.035,
        (time - lastTime) / 1000,
      );

      lastTime = time;

      update(dt);
      draw();

      animationRef.current =
        requestAnimationFrame(loop);
    };

    animationRef.current =
      requestAnimationFrame(loop);

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current,
        );
      }
    };
  }, [draw, update]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code ===
          "ArrowLeft" ||
        event.code === "KeyA"
      ) {
        keysRef.current.left = true;
      }

      if (
        event.code ===
          "ArrowRight" ||
        event.code === "KeyD"
      ) {
        keysRef.current.right = true;
      }

      if (
        event.code === "Space"
      ) {
        event.preventDefault();
        fire();
      }

      if (
        event.code === "KeyP"
      ) {
        if (
          statusRef.current ===
          "playing"
        ) {
          setGameStatus("paused");
        } else if (
          statusRef.current ===
          "paused"
        ) {
          setGameStatus("playing");
        }
      }

      if (
        event.code === "Enter" &&
        (
          statusRef.current ===
            "game-over" ||
          statusRef.current ===
            "victory"
        )
      ) {
        resetGame();
      }
    };

    const handleKeyUp = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code ===
          "ArrowLeft" ||
        event.code === "KeyA"
      ) {
        keysRef.current.left = false;
      }

      if (
        event.code ===
          "ArrowRight" ||
        event.code === "KeyD"
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
    fire,
    resetGame,
    setGameStatus,
  ]);

  const togglePause =
    () => {
      if (
        statusRef.current ===
        "playing"
      ) {
        setGameStatus("paused");
      } else if (
        statusRef.current ===
        "paused"
      ) {
        setGameStatus("playing");
      }
    };

  const statusTitle =
    status === "ready"
      ? "Defend the Galaxy"
      : status === "paused"
        ? "Mission Paused"
        : status === "victory"
          ? "Galaxy Saved!"
          : "Ship Destroyed";

  const statusEmoji =
    status === "ready"
      ? "👾"
      : status === "paused"
        ? "⏸️"
        : status === "victory"
          ? "🏆"
          : "💥";

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{
        background:
          "var(--background)",
        color:
          "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="mb-2 text-sm font-semibold"
              style={{
                color:
                  "var(--primary)",
              }}
            >
              GAMEHUB · MINI GAME
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              👾 Space Invaders
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm sm:text-base"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Defend your ship, destroy the
              alien fleet, collect bonus coins,
              and survive increasingly aggressive
              waves.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/leaderboard"
              className="rounded-xl border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
              }}
            >
              🏆 Leaderboard
            </Link>

            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                background:
                  "var(--primary)",
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
            [
              "Score",
              score.toString(),
            ],
            [
              "Coins",
              `🪙 ${coins}`,
            ],
            [
              "Lives",
              `${"❤️".repeat(
                lives,
              )}${"🖤".repeat(
                Math.max(
                  0,
                  INITIAL_LIVES -
                    lives,
                ),
              )}`,
            ],
            [
              "Level",
              level.toString(),
            ],
            [
              "Invaders",
              enemyCount.toString(),
            ],
            [
              "Best",
              highScore.toString(),
            ],
          ].map(
            ([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border px-4 py-3"
                style={{
                  borderColor:
                    "var(--border)",
                  background:
                    "var(--card)",
                  boxShadow:
                    "0 8px 25px var(--shadow-color)",
                }}
              >
                <div
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  {label}
                </div>

                <div className="mt-1 truncate text-lg font-black">
                  {value}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Game */}
        <section
          className="overflow-hidden rounded-[1.75rem] border p-2 sm:p-3"
          style={{
            borderColor:
              "var(--border)",
            background:
              "var(--card-elevated)",
            boxShadow:
              "0 20px 55px var(--shadow-color)",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[1.35rem]"
            style={{
              background:
                "#020617",
            }}
          >
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              className="block h-auto w-full touch-none"
              style={{
                imageRendering:
                  "pixelated",
              }}
            />

            {/* Overlay */}
            {status !==
              "playing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-6 backdrop-blur-[2px]">
                <div
                  className="w-full max-w-md rounded-[1.5rem] border p-6 text-center"
                  style={{
                    borderColor:
                      "rgba(94,234,212,0.20)",
                    background:
                      "rgba(2,6,23,0.88)",
                    color:
                      "#ffffff",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.45)",
                  }}
                >
                  <div className="mb-3 text-5xl">
                    {statusEmoji}
                  </div>

                  <h2 className="text-2xl font-black">
                    {statusTitle}
                  </h2>

                  {status ===
                    "ready" && (
                    <>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Move your ship,
                        destroy the
                        alien fleet,
                        protect your
                        shields, and
                        survive five
                        increasingly
                        difficult waves.
                      </p>

                      <button
                        type="button"
                        onClick={
                          startGame
                        }
                        className="mt-5 rounded-xl px-6 py-3 font-black transition hover:scale-105"
                        style={{
                          background:
                            "var(--primary)",
                          color:
                            "#ffffff",
                        }}
                      >
                        🚀 Start Mission
                      </button>
                    </>
                  )}

                  {status ===
                    "paused" && (
                    <>
                      <p className="mt-2 text-sm text-white/70">
                        Your fleet is
                        waiting.
                      </p>

                      <button
                        type="button"
                        onClick={
                          togglePause
                        }
                        className="mt-5 rounded-xl px-6 py-3 font-black"
                        style={{
                          background:
                            "var(--primary)",
                          color:
                            "#ffffff",
                        }}
                      >
                        ▶ Resume
                      </button>
                    </>
                  )}

                  {(
                    status ===
                      "game-over" ||
                    status ===
                      "victory"
                  ) && (
                    <>
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
                            🪙{" "}
                            {coins}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          resetGame
                        }
                        className="mt-5 rounded-xl px-6 py-3 font-black"
                        style={{
                          background:
                            "var(--primary)",
                          color:
                            "#ffffff",
                        }}
                      >
                        🔄 New Mission
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => {
                keysRef.current.left =
                  true;

                window.setTimeout(
                  () => {
                    keysRef.current.left =
                      false;
                  },
                  180,
                );
              }}
              className="rounded-xl border px-4 py-3 text-center font-black transition active:scale-95"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
              }}
            >
              ◀ Left
            </button>

            <button
              type="button"
              onClick={fire}
              className="rounded-xl px-4 py-3 font-black transition hover:-translate-y-0.5 active:scale-95"
              style={{
                background:
                  "var(--primary)",
                color:
                  "#ffffff",
              }}
            >
              🔫 FIRE
            </button>

            <button
              type="button"
              onClick={() => {
                keysRef.current.right =
                  true;

                window.setTimeout(
                  () => {
                    keysRef.current.right =
                      false;
                  },
                  180,
                );
              }}
              className="rounded-xl border px-4 py-3 text-center font-black transition active:scale-95"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
              }}
            >
              Right ▶
            </button>

            <button
              type="button"
              onClick={
                togglePause
              }
              className="rounded-xl border px-4 py-3 font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
              }}
            >
              {status ===
              "paused"
                ? "▶ Resume"
                : "⏸ Pause"}
            </button>

            <button
              type="button"
              onClick={
                resetGame
              }
              className="rounded-xl border px-4 py-3 font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor:
                  "var(--border)",
                background:
                  "var(--card)",
              }}
            >
              🔄 Restart
            </button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--card)",
            }}
          >
            <div className="text-2xl">
              👾
            </div>

            <h2 className="mt-3 font-black">
              Alien Fleet
            </h2>

            <p
              className="mt-2 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Three enemy classes bring
              different visual styles and
              different score values.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--card)",
            }}
          >
            <div className="text-2xl">
              🛡️
            </div>

            <h2 className="mt-3 font-black">
              Defensive Shields
            </h2>

            <p
              className="mt-2 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Use destructible shields to
              survive incoming enemy fire
              and control dangerous waves.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor:
                "var(--border)",
              background:
                "var(--card)",
            }}
          >
            <div className="text-2xl">
              🪙
            </div>

            <h2 className="mt-3 font-black">
              Bonus Coins
            </h2>

            <p
              className="mt-2 text-sm leading-6"
              style={{
                color:
                  "var(--muted)",
              }}
            >
              Elite invaders can drop bonus
              coins worth extra points,
              rewarding aggressive play.
            </p>
          </div>
        </section>

        {/* Controls / info */}
        <section
          className="mt-5 rounded-2xl border p-5"
          style={{
            borderColor:
              "var(--border)",
            background:
              "var(--card)",
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
                  color:
                    "var(--muted)",
                }}
              >
                ← / → or A / D = Move ·
                Space = Fire · P = Pause ·
                Enter = Restart
              </p>
            </div>

            <Link
              href="/leaderboard"
              className="rounded-xl px-4 py-2 text-center text-sm font-black"
              style={{
                background:
                  "var(--primary-soft)",
                color:
                  "var(--primary)",
              }}
            >
              🏆 View Leaderboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}