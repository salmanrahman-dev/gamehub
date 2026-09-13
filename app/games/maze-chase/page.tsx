"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

type Position = {
  row: number;
  col: number;
};

type GamePhase = "ready" | "playing" | "paused" | "gameover" | "cleared";

type Cell = "#" | "." | " ";

type PowerPixel = Position & {
  active: boolean;
};

const MAZE: Cell[][] = [
  ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
  ["#", ".", ".", ".", ".", ".", "#", ".", ".", ".", ".", ".", ".", ".", "#"],
  ["#", ".", "#", "#", "#", ".", "#", ".", "#", "#", "#", ".", "#", ".", "#"],
  ["#", ".", "#", ".", ".", ".", ".", ".", ".", ".", "#", ".", "#", ".", "#"],
  ["#", ".", "#", ".", "#", "#", "#", "#", "#", ".", "#", ".", "#", ".", "#"],
  ["#", ".", ".", ".", "#", ".", ".", ".", "#", ".", ".", ".", "#", ".", "#"],
  ["#", ".", "#", ".", "#", ".", "#", ".", "#", ".", "#", ".", "#", ".", "#"],
  ["#", ".", "#", ".", ".", ".", "#", ".", ".", ".", "#", ".", ".", ".", "#"],
  ["#", ".", "#", "#", "#", ".", "#", "#", "#", ".", "#", "#", "#", ".", "#"],
  ["#", ".", ".", ".", "#", ".", ".", ".", ".", ".", ".", ".", "#", ".", "#"],
  ["#", "#", "#", ".", "#", "#", "#", ".", "#", "#", "#", ".", "#", ".", "#"],
  ["#", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "#"],
  ["#", ".", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", ".", "#"],
  ["#", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "#"],
  ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;

const PLAYER_START: Position = {
  row: 13,
  col: 1,
};

const ENEMY_START: Position = {
  row: 1,
  col: 13,
};

const POWER_PIXEL_POSITIONS: Position[] = [
  { row: 1, col: 1 },
  { row: 1, col: 13 },
  { row: 13, col: 1 },
  { row: 13, col: 13 },
];

const DIRECTIONS: Record<
  Exclude<Direction, "none">,
  { row: number; col: number }
> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

const ALL_DIRECTIONS: Exclude<Direction, "none">[] = [
  "up",
  "down",
  "left",
  "right",
];

function keyOf(position: Position) {
  return `${position.row}-${position.col}`;
}

function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

function isWalkable(row: number, col: number) {
  return (
    row >= 0 &&
    row < ROWS &&
    col >= 0 &&
    col < COLS &&
    MAZE[row][col] !== "#"
  );
}

function nextPosition(
  position: Position,
  direction: Direction,
): Position {
  if (direction === "none") {
    return position;
  }

  const delta = DIRECTIONS[direction];

  return {
    row: position.row + delta.row,
    col: position.col + delta.col,
  };
}

function createDots() {
  const result = new Set<string>();

  MAZE.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === ".") {
        result.add(`${rowIndex}-${colIndex}`);
      }
    });
  });

  result.delete(keyOf(PLAYER_START));
  result.delete(keyOf(ENEMY_START));

  POWER_PIXEL_POSITIONS.forEach((position) => {
    result.delete(keyOf(position));
  });

  return result;
}

function getValidDirections(position: Position) {
  return ALL_DIRECTIONS.filter((direction) => {
    const next = nextPosition(position, direction);

    return isWalkable(next.row, next.col);
  });
}

