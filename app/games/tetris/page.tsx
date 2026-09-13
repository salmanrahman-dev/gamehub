"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Cell = string | null;

type PieceDefinition = {
  name: string;
  shape: number[][];
  color: string;
};

type Piece = {
  shape: number[][];
  row: number;
  col: number;
  color: string;
  name: string;
};

const ROWS = 20;
const COLS = 10;

const PIECES: PieceDefinition[] = [
  {
    name: "I",
    shape: [[1, 1, 1, 1]],
    color: "#22d3ee",
  },
  {
    name: "O",
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#facc15",
  },
  {
    name: "T",
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#a855f7",
  },
  {
    name: "L",
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#fb923c",
  },
  {
    name: "J",
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#3b82f6",
  },
  {
    name: "S",
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#4ade80",
  },
  {
    name: "Z",
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#f43f5e",
  },
];

function createBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  );
}

/*
 * IMPORTANT:
 * This function is only called after hydration or in event handlers.
 * We intentionally do NOT call Math.random() for the initial state.
 */
function createRandomPiece(): Piece {
  const definition =
    PIECES[Math.floor(Math.random() * PIECES.length)];

  return {
    name: definition.name,
    shape: definition.shape.map((row) => [...row]),
    row: 0,
    col: Math.floor(
      (COLS - definition.shape[0].length) / 2,
    ),
    color: definition.color,
  };
}

/*
 * Deterministic initial pieces.
 *
 * This prevents server/client hydration mismatches.
 */
function createInitialPiece(
  definition: PieceDefinition,
): Piece {
  return {
    name: definition.name,
    shape: definition.shape.map((row) => [...row]),
    row: 0,
    col: Math.floor(
      (COLS - definition.shape[0].length) / 2,
    ),
    color: definition.color,
  };
}

function rotateShape(shape: number[][]): number[][] {
  return shape[0].map((_, columnIndex) =>
    shape.map((row) => row[columnIndex]).reverse(),
  );
}

