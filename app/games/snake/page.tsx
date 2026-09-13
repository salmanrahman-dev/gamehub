"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResult } from "@/lib/game";

type Point = {
  x: number;
  y: number;
};

type Difficulty = "low" | "medium" | "high";

const BOARD_SIZE = 18;

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    speed: number;
    description: string;
  }
> = {
  low: {
    label: "Low",
    speed: 190,
    description: "Slower movement — ideal for beginners.",
  },
  medium: {
    label: "Medium",
    speed: 125,
    description: "Balanced speed for a normal challenge.",
  },
  high: {
    label: "High",
    speed: 80,
    description: "Fast movement — for experienced players.",
  },
};

const START_SNAKE: Point[] = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
];

const START_DIRECTION: Point = { x: 1, y: 0 };

function createFood(snake: Point[]): Point {
  const available: Point[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        available.push({ x, y });
      }
    }
  }

  return available[Math.floor(Math.random() * available.length)] ?? {
    x: 10,
    y: 10,
  };
}

function isSamePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export default function SnakePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [snake, setSnake] = useState<Point[]>(START_SNAKE);
  const [food, setFood] = useState<Point>(() => createFood(START_SNAKE));
  const [direction, setDirection] = useState<Point>(START_DIRECTION);
  const [nextDirection, setNextDirection] =
    useState<Point>(START_DIRECTION);

  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const resultSavedRef = useRef(false);

  const resetGame = useCallback(() => {
    const initialSnake = START_SNAKE.map((segment) => ({ ...segment }));

    setSnake(initialSnake);
    setFood(createFood(initialSnake));
    setDirection(START_DIRECTION);
    setNextDirection(START_DIRECTION);
    setScore(0);
    setGameOver(false);
    setRunning(false);

    resultSavedRef.current = false;
  }, []);

  const startGame = useCallback(() => {
    const initialSnake = START_SNAKE.map((segment) => ({ ...segment }));

    setSnake(initialSnake);
    setFood(createFood(initialSnake));
    setDirection(START_DIRECTION);
    setNextDirection(START_DIRECTION);
    setScore(0);
    setGameOver(false);
    setRunning(true);

    resultSavedRef.current = false;
  }, []);

  const finishGame = useCallback(() => {
    if (resultSavedRef.current) {
      return;
    }

    resultSavedRef.current = true;
    setRunning(false);
    setGameOver(true);

    saveResult("loss", 0);
  }, []);

  const changeDirection = useCallback(
    (newDirection: Point) => {
      if (!running) {
        return;
      }

      const isReverse =
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y;

      if (isReverse) {
        return;
      }

      setNextDirection(newDirection);
    },
    [direction, running],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      const directionMap: Record<string, Point> = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const newDirection = directionMap[key];

      if (!newDirection) {
        return;
      }

      event.preventDefault();
      changeDirection(newDirection);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [changeDirection]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setSnake((currentSnake) => {
        const currentDirection = nextDirection;

        setDirection(currentDirection);

        const head = currentSnake[0];

        const newHead = {
          x: head.x + currentDirection.x,
          y: head.y + currentDirection.y,
        };

        const hitWall =
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE;

        if (hitWall) {
          finishGame();
          return currentSnake;
        }

        const eatingFood = isSamePoint(newHead, food);

        const bodyToCheck = eatingFood
          ? currentSnake
          : currentSnake.slice(0, -1);

        const hitSelf = bodyToCheck.some((segment) =>
          isSamePoint(segment, newHead),
        );

        if (hitSelf) {
          finishGame();
          return currentSnake;
        }

        const updatedSnake = [newHead, ...currentSnake];

        if (eatingFood) {
          setScore((currentScore) => currentScore + 10);
          setFood(createFood(updatedSnake));
          return updatedSnake;
        }

        updatedSnake.pop();

        return updatedSnake;
      });
    }, DIFFICULTY_CONFIG[difficulty].speed);

    return () => {
      window.clearInterval(interval);
    };
  }, [difficulty, finishGame, food, nextDirection, running]);

  const currentDifficulty = DIFFICULTY_CONFIG[difficulty];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
            >
              ← Back to GameHub
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              🐍 Snake
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Eat the food, grow longer, and avoid the walls and yourself.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-right shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Score
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--primary)]">
              {score}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_20px_60px_var(--shadow-color)] sm:p-7">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Difficulty</h2>

              <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                {currentDifficulty.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(
                (level) => {
                  const config = DIFFICULTY_CONFIG[level];
                  const active = difficulty === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={running}
                      onClick={() => setDifficulty(level)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {config.label}
                    </button>
                  );
                },
              )}
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">
              {currentDifficulty.description}
            </p>
          </div>

          <div
            className="mx-auto grid aspect-square w-full max-w-[540px] overflow-hidden rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-soft)]"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map(
              (_, index) => {
                const x = index % BOARD_SIZE;
                const y = Math.floor(index / BOARD_SIZE);

                const snakeIndex = snake.findIndex(
                  (segment) => segment.x === x && segment.y === y,
                );

                const isFood = food.x === x && food.y === y;
                const isHead = snakeIndex === 0;

                return (
                  <div
                    key={`${x}-${y}`}
                    className="flex items-center justify-center border-[0.5px] border-[var(--border)]/20"
                  >
                    {snakeIndex >= 0 && (
                      <div
                        className={`h-[80%] w-[80%] rounded-[30%] ${
                          isHead
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--primary-dark)]"
                        }`}
                      />
                    )}

                    {isFood && (
                      <div className="h-[65%] w-[65%] rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
                    )}
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!running && !gameOver && (
              <button
                type="button"
                onClick={startGame}
                className="rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[var(--primary-dark)]"
              >
                Start Game
              </button>
            )}

            {gameOver && (
              <button
                type="button"
                onClick={startGame}
                className="rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[var(--primary-dark)]"
              >
                Play Again
              </button>
            )}

            {(running || gameOver) && (
              <button
                type="button"
                onClick={resetGame}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-3 text-sm font-semibold transition hover:border-[var(--primary)]"
              >
                Reset
              </button>
            )}
          </div>

          {gameOver && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
              <p className="text-lg font-bold">Game Over</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                You scored{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {score}
                </span>{" "}
                points on {currentDifficulty.label} difficulty.
              </p>
            </div>
          )}

          <div className="mx-auto mt-7 max-w-xs">
            <div className="grid grid-cols-3 gap-2">
              <div />

              <button
                type="button"
                onClick={() => changeDirection({ x: 0, y: -1 })}
                disabled={!running}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-lg transition hover:border-[var(--primary)] disabled:opacity-40"
                aria-label="Move up"
              >
                ↑
              </button>

              <div />

              <button
                type="button"
                onClick={() => changeDirection({ x: -1, y: 0 })}
                disabled={!running}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-lg transition hover:border-[var(--primary)] disabled:opacity-40"
                aria-label="Move left"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => changeDirection({ x: 0, y: 1 })}
                disabled={!running}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-lg transition hover:border-[var(--primary)] disabled:opacity-40"
                aria-label="Move down"
              >
                ↓
              </button>

              <button
                type="button"
                onClick={() => changeDirection({ x: 1, y: 0 })}
                disabled={!running}
                className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-lg transition hover:border-[var(--primary)] disabled:opacity-40"
                aria-label="Move right"
              >
                →
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Keyboard: Arrow Keys or W A S D
          </p>
        </section>
      </div>
    </main>
  );
}