function getDistance(a: Position, b: Position) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function chooseEnemyDirection(
  enemy: Position,
  player: Position,
  previousDirection: Direction,
) {
  const valid = getValidDirections(enemy);

  if (valid.length === 0) {
    return "none" as Direction;
  }

  const candidates = valid.filter((direction) => {
    if (previousDirection === "up") return direction !== "down";
    if (previousDirection === "down") return direction !== "up";
    if (previousDirection === "left") return direction !== "right";
    if (previousDirection === "right") return direction !== "left";

    return true;
  });

  const available = candidates.length > 0 ? candidates : valid;

  const ranked = [...available].sort((a, b) => {
    const nextA = nextPosition(enemy, a);
    const nextB = nextPosition(enemy, b);

    return getDistance(nextA, player) - getDistance(nextB, player);
  });

  if (ranked.length > 1 && Math.random() < 0.2) {
    return ranked[Math.floor(Math.random() * ranked.length)];
  }

  return ranked[0];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function MazeChasePage() {
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [enemy, setEnemy] = useState<Position>(ENEMY_START);

  const [direction, setDirection] = useState<Direction>("none");
  const [enemyDirection, setEnemyDirection] =
    useState<Direction>("left");

  const [dots, setDots] = useState<Set<string>>(createDots);
  const [powerPixels, setPowerPixels] = useState<PowerPixel[]>(
    POWER_PIXEL_POSITIONS.map((position) => ({
      ...position,
      active: true,
    })),
  );

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [moves, setMoves] = useState(0);

  const [powered, setPowered] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [readyCount, setReadyCount] = useState(3);

  const [message, setMessage] = useState("GET READY");
  const [floatingScore, setFloatingScore] = useState<number | null>(
    null,
  );

  const [particles, setParticles] = useState<
    { id: number; row: number; col: number }[]
  >([]);

  const particleId = useRef(0);

  const totalDots = useMemo(() => createDots().size, []);

  const collectedDots = totalDots - dots.size;

  const progress = Math.min(
    100,
    Math.round((collectedDots / totalDots) * 100),
  );

  const enemySpeed = Math.max(260 - (level - 1) * 18, 145);

  const addParticles = useCallback((position: Position) => {
    const baseId = particleId.current++;

    setParticles((current) => [
      ...current,
      ...Array.from({ length: 5 }, (_, index) => ({
        id: baseId + index,
        row: position.row,
        col: position.col,
      })),
    ]);

    window.setTimeout(() => {
      setParticles((current) =>
        current.filter((particle) => particle.row !== position.row || particle.col !== position.col),
      );
    }, 350);
  }, []);

  const resetLevel = useCallback(
    (remainingLives: number) => {
      setPlayer(PLAYER_START);
      setEnemy(ENEMY_START);
      setDirection("none");
      setEnemyDirection("left");
      setLives(remainingLives);
      setCombo(0);
      setPowered(false);
      setPhase("ready");
      setReadyCount(3);
      setMessage("GET READY");
      setFloatingScore(null);
    },
    [],
  );

  const resetGame = useCallback(() => {
    setPlayer(PLAYER_START);
    setEnemy(ENEMY_START);
    setDirection("none");
    setEnemyDirection("left");
    setDots(createDots());
    setPowerPixels(
      POWER_PIXEL_POSITIONS.map((position) => ({
        ...position,
        active: true,
      })),
    );

    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setMoves(0);
    setPowered(false);

    setPhase("ready");
    setReadyCount(3);
    setMessage("GET READY");
    setFloatingScore(null);
    setParticles([]);
  }, []);

  /*
   * READY → 3 → 2 → 1 → GO
   */
  useEffect(() => {
    if (phase !== "ready") return;

    if (readyCount > 0) {
      const timer = window.setTimeout(() => {
        setReadyCount((value) => value - 1);
      }, 700);

      return () => window.clearTimeout(timer);
    }

    setMessage("GO!");

    const timer = window.setTimeout(() => {
      setPhase("playing");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [phase, readyCount]);

  /*
   * Player movement.
   */
  useEffect(() => {
    if (phase !== "playing") return;

    const timer = window.setInterval(() => {
      setPlayer((current) => {
        if (direction === "none") {
          return current;
        }

        const next = nextPosition(current, direction);

        if (!isWalkable(next.row, next.col)) {
          return current;
        }

        setMoves((value) => value + 1);

        return next;
      });
    }, 135);

    return () => window.clearInterval(timer);
  }, [direction, phase]);

  /*
   * Enemy movement.
   */
  useEffect(() => {
    if (phase !== "playing") return;

    const timer = window.setInterval(() => {
      setEnemy((current) => {
        const chosenDirection = chooseEnemyDirection(
          current,
          player,
          enemyDirection,
        );

        setEnemyDirection(chosenDirection);

        const next = nextPosition(current, chosenDirection);

        if (!isWalkable(next.row, next.col)) {
          return current;
        }

        return next;
      });
    }, enemySpeed);

    return () => window.clearInterval(timer);
  }, [
    enemyDirection,
    enemySpeed,
    phase,
    player,
  ]);

  /*
   * Dot / power-pixel collection.
   */
  useEffect(() => {
    if (phase !== "playing") return;

    const playerKey = keyOf(player);

    if (dots.has(playerKey)) {
      const nextDots = new Set(dots);

      nextDots.delete(playerKey);
      setDots(nextDots);

      setCombo((currentCombo) => {
        const nextCombo = currentCombo + 1;
        const gain = 10 + Math.min(nextCombo * 2, 30);

        setScore((currentScore) => {
          const nextScore = currentScore + gain;
          setBestScore((best) => Math.max(best, nextScore));

          return nextScore;
        });

        setFloatingScore(gain);
        setMessage(`+${gain} PIXEL`);

        window.setTimeout(() => {
          setFloatingScore(null);
        }, 350);

        addParticles(player);

        return nextCombo;
      });
    }

    const powerIndex = powerPixels.findIndex(
      (power) =>
        power.active &&
        power.row === player.row &&
        power.col === player.col,
    );

    if (powerIndex !== -1) {
      setPowerPixels((current) =>
        current.map((power, index) =>
          index === powerIndex
            ? { ...power, active: false }
            : power,
        ),
      );

      setPowered(true);
      setCombo((value) => value + 2);

      setScore((currentScore) => {
        const nextScore = currentScore + 100;
        setBestScore((best) => Math.max(best, nextScore));
        return nextScore;
      });

      setFloatingScore(100);
      setMessage("POWER PIXEL +100");
      addParticles(player);

      window.setTimeout(() => {
        setPowered(false);
      }, 4500);

      window.setTimeout(() => {
        setFloatingScore(null);
      }, 500);
    }
  }, [
    addParticles,
    dots,
    phase,
    player,
    powerPixels,
  ]);

  /*
   * Collision with the chaser.
   */
  useEffect(() => {
    if (phase !== "playing") return;

    if (!samePosition(player, enemy)) {
      return;
    }

    if (powered) {
      const bonus = 250 + level * 50;

      setScore((currentScore) => {
        const nextScore = currentScore + bonus;
        setBestScore((best) => Math.max(best, nextScore));
        return nextScore;
      });

      setFloatingScore(bonus);
      setMessage(`CHASER CLEARED +${bonus}`);
      addParticles(enemy);

      setEnemy(ENEMY_START);
      setEnemyDirection("left");

      window.setTimeout(() => {
        setFloatingScore(null);
      }, 500);

      return;
    }

    if (lives <= 1) {
      setLives(0);
      setPhase("gameover");
      setMessage("GAME OVER");
      return;
    }

    const remainingLives = lives - 1;

    setMessage("CAUGHT!");

    window.setTimeout(() => {
      resetLevel(remainingLives);
    }, 700);
  }, [
    addParticles,
    enemy,
    level,
    lives,
    phase,
    player,
    powered,
    resetLevel,
  ]);

  /*
   * Level completion.
   */
  useEffect(() => {
    if (phase !== "playing") return;

    if (dots.size > 0) return;

    setPhase("cleared");
    setMessage("MAZE CLEARED!");

    const completionBonus = 500 + level * 100;

    setScore((currentScore) => {
      const nextScore = currentScore + completionBonus;
      setBestScore((best) => Math.max(best, nextScore));
      return nextScore;
    });
  }, [dots.size, level, phase]);

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowup" ||
        key === "w"
      ) {
        event.preventDefault();
        setDirection("up");
      }

      if (
        key === "arrowdown" ||
        key === "s"
      ) {
        event.preventDefault();
        setDirection("down");
      }

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        event.preventDefault();
        setDirection("left");
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();
        setDirection("right");
      }

      if (key === "p" || key === " ") {
        event.preventDefault();

        if (phase === "playing") {
          setPhase("paused");
          setMessage("PAUSED");
        } else if (phase === "paused") {
          setPhase("playing");
          setMessage("BACK IN!");
        }
      }

      if (key === "r") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, resetGame]);

  const handleDirection = (nextDirection: Direction) => {
    if (phase === "ready") {
      setDirection(nextDirection);
      return;
    }

    if (phase !== "playing") return;

    setDirection(nextDirection);
  };

  const statusLabel =
    phase === "playing"
      ? "LIVE"
      : phase === "paused"
        ? "PAUSED"
        : phase === "cleared"
          ? "CLEARED"
          : phase === "gameover"
            ? "GAME OVER"
            : "READY";

  return (
    <main className="min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] shadow-[0_8px_30px_var(--shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <span>←</span>
          Back to GameHub
        </Link>

        {/* GameHub Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_var(--shadow)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                <span className="pixel-dot-indicator" />
                GameHub Pixel Arcade
              </div>

              <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl">
                Maze Chase
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                Enter the GameHub pixel maze, collect every energy pixel,
                build your combo, activate power mode, and outrun the
                chaser.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Level
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  {String(level).padStart(2, "0")}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Best
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--primary)]">
                  {formatNumber(bestScore)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HUD */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <HudCard
            label="Score"
            value={formatNumber(score)}
            accent
          />

          <HudCard
            label="Combo"
            value={`x${combo}`}
          />

          <HudCard
            label="Lives"
            value={lives > 0 ? "♥".repeat(lives) : "—"}
          />

          <HudCard
            label="Progress"
            value={`${progress}%`}
          />

          <HudCard
            label="Moves"
            value={formatNumber(moves)}
          />
        </section>

        {/* Main Game */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Board column */}
          <div>
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_20px_60px_var(--shadow)] sm:p-6">
              {/* Board header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    GameHub / Pixel Maze
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-black text-[var(--foreground)]">
                      {message}
                    </span>

                    {floatingScore !== null && (
                      <span className="animate-bounce text-xs font-black text-[var(--primary)]">
                        +{floatingScore}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    phase === "playing"
                      ? "border-[var(--primary)]/30 bg-[var(--primary-soft)] text-[var(--primary)]"
                      : phase === "gameover"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  }`}
                >
                  <span className="mr-1.5">●</span>
                  {statusLabel}
                </div>
              </div>

              {/* Pixel board */}
              <div className="flex justify-center">
                <div
                  className="relative w-full max-w-[620px] overflow-hidden rounded-[1.5rem] border-[6px] border-slate-900 bg-[#020617] p-2 shadow-[0_0_0_1px_rgba(20,184,173,.25),0_25px_70px_rgba(0,0,0,.35)] dark:border-slate-800"
                  style={{
                    aspectRatio: `${COLS} / ${ROWS}`,
                  }}
                >
                  {/* Maze grid */}
                  <div
                    className="relative grid h-full w-full overflow-hidden"
                    style={{
                      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                      gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    }}
                  >
                    {MAZE.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const wall = cell === "#";
                        const position = {
                          row: rowIndex,
                          col: colIndex,
                        };

                        const playerHere = samePosition(
                          player,
                          position,
                        );

                        const enemyHere = samePosition(
                          enemy,
                          position,
                        );

                        const dotHere = dots.has(keyOf(position));

                        const powerHere =
                          powerPixels.some(
                            (power) =>
                              power.active &&
                              samePosition(power, position),
                          );

                        const particleHere = particles.some(
                          (particle) =>
                            particle.row === rowIndex &&
                            particle.col === colIndex,
                        );

                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`relative overflow-hidden ${
                              wall
                                ? "bg-[#0b1729]"
                                : "bg-[#020617]"
                            }`}
                          >
                            {wall && (
                              <>
                                <div className="absolute inset-[8%] border border-[var(--primary)]/50 bg-[var(--primary)]/[0.07]" />

                                <div className="absolute left-[15%] top-[15%] h-[12%] w-[12%] bg-[var(--primary)]/50" />

                                <div className="absolute bottom-[15%] right-[15%] h-[8%] w-[8%] bg-blue-400/30" />
                              </>
                            )}

                            {!wall && (
                              <>
                                {dotHere && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-[30%] w-[30%] rounded-sm bg-[var(--primary)] shadow-[0_0_9px_rgba(20,184,173,.9)] animate-pulse" />
                                  </div>
                                )}

                                {powerHere && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="power-pixel">
                                      <span>+</span>
                                    </div>
                                  </div>
                                )}

                                {playerHere && (
                                  <div
                                    className={`pixel-player ${
                                      powered
                                        ? "pixel-player-powered"
                                        : ""
                                    }`}
                                  >
                                    <div className="pixel-player-eye left" />
                                    <div className="pixel-player-eye right" />
                                    <div className="pixel-player-mouth" />
                                  </div>
                                )}

                                {enemyHere && (
                                  <div
                                    className={`pixel-enemy ${
                                      powered
                                        ? "pixel-enemy-frightened"
                                        : ""
                                    }`}
                                  >
                                    <div className="pixel-enemy-eye left" />
                                    <div className="pixel-enemy-eye right" />

                                    <div className="pixel-enemy-feet">
                                      <span />
                                      <span />
                                      <span />
                                    </div>
                                  </div>
                                )}

                                {particleHere && (
                                  <div className="pixel-particle">
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>

                  {/* CRT grid */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:12px_12px]" />

                  {/* Scanlines */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(to_bottom,transparent_50%,rgba(255,255,255,.4)_50%)] [background-size:100%_4px]" />

                  {/* Vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,.35)_100%)]" />

                  {/* READY */}
                  {phase === "ready" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-[2px]">
                      <div className="text-center">
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--primary)]">
                          GameHub Pixel Arcade
                        </div>

                        <div className="pixel-ready-text">
                          {readyCount > 0 ? readyCount : "GO!"}
                        </div>

                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                          WASD / ARROWS TO MOVE
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAUSED */}
                  {phase === "paused" && (
                    <GameOverlay
                      icon="Ⅱ"
                      title="Paused"
                      description="The maze is waiting for you."
                      primaryLabel="Resume"
                      onPrimary={() => {
                        setPhase("playing");
                        setMessage("BACK IN!");
                      }}
                      secondaryLabel="Restart"
                      onSecondary={resetGame}
                    />
                  )}

                  {/* GAME OVER */}
                  {phase === "gameover" && (
                    <GameOverlay
                      icon="✕"
                      title="Game Over"
                      description={`Final score: ${formatNumber(score)}`}
                      primaryLabel="Play Again"
                      onPrimary={resetGame}
                      secondaryLabel="Back to Hub"
                      onSecondary={() => {
                        window.location.href = "/";
                      }}
                    />
                  )}

                  {/* CLEARED */}
                  {phase === "cleared" && (
                    <GameOverlay
                      icon="★"
                      title="Maze Cleared!"
                      description={`Level ${level} complete. Score: ${formatNumber(score)}`}
                      primaryLabel="Next Level"
                      onPrimary={() => {
                        setLevel((value) => value + 1);
                        setDots(createDots());
                        setPowerPixels(
                          POWER_PIXEL_POSITIONS.map(
                            (position) => ({
                              ...position,
                              active: true,
                            }),
                          ),
                        );
                        setPlayer(PLAYER_START);
                        setEnemy(ENEMY_START);
                        setDirection("none");
                        setEnemyDirection("left");
                        setCombo(0);
                        setPowered(false);
                        setPhase("ready");
                        setReadyCount(3);
                        setMessage("GET READY");
                      }}
                      secondaryLabel="Restart"
                      onSecondary={resetGame}
                    />
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6">
                <div className="mx-auto grid max-w-[255px] grid-cols-3 gap-2">
                  <div />

                  <DirectionButton
                    label="↑"
                    onClick={() => handleDirection("up")}
                  />

                  <div />

                  <DirectionButton
                    label="←"
                    onClick={() => handleDirection("left")}
                  />

                  <DirectionButton
                    label="↓"
                    onClick={() => handleDirection("down")}
                  />

                  <DirectionButton
                    label="→"
                    onClick={() => handleDirection("right")}
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    disabled={
                      phase === "gameover" ||
                      phase === "cleared" ||
                      phase === "ready"
                    }
                    onClick={() => {
                      if (phase === "playing") {
                        setPhase("paused");
                        setMessage("PAUSED");
                      } else if (phase === "paused") {
                        setPhase("playing");
                        setMessage("BACK IN!");
                      }
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-black text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {phase === "paused"
                      ? "▶ Resume"
                      : "Ⅱ Pause"}
                  </button>

                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-black text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]"
                  >
                    ↻ Restart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Game status */}
            <DashboardCard title="Game Status">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    phase === "playing"
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-slate-500/10 text-[var(--muted)]"
                  }`}
                >
                  <span className="text-lg">●</span>
                </div>

                <div>
                  <div className="text-sm font-black text-[var(--foreground)]">
                    {statusLabel}
                  </div>

                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {powered
                      ? "POWER MODE ACTIVE"
                      : phase === "playing"
                        ? "Keep moving."
                        : "GameHub Arcade"}
                  </div>
                </div>
              </div>
            </DashboardCard>

            {/* Power */}
            <DashboardCard title="Power Mode">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--muted)]">
                    Status
                  </span>

                  <span
                    className={`text-xs font-black ${
                      powered
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {powered ? "ACTIVE" : "READY"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  {powerPixels.map((power, index) => (
                    <div
                      key={`${power.row}-${power.col}-${index}`}
                      className={`h-8 w-8 rounded-lg border ${
                        power.active
                          ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)] opacity-40"
                      }`}
                    >
                      <div className="flex h-full items-center justify-center text-xs font-black text-[var(--primary)]">
                        +
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  Grab a power pixel to become stronger and clear the
                  chaser for bonus points.
                </p>
              </div>
            </DashboardCard>

            {/* Mission */}
            <DashboardCard title="Mission">
              <div className="space-y-3">
                <MissionRow
                  icon="✦"
                  title="Collect"
                  value={`${dots.size} left`}
                />

                <MissionRow
                  icon="⚡"
                  title="Combo"
                  value={`x${combo}`}
                />

                <MissionRow
                  icon="◆"
                  title="Level"
                  value={String(level).padStart(2, "0")}
                />
              </div>
            </DashboardCard>

            {/* Controls */}
            <DashboardCard title="Controls">
              <div className="space-y-3">
                <ControlRow
                  label="Move"
                  value="WASD / Arrows"
                />

                <ControlRow
                  label="Pause"
                  value="P / Space"
                />

                <ControlRow
                  label="Restart"
                  value="R"
                />
              </div>
            </DashboardCard>

            {/* CTA */}
            <button
              type="button"
              onClick={resetGame}
              className="w-full rounded-2xl bg-[var(--primary)] px-5 py-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(20,184,173,.2)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
            >
              Restart Game
            </button>
          </aside>
        </section>

        {/* Footer */}
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-center shadow-[0_10px_30px_var(--shadow)]">
          <p className="text-xs leading-5 text-[var(--muted)]">
            <span className="font-black text-[var(--foreground)]">
              GAMEHUB
            </span>{" "}
            · PIXEL ARCADE · MAZE CHASE · COLLECT · SURVIVE ·
            SCORE
          </p>
        </section>
      </div>

      <style jsx>{`
        .pixel-dot-indicator {
          width: 7px;
          height: 7px;
          display: inline-block;
          background: var(--primary);
          box-shadow: 0 0 10px rgba(20, 184, 173, 0.8);
          animation: pixelPulse 1s steps(2, end) infinite;
        }

        .pixel-ready-text {
          font-family: monospace;
          font-size: clamp(4rem, 13vw, 7rem);
          line-height: 0.9;
          font-weight: 1000;
          letter-spacing: -0.12em;
          color: white;
          text-shadow:
            4px 4px 0 #0d9488,
            8px 8px 0 rgba(20, 184, 173, 0.25),
            0 0 30px rgba(20, 184, 173, 0.7);
          animation: readyPulse 0.7s steps(2, end) infinite;
        }

        .pixel-player {
          position: absolute;
          inset: 13%;
          background: var(--primary);
          border-radius: 4px;
          box-shadow:
            0 0 8px rgba(20, 184, 173, 0.95),
            0 0 18px rgba(20, 184, 173, 0.55);
          animation: playerFloat 0.45s steps(2, end) infinite;
        }

        .pixel-player-powered {
          background: #facc15;
          box-shadow:
            0 0 8px rgba(250, 204, 21, 1),
            0 0 22px rgba(250, 204, 21, 0.75);
          animation:
            playerFloat 0.3s steps(2, end) infinite,
            powerPulse 0.55s steps(2, end) infinite;
        }

        .pixel-player-eye {
          position: absolute;
          top: 24%;
          width: 15%;
          height: 18%;
          background: #020617;
        }

        .pixel-player-eye.left {
          left: 24%;
        }

        .pixel-player-eye.right {
          right: 24%;
        }

        .pixel-player-mouth {
          position: absolute;
          bottom: 19%;
          left: 25%;
          width: 50%;
          height: 10%;
          background: #020617;
        }

        .pixel-enemy {
          position: absolute;
          inset: 12%;
          border-radius: 8px 8px 3px 3px;
          background: #fb7185;
          box-shadow:
            0 0 8px rgba(251, 113, 133, 0.9),
            0 0 18px rgba(251, 113, 133, 0.45);
          animation: enemyFloat 0.5s steps(2, end) infinite;
        }

        .pixel-enemy-frightened {
          background: #60a5fa;
          box-shadow:
            0 0 8px rgba(96, 165, 250, 0.9),
            0 0 20px rgba(96, 165, 250, 0.5);
        }

        .pixel-enemy-eye {
          position: absolute;
          top: 24%;
          width: 21%;
          height: 24%;
          background: white;
        }

        .pixel-enemy-eye.left {
          left: 20%;
        }

        .pixel-enemy-eye.right {
          right: 20%;
        }

        .pixel-enemy-feet {
          position: absolute;
          bottom: -3%;
          left: 8%;
          right: 8%;
          display: flex;
          justify-content: space-between;
        }

        .pixel-enemy-feet span {
          width: 25%;
          height: 25%;
          background: inherit;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 65%, 0 100%);
        }

        .power-pixel {
          display: flex;
          width: 58%;
          height: 58%;
          align-items: center;
          justify-content: center;
          border: 2px solid #facc15;
          background: rgba(250, 204, 21, 0.16);
          color: #facc15;
          font-family: monospace;
          font-size: 65%;
          font-weight: 900;
          box-shadow:
            0 0 7px rgba(250, 204, 21, 0.9),
            0 0 18px rgba(250, 204, 21, 0.45);
          animation: powerFloat 0.65s steps(2, end) infinite;
        }

        .pixel-particle {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .pixel-particle span {
          position: absolute;
          width: 18%;
          height: 18%;
          background: var(--primary);
          box-shadow: 0 0 6px var(--primary);
          animation: particleBurst 350ms steps(3, end) forwards;
        }

        .pixel-particle span:nth-child(1) {
          left: 10%;
          top: 10%;
        }

        .pixel-particle span:nth-child(2) {
          right: 10%;
          top: 15%;
        }

        .pixel-particle span:nth-child(3) {
          left: 20%;
          bottom: 10%;
        }

        .pixel-particle span:nth-child(4) {
          right: 15%;
          bottom: 15%;
        }

        @keyframes pixelPulse {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.4;
          }
        }

        @keyframes readyPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.06);
          }
        }

        @keyframes playerFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes enemyFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(2px);
          }
        }

        @keyframes powerFloat {
          0%,
          100% {
            transform: scale(0.85);
          }

          50% {
            transform: scale(1);
          }
        }

        @keyframes powerPulse {
          0%,
          100% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.5);
          }
        }

        @keyframes particleBurst {
          0% {
            transform: scale(0.4);
            opacity: 1;
          }

          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .control-button {
          display: flex;
          height: 50px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 8px 20px var(--shadow);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .control-button:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          background: var(--surface-soft);
        }

        .control-button:active {
          transform: translateY(1px) scale(0.95);
        }
      `}</style>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                         */
/* -------------------------------------------------------------------------- */

function HudCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_30px_var(--shadow)]">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </div>

      <div
        className={`mt-2 truncate text-xl font-black sm:text-2xl ${
          accent
            ? "text-[var(--primary)]"
            : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_15px_40px_var(--shadow)]">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
        {title}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function MissionRow({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[var(--primary)]">{icon}</span>

        <span className="text-sm font-bold text-[var(--muted)]">
          {title}
        </span>
      </div>

      <span className="text-sm font-black text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function ControlRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-[var(--muted)]">
        {label}
      </span>

      <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1 font-mono text-[10px] font-black text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function DirectionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="control-button"
      aria-label={`Move ${label}`}
    >
      {label}
    </button>
  );
}

function GameOverlay({
  icon,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  icon: string;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-[3px]">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900/95 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 font-mono text-2xl font-black text-[var(--primary)] shadow-[0_0_30px_rgba(20,184,173,.12)]">
          {icon}
        </div>

        <h2 className="mt-5 text-2xl font-black text-white">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {description}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-xl bg-[var(--primary)] px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:brightness-110"
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white transition hover:bg-white/10"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}