function MiniPiece({
  piece,
}: {
  piece: Piece | null;
}) {
  if (!piece) {
    return (
      <div className="flex h-24 w-24 items-center justify-center">
        <span
          className="text-xs"
          style={{ color: "var(--muted)" }}
        >
          Next
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${piece.shape[0].length}, 18px)`,
        }}
      >
        {piece.shape.map((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className="h-[18px] w-[18px] rounded-[3px]"
              style={{
                backgroundColor: cell
                  ? piece.color
                  : "transparent",
                boxShadow: cell
                  ? "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 5px rgba(0,0,0,.15)"
                  : "none",
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        background: "var(--surface-soft)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>

        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {label}
        </span>
      </div>

      <p
        className="mt-2 truncate text-lg font-black tabular-nums"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className="text-sm"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>

      <span
        className="text-sm font-black tabular-nums"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ControlButton({
  label,
  ariaLabel,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-12 items-center justify-center rounded-xl border text-lg font-black transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
      style={{
        background: "var(--surface-soft)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      {label}
    </button>
  );
}

export default function TetrisPage() {
  /*
   * Deterministic initial state.
   *
   * DO NOT use Math.random() directly here.
   * It would produce different server/client HTML.
   */
  const [board, setBoard] = useState<Cell[][]>(
    createBoard,
  );

  const [piece, setPiece] = useState<Piece>(() =>
    createInitialPiece(PIECES[0]),
  );

  const [nextPiece, setNextPiece] =
    useState<Piece>(() =>
      createInitialPiece(PIECES[1]),
    );

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastClear, setLastClear] = useState(0);

  /*
   * Once hydration is complete, randomize the actual
   * starting pieces on the client.
   */
  useEffect(() => {
    setPiece(createRandomPiece());
    setNextPiece(createRandomPiece());
  }, []);

  const speed = Math.max(
    120,
    700 - (level - 1) * 55,
  );

  const canMove = useCallback(
    (
      targetRow: number,
      targetCol: number,
      targetShape = piece.shape,
    ) => {
      return targetShape.every((row, rowIndex) =>
        row.every((cell, columnIndex) => {
          if (!cell) return true;

          const boardRow =
            targetRow + rowIndex;
          const boardCol =
            targetCol + columnIndex;

          if (
            boardCol < 0 ||
            boardCol >= COLS ||
            boardRow >= ROWS
          ) {
            return false;
          }

          if (
            boardRow >= 0 &&
            board[boardRow][boardCol]
          ) {
            return false;
          }

          return true;
        }),
      );
    },
    [board, piece.shape],
  );

  const getDropRow = useCallback(
    (
      targetPiece: Piece,
      targetBoard: Cell[][] = board,
    ) => {
      let row = targetPiece.row;

      const checkMove = (
        testRow: number,
      ) => {
        return targetPiece.shape.every(
          (shapeRow, rowIndex) =>
            shapeRow.every(
              (cell, columnIndex) => {
                if (!cell) return true;

                const boardRow =
                  testRow + rowIndex;
                const boardCol =
                  targetPiece.col +
                  columnIndex;

                if (
                  boardCol < 0 ||
                  boardCol >= COLS ||
                  boardRow >= ROWS
                ) {
                  return false;
                }

                if (
                  boardRow >= 0 &&
                  targetBoard[boardRow][boardCol]
                ) {
                  return false;
                }

                return true;
              },
            ),
        );
      };

      while (checkMove(row + 1)) {
        row += 1;
      }

      return row;
    },
    [board],
  );

  const lockPiece = useCallback(() => {
    const nextBoard = board.map((row) => [
      ...row,
    ]);

    piece.shape.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (!cell) return;

        const boardRow =
          piece.row + rowIndex;
        const boardCol =
          piece.col + columnIndex;

        if (
          boardRow >= 0 &&
          boardRow < ROWS &&
          boardCol >= 0 &&
          boardCol < COLS
        ) {
          nextBoard[boardRow][boardCol] =
            piece.color;
        }
      });
    });

    const remainingRows = nextBoard.filter(
      (row) => row.some((cell) => !cell),
    );

    const cleared =
      ROWS - remainingRows.length;

    while (remainingRows.length < ROWS) {
      remainingRows.unshift(
        Array(COLS).fill(null),
      );
    }

    const lineScores = [
      0,
      100,
      300,
      500,
      800,
    ];

    const points =
      cleared === 0
        ? 10
        : lineScores[cleared] * level;

    const newScore = score + points;
    const newLines = lines + cleared;
    const newLevel =
      Math.floor(newLines / 10) + 1;

    const upcoming = nextPiece;
    const freshNext = createRandomPiece();

    const spawnRow = 0;
    const spawnCol = Math.floor(
      (COLS - upcoming.shape[0].length) / 2,
    );

    const spawnPiece: Piece = {
      ...upcoming,
      row: spawnRow,
      col: spawnCol,
    };

    const canSpawn = spawnPiece.shape.every(
      (row, rowIndex) =>
        row.every(
          (cell, columnIndex) => {
            if (!cell) return true;

            const boardRow =
              spawnRow + rowIndex;
            const boardCol =
              spawnCol + columnIndex;

            return (
              boardRow >= 0 &&
              boardRow < ROWS &&
              boardCol >= 0 &&
              boardCol < COLS &&
              !remainingRows[boardRow][
                boardCol
              ]
            );
          },
        ),
    );

    setBoard(remainingRows);
    setScore(newScore);
    setLines(newLines);
    setLevel(newLevel);
    setLastClear(cleared);

    if (newScore > highScore) {
      setHighScore(newScore);
    }

    if (!canSpawn) {
      setGameOver(true);
      return;
    }

    setPiece(spawnPiece);
    setNextPiece(freshNext);
  }, [
    board,
    highScore,
    level,
    lines,
    nextPiece,
    piece,
    score,
  ]);

  const moveDown = useCallback(() => {
    if (paused || gameOver) return;

    if (
      canMove(
        piece.row + 1,
        piece.col,
        piece.shape,
      )
    ) {
      setPiece((current) => ({
        ...current,
        row: current.row + 1,
      }));

      return;
    }

    lockPiece();
  }, [
    canMove,
    gameOver,
    lockPiece,
    paused,
    piece.col,
    piece.row,
    piece.shape,
  ]);

  const hardDrop = useCallback(() => {
    if (paused || gameOver) return;

    const landingRow = getDropRow(piece);
    const distance =
      landingRow - piece.row;

    if (distance > 0) {
      setScore(
        (current) =>
          current + distance * 2,
      );
    }

    /*
     * Move to landing position and lock immediately.
     */
    setPiece((current) => ({
      ...current,
      row: landingRow,
    }));

    window.setTimeout(() => {
      lockPiece();
    }, 0);
  }, [
    gameOver,
    getDropRow,
    lockPiece,
    paused,
    piece,
  ]);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setPiece(createRandomPiece());
    setNextPiece(createRandomPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setLastClear(0);
    setPaused(false);
    setGameOver(false);
  }, []);

  const togglePause = useCallback(() => {
    if (gameOver) return;

    setPaused((current) => !current);
  }, [gameOver]);

  /*
   * Automatic falling.
   */
  useEffect(() => {
    if (paused || gameOver) return;

    const timer = window.setInterval(
      moveDown,
      speed,
    );

    return () =>
      window.clearInterval(timer);
  }, [
    moveDown,
    paused,
    gameOver,
    speed,
  ]);

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        togglePause();
        return;
      }

      if (paused || gameOver) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();

        if (
          canMove(
            piece.row,
            piece.col - 1,
            piece.shape,
          )
        ) {
          setPiece((current) => ({
            ...current,
            col: current.col - 1,
          }));
        }
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();

        if (
          canMove(
            piece.row,
            piece.col + 1,
            piece.shape,
          )
        ) {
          setPiece((current) => ({
            ...current,
            col: current.col + 1,
          }));
        }
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveDown();
      }

      if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "x"
      ) {
        event.preventDefault();

        const rotated = rotateShape(
          piece.shape,
        );

        if (
          canMove(
            piece.row,
            piece.col,
            rotated,
          )
        ) {
          setPiece((current) => ({
            ...current,
            shape: rotated,
          }));
        }
      }

      if (event.code === "Space") {
        event.preventDefault();
        hardDrop();
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
  }, [
    canMove,
    gameOver,
    hardDrop,
    moveDown,
    paused,
    piece,
    togglePause,
  ]);

  const ghostRow = getDropRow(piece);

  /*
   * Build the visual board.
   */
  const displayBoard = board.map((row) => [
    ...row,
  ]);

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (!cell) return;

      const boardRow =
        piece.row + rowIndex;
      const boardCol =
        piece.col + columnIndex;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        displayBoard[boardRow][boardCol] =
          piece.color;
      }
    });
  });

  const ghostCells = new Set<string>();

  if (ghostRow !== piece.row) {
    piece.shape.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (!cell) return;

        const boardRow =
          ghostRow + rowIndex;
        const boardCol =
          piece.col + columnIndex;

        if (
          boardRow >= 0 &&
          boardRow < ROWS &&
          boardCol >= 0 &&
          boardCol < COLS &&
          !board[boardRow][boardCol]
        ) {
          ghostCells.add(
            `${boardRow}-${boardCol}`,
          );
        }
      });
    });
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* ==============================================================
            Back navigation
           ============================================================== */}

        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-xl border-2 border-transparent bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            ← Back to GameHub
          </Link>
        </div>

        {/* ==============================================================
            Hero
           ============================================================== */}

        <section className="mb-7">
          <div
            className="relative overflow-hidden rounded-[2rem] border px-5 py-7 shadow-sm sm:px-8"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--card)), var(--card))",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 18%, transparent)",
              }}
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 14%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  GameHub Arcade
                </span>

                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  Level {level}
                </span>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <h1
                    className="text-4xl font-black tracking-tight sm:text-5xl"
                    style={{
                      color: "var(--foreground)",
                    }}
                  >
                    🧱 Tetris
                  </h1>

                  <p
                    className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Stack, rotate, clear, and
                    survive. Every line brings
                    you closer to the next level.
                  </p>
                </div>

                <div
                  className="rounded-2xl border px-5 py-3 sm:min-w-40"
                  style={{
                    background:
                      "color-mix(in srgb, var(--card) 82%, transparent)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    High Score
                  </p>

                  <p
                    className="mt-1 text-2xl font-black tabular-nums"
                    style={{
                      color: "var(--foreground)",
                    }}
                  >
                    {highScore.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            Main Game Dashboard
           ============================================================== */}

        <section className="grid gap-5 lg:grid-cols-[1fr_290px]">
          {/* ============================================================
              Main Game
             ============================================================ */}

          <div
            className="rounded-[2rem] border p-4 shadow-sm sm:p-6"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            {/* Score cards */}

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreCard
                label="Score"
                value={score.toLocaleString()}
                icon="⭐"
              />

              <ScoreCard
                label="Lines"
                value={lines}
                icon="▤"
              />

              <ScoreCard
                label="Level"
                value={level}
                icon="⚡"
              />

              <ScoreCard
                label="Best"
                value={highScore.toLocaleString()}
                icon="🏆"
              />
            </div>

            {/* ==========================================================
                Board
               ========================================================== */}

            <div className="flex justify-center">
              <div
                className="relative rounded-[1.5rem] border p-2 shadow-inner"
                style={{
                  background:
                    "color-mix(in srgb, var(--background) 92%, var(--primary) 8%)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="grid overflow-hidden rounded-xl"
                  style={{
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                    width: "min(82vw, 360px)",
                    aspectRatio: `${COLS}/${ROWS}`,
                    background:
                      "rgba(2, 6, 23, 0.16)",
                  }}
                >
                  {displayBoard.map(
                    (row, rowIndex) =>
                      row.map(
                        (cell, columnIndex) => {
                          const key = `${rowIndex}-${columnIndex}`;
                          const isGhost =
                            ghostCells.has(key);

                          return (
                            <div
                              key={key}
                              className="relative border"
                              style={{
                                backgroundColor:
                                  cell ??
                                  "color-mix(in srgb, var(--background) 94%, var(--foreground) 6%)",
                                borderColor:
                                  "color-mix(in srgb, var(--border) 45%, transparent)",
                              }}
                            >
                              {cell && (
                                <div
                                  className="pointer-events-none absolute inset-[1px] rounded-[3px]"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, rgba(255,255,255,.28), transparent 48%)",
                                  }}
                                />
                              )}

                              {isGhost && !cell && (
                                <div
                                  className="pointer-events-none absolute inset-[2px] rounded-[3px] border-2"
                                  style={{
                                    borderColor:
                                      piece.color,
                                    opacity: 0.3,
                                  }}
                                />
                              )}
                            </div>
                          );
                        },
                      ),
                  )}
                </div>

                {/* ======================================================
                    Pause / Game Over Overlay
                   ====================================================== */}

                {(paused || gameOver) && (
                  <div
                    className="absolute inset-2 flex items-center justify-center rounded-xl p-5 backdrop-blur-sm"
                    style={{
                      background:
                        "color-mix(in srgb, var(--background) 76%, transparent)",
                    }}
                  >
                    <div className="text-center">
                      <div className="text-4xl">
                        {gameOver
                          ? "🏁"
                          : "⏸️"}
                      </div>

                      <h2
                        className="mt-3 text-2xl font-black"
                        style={{
                          color:
                            "var(--foreground)",
                        }}
                      >
                        {gameOver
                          ? "Game Over"
                          : "Game Paused"}
                      </h2>

                      <p
                        className="mt-1 text-sm"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {gameOver
                          ? `Final score: ${score.toLocaleString()}`
                          : "Your board is waiting."}
                      </p>

                      <button
                        type="button"
                        onClick={
                          gameOver
                            ? resetGame
                            : togglePause
                        }
                        className="mt-5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
                        style={{
                          background:
                            "var(--primary)",
                        }}
                      >
                        {gameOver
                          ? "Play Again"
                          : "Resume"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ==========================================================
                Controls
               ========================================================== */}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      "var(--primary)",
                  }}
                />

                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{
                    color: "var(--muted)",
                  }}
                >
                  Controls
                </span>
              </div>

              <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
                <div />

                <ControlButton
                  label="↑"
                  ariaLabel="Rotate piece"
                  onClick={() => {
                    if (
                      paused ||
                      gameOver
                    ) {
                      return;
                    }

                    const rotated =
                      rotateShape(
                        piece.shape,
                      );

                    if (
                      canMove(
                        piece.row,
                        piece.col,
                        rotated,
                      )
                    ) {
                      setPiece(
                        (current) => ({
                          ...current,
                          shape: rotated,
                        }),
                      );
                    }
                  }}
                />

                <div />

                <ControlButton
                  label="←"
                  ariaLabel="Move left"
                  onClick={() => {
                    if (
                      paused ||
                      gameOver
                    ) {
                      return;
                    }

                    if (
                      canMove(
                        piece.row,
                        piece.col - 1,
                      )
                    ) {
                      setPiece(
                        (current) => ({
                          ...current,
                          col:
                            current.col - 1,
                        }),
                      );
                    }
                  }}
                />

                <ControlButton
                  label="↓"
                  ariaLabel="Move down"
                  onClick={moveDown}
                />

                <ControlButton
                  label="→"
                  ariaLabel="Move right"
                  onClick={() => {
                    if (
                      paused ||
                      gameOver
                    ) {
                      return;
                    }

                    if (
                      canMove(
                        piece.row,
                        piece.col + 1,
                      )
                    ) {
                      setPiece(
                        (current) => ({
                          ...current,
                          col:
                            current.col + 1,
                        }),
                      );
                    }
                  }}
                />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={hardDrop}
                  disabled={
                    paused || gameOver
                  }
                  className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background:
                      "var(--surface-soft)",
                    borderColor:
                      "var(--border)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  ⬇ Hard Drop
                </button>

                <button
                  type="button"
                  onClick={togglePause}
                  disabled={gameOver}
                  className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background:
                      "var(--surface-soft)",
                    borderColor:
                      "var(--border)",
                    color:
                      "var(--foreground)",
                  }}
                >
                  {paused
                    ? "▶ Resume"
                    : "⏸ Pause"}
                </button>
              </div>

              <div
                className="mt-3 text-center text-xs"
                style={{
                  color: "var(--muted)",
                }}
              >
                Keyboard: ← → move · ↑ rotate · ↓
                drop · Space hard drop · Esc pause
              </div>
            </div>
          </div>

          {/* ============================================================
              Right GameHub Panel
             ============================================================ */}

          <aside className="space-y-5">
            {/* Next Piece */}

            <div
              className="rounded-[2rem] border p-5 shadow-sm"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Next Piece
                  </p>

                  <h2
                    className="mt-1 text-lg font-black"
                    style={{
                      color:
                        "var(--foreground)",
                    }}
                  >
                    Your queue
                  </h2>
                </div>

                <span className="text-xl">
                  🎲
                </span>
              </div>

              <div
                className="mt-4 flex justify-center rounded-2xl border py-4"
                style={{
                  background:
                    "var(--surface-soft)",
                  borderColor: "var(--border)",
                }}
              >
                <MiniPiece
                  piece={nextPiece}
                />
              </div>
            </div>

            {/* Performance */}

            <div
              className="rounded-[2rem] border p-5 shadow-sm"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Performance
                  </p>

                  <h2
                    className="mt-1 text-lg font-black"
                    style={{
                      color:
                        "var(--foreground)",
                    }}
                  >
                    Run stats
                  </h2>
                </div>

                <span className="text-xl">
                  📊
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <StatRow
                  label="Current score"
                  value={score.toLocaleString()}
                />

                <StatRow
                  label="Lines cleared"
                  value={lines}
                />

                <StatRow
                  label="Current level"
                  value={level}
                />

                <StatRow
                  label="Best score"
                  value={highScore.toLocaleString()}
                />
              </div>
            </div>

            {/* Last Clear */}

            <div
              className="rounded-[2rem] border p-5 shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--card)), var(--card))",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 16%, transparent)",
                  }}
                >
                  🏆
                </div>

                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Last clear
                  </p>

                  <p
                    className="font-black"
                    style={{
                      color:
                        "var(--foreground)",
                    }}
                  >
                    {lastClear === 0
                      ? "Keep stacking!"
                      : lastClear === 4
                        ? "TETRIS! +800"
                        : `${lastClear} line${
                            lastClear > 1
                              ? "s"
                              : ""
                          } cleared`}
                  </p>
                </div>
              </div>
            </div>

            {/* Restart */}

            <button
              type="button"
              onClick={resetGame}
              className="w-full rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              }}
            >
              ↻ Restart Game
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}