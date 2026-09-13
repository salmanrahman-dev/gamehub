"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { saveResult } from "@/lib/game";

type GameStatus = "ready" | "playing" | "paused" | "level-complete" | "game-over";

type TileKind =
  | "ruby"
  | "azure"
  | "emerald"
  | "gold"
  | "violet"
  | "coral"
  | "cyan"
  | "lime";

type TilePattern = "solid" | "stripe" | "cross" | "diamond";

type Tile = {
  id: string;
  kind: TileKind;
  pattern: TilePattern;
  targetIndex: number;
};

type Cell = Tile | null;

type LevelDefinition = {
  level: number;
  size: number;
  empty: number;
};

type GameState = {
  level: number;
  board: Cell[];
  tray: Tile[];
  moves: number;
  score: number;
  combo: number;
  correct: number;
  wrong: number;
};

const LEVELS: LevelDefinition[] = [
  { level: 1, size: 3, empty: 1 },
  { level: 2, size: 4, empty: 3 },
  { level: 3, size: 5, empty: 5 },
  { level: 4, size: 6, empty: 7 },
  { level: 5, size: 7, empty: 9 },
  { level: 6, size: 8, empty: 11 },
  { level: 7, size: 9, empty: 13 },
  { level: 8, size: 10, empty: 15 },
  { level: 9, size: 10, empty: 15 },
  { level: 10, size: 10, empty: 15 },
];

const BEST_SCORE_KEY = "gamehub-color-tile-best-score";
const LAST_LEVEL_KEY = "gamehub-color-tile-last-level";

const TILE_KINDS: TileKind[] = [
  "ruby",
  "azure",
  "emerald",
  "gold",
  "violet",
  "coral",
  "cyan",
  "lime",
];

const TILE_PATTERNS: TilePattern[] = [
  "solid",
  "stripe",
  "cross",
  "diamond",
];

const TIER_INFO = [
  {
    minLevel: 1,
    name: "NORMAL",
    icon: "⬢",
    description: "Classic pixel tiles",
  },
  {
    minLevel: 3,
    name: "BRONZE",
    icon: "◆",
    description: "Harder patterns",
  },
  {
    minLevel: 5,
    name: "SILVER",
    icon: "◇",
    description: "Sharper combinations",
  },
  {
    minLevel: 7,
    name: "GOLD",
    icon: "✦",
    description: "Elite tile patterns",
  },
  {
    minLevel: 9,
    name: "DIAMOND",
    icon: "✧",
    description: "Ultimate challenge",
  },
];

function getTier(level: number) {
  return (
    [...TIER_INFO]
      .reverse()
      .find((tier) => level >= tier.minLevel) ??
    TIER_INFO[0]
  );
}

function getLevel(level: number): LevelDefinition {
  return (
    LEVELS[
      Math.max(
        0,
        Math.min(LEVELS.length - 1, level - 1),
      )
    ] ?? LEVELS[0]
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createTiles(size: number): Tile[] {
  const total = size * size;

  return Array.from({ length: total }, (_, index) => {
    const kind =
      TILE_KINDS[
        (index +
          Math.floor(index / size) * 2 +
          size) %
          TILE_KINDS.length
      ];

    const pattern =
      TILE_PATTERNS[
        (index +
          Math.floor(index / size) +
          size) %
          TILE_PATTERNS.length
      ];

    return {
      id: `${size}-${index}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      kind,
      pattern,
      targetIndex: index,
    };
  });
}

function createGame(level: number, score = 0): GameState {
  const definition = getLevel(level);
  const tiles = createTiles(definition.size);

  const emptyIndexes = new Set<number>(
    shuffle(
      Array.from(
        { length: definition.size * definition.size },
        (_, index) => index,
      ),
    ).slice(0, definition.empty),
  );

  const board: Cell[] = Array(
    definition.size * definition.size,
  ).fill(null);

  const tray: Tile[] = [];

  tiles.forEach((tile) => {
    if (emptyIndexes.has(tile.targetIndex)) {
      tray.push(tile);
    } else {
      board[tile.targetIndex] = tile;
    }
  });

  const baseMoves =
    definition.empty +
    2 +
    Math.max(0, 5 - level);

  return {
    level,
    board,
    tray: shuffle(tray),
    moves: baseMoves,
    score,
    combo: 0,
    correct: 0,
    wrong: 0,
  };
}

function sameTile(a: Tile | null, b: Tile | null) {
  if (!a || !b) {
    return false;
  }

  return (
    a.kind === b.kind &&
    a.pattern === b.pattern
  );
}

function pixelStyle(kind: TileKind) {
  const styles: Record<
    TileKind,
    {
      background: string;
      dark: string;
      light: string;
    }
  > = {
    ruby: {
      background: "#ef4444",
      dark: "#991b1b",
      light: "#fca5a5",
    },
    azure: {
      background: "#3b82f6",
      dark: "#1e40af",
      light: "#93c5fd",
    },
    emerald: {
      background: "#22c55e",
      dark: "#166534",
      light: "#86efac",
    },
    gold: {
      background: "#facc15",
      dark: "#a16207",
      light: "#fef08a",
    },
    violet: {
      background: "#a855f7",
      dark: "#6b21a8",
      light: "#d8b4fe",
    },
    coral: {
      background: "#fb7185",
      dark: "#9f1239",
      light: "#fecdd3",
    },
    cyan: {
      background: "#06b6d4",
      dark: "#155e75",
      light: "#a5f3fc",
    },
    lime: {
      background: "#84cc16",
      dark: "#3f6212",
      light: "#bef264",
    },
  };

  return styles[kind];
}

function TileVisual({
  tile,
  size = "normal",
  selected = false,
  disabled = false,
}: {
  tile: Tile;
  size?: "small" | "normal" | "large";
  selected?: boolean;
  disabled?: boolean;
}) {
  const colors = pixelStyle(tile.kind);

  const dimensions =
    size === "small"
      ? "h-9 w-9 sm:h-11 sm:w-11"
      : size === "large"
        ? "h-14 w-14 sm:h-16 sm:w-16"
        : "h-12 w-12 sm:h-14 sm:w-14";

  return (
    <div
      className={[
        "relative overflow-hidden",
        dimensions,
        "border-[3px]",
        "transition-all duration-150",
        selected
          ? "-translate-y-1 scale-110"
          : "hover:-translate-y-1 hover:scale-[1.04]",
        disabled
          ? "cursor-default opacity-70"
          : "cursor-pointer",
      ].join(" ")}
      style={{
        background: colors.background,
        borderColor: colors.dark,
        boxShadow: selected
          ? `0 0 0 3px rgba(250,204,21,.75), 0 8px 0 ${colors.dark}`
          : `4px 4px 0 ${colors.dark}`,
        imageRendering: "pixelated",
      }}
    >
      {/* Pixel shine */}
      <span
        className="absolute left-1 top-1 h-2 w-2"
        style={{
          background: colors.light,
        }}
      />

      <span
        className="absolute left-3 top-2 h-1.5 w-4"
        style={{
          background: colors.light,
          opacity: 0.8,
        }}
      />

      {/* Pattern */}
      {tile.pattern === "stripe" && (
        <>
          <span
            className="absolute inset-y-0 left-2 w-1.5"
            style={{
              background: colors.dark,
              opacity: 0.65,
            }}
          />
          <span
            className="absolute inset-y-0 left-6 w-1.5"
            style={{
              background: colors.dark,
              opacity: 0.65,
            }}
          />
        </>
      )}

      {tile.pattern === "cross" && (
        <>
          <span
            className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2"
            style={{
              background: colors.dark,
              opacity: 0.55,
            }}
          />
          <span
            className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2"
            style={{
              background: colors.dark,
              opacity: 0.55,
            }}
          />
        </>
      )}

      {tile.pattern === "diamond" && (
        <>
          <span
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2"
            style={{
              borderColor: colors.dark,
              opacity: 0.7,
            }}
          />
        </>
      )}

      {/* Pixel corner */}
      <span
        className="absolute bottom-1 right-1 h-2 w-2"
        style={{
          background: colors.dark,
        }}
      />

      {selected && (
        <span className="absolute inset-0 animate-pulse bg-white/20" />
      )}
    </div>
  );
}

function EmptyCell({
  highlighted,
  size,
}: {
  highlighted: boolean;
  size: number;
}) {
  return (
    <div
      className={[
        "relative aspect-square",
        "border-[3px]",
        "flex items-center justify-center",
        "transition-all duration-150",
        highlighted
          ? "scale-[1.03]"
          : "",
      ].join(" ")}
      style={{
        borderColor: highlighted
          ? "#facc15"
          : "rgba(148,163,184,.35)",
        background: highlighted
          ? "rgba(250,204,21,.12)"
          : "rgba(15,23,42,.04)",
        boxShadow: highlighted
          ? "inset 0 0 0 2px rgba(250,204,21,.15)"
          : "inset 0 0 0 1px rgba(255,255,255,.25)",
      }}
    >
      <div
        className="absolute"
        style={{
          width: `${Math.max(5, 18 - size)}px`,
          height: `${Math.max(5, 18 - size)}px`,
          background: highlighted
            ? "rgba(250,204,21,.35)"
            : "rgba(148,163,184,.18)",
        }}
      />

      {highlighted && (
        <div className="absolute text-xs font-black text-yellow-500">
          +
        </div>
      )}
    </div>
  );
}

export default function ColorTilePage() {
  const gameRef = useRef<GameState>(
    createGame(1),
  );

  const resultSavedRef = useRef(false);

  const [status, setStatus] =
    useState<GameStatus>("ready");

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedTileId, setSelectedTileId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<string>("");

  const [celebration, setCelebration] =
    useState(0);

  const [trayPulse, setTrayPulse] =
    useState(false);

  const definition = useMemo(
    () => getLevel(level),
    [level],
  );

  const tier = useMemo(
    () => getTier(level),
    [level],
  );

  const selectedTile = useMemo(() => {
    if (!selectedTileId) {
      return null;
    }

    return (
      gameRef.current.tray.find(
        (tile) => tile.id === selectedTileId,
      ) ?? null
    );
  }, [selectedTileId, trayPulse]);

  const startLevel = useCallback(
    (nextLevel: number, currentScore = 0) => {
      const game = createGame(
        nextLevel,
        currentScore,
      );

      gameRef.current = game;

      setLevel(nextLevel);
      setScore(currentScore);
      setMoves(game.moves);
      setCombo(0);
      setSelectedTileId(null);
      setFeedback("");
      setCelebration(0);
      setTrayPulse((value) => !value);
    },
    [],
  );

  const startGame = useCallback(() => {
    resultSavedRef.current = false;
    startLevel(1, 0);
    setStatus("playing");
  }, [startLevel]);

  const restartLevel = useCallback(() => {
    const currentScore = gameRef.current.score;

    gameRef.current = createGame(
      gameRef.current.level,
      currentScore,
    );

    setLevel(gameRef.current.level);
    setScore(currentScore);
    setMoves(gameRef.current.moves);
    setCombo(0);
    setSelectedTileId(null);
    setFeedback("");
    setCelebration(0);
    setTrayPulse((value) => !value);
    setStatus("playing");
  }, []);

  const resetGame = useCallback(() => {
    resultSavedRef.current = false;
    startLevel(1, 0);
    setStatus("ready");
  }, [startLevel]);

  const finishGame = useCallback(() => {
    if (resultSavedRef.current) {
      return;
    }

    resultSavedRef.current = true;

    const finalScore = gameRef.current.score;

    if (finalScore > bestScore) {
      setBestScore(finalScore);

      try {
        localStorage.setItem(
          BEST_SCORE_KEY,
          String(finalScore),
        );
      } catch {
        // Ignore storage errors.
      }
    }

    saveResult("loss", finalScore);
    setStatus("game-over");
  }, [bestScore]);

  const completeLevel = useCallback(() => {
    const game = gameRef.current;

    const levelBonus =
      game.level * 150;

    const comboBonus =
      game.combo * 50;

    const perfectBonus =
      game.wrong === 0 ? 250 : 0;

    game.score +=
      levelBonus +
      comboBonus +
      perfectBonus;

    setScore(game.score);
    setCelebration(1);
    setStatus("level-complete");

    if (game.score > bestScore) {
      setBestScore(game.score);

      try {
        localStorage.setItem(
          BEST_SCORE_KEY,
          String(game.score),
        );
      } catch {
        // Ignore storage errors.
      }
    }

    try {
      localStorage.setItem(
        LAST_LEVEL_KEY,
        String(game.level),
      );
    } catch {
      // Ignore storage errors.
    }

    if (game.level >= LEVELS.length) {
      saveResult("win", game.score);
      resultSavedRef.current = true;
    }
  }, [bestScore]);

  const placeTile = useCallback(
    (index: number) => {
      if (status !== "playing") {
        return;
      }

      const game = gameRef.current;

      if (game.board[index]) {
        return;
      }

      if (!selectedTileId) {
        setFeedback("SELECT A TILE FIRST");
        return;
      }

      const tileIndex =
        game.tray.findIndex(
          (tile) => tile.id === selectedTileId,
        );

      if (tileIndex < 0) {
        return;
      }

      const tile = game.tray[tileIndex];

      game.moves -= 1;

      setMoves(game.moves);

      if (tile.targetIndex === index) {
        game.board[index] = tile;
        game.tray.splice(tileIndex, 1);

        game.correct += 1;
        game.combo += 1;

        const points =
          100 +
          game.level * 25 +
          game.combo * 15;

        game.score += points;

        // Correct match gives the player another move.
        game.moves += 1;

        setScore(game.score);
        setMoves(game.moves);
        setCombo(game.combo);
        setSelectedTileId(null);
        setFeedback(`+${points}  •  +1 MOVE`);
        setTrayPulse((value) => !value);

        if (game.tray.length === 0) {
          completeLevel();
          return;
        }

        return;
      }

      // Wrong placement.
      game.wrong += 1;
      game.combo = 0;

      setCombo(0);
      setSelectedTileId(null);
      setFeedback("WRONG TILE  •  -1 MOVE");
      setTrayPulse((value) => !value);

      if (game.moves <= 0) {
        finishGame();
      }
    },
    [
      completeLevel,
      finishGame,
      selectedTileId,
      status,
    ],
  );

  const selectTile = useCallback(
    (tileId: string) => {
      if (status !== "playing") {
        return;
      }

      setSelectedTileId((current) =>
        current === tileId
          ? null
          : tileId,
      );

      setFeedback(
        selectedTileId === tileId
          ? ""
          : "NOW SELECT A GRID SLOT",
      );
    },
    [selectedTileId, status],
  );

  const nextLevel = useCallback(() => {
    if (gameRef.current.level >= LEVELS.length) {
      startGame();
      return;
    }

    const next =
      gameRef.current.level + 1;

    startLevel(
      next,
      gameRef.current.score,
    );

    setStatus("playing");
  }, [startGame, startLevel]);

  const togglePause = useCallback(() => {
    setStatus((current) => {
      if (current === "playing") {
        return "paused";
      }

      if (current === "paused") {
        return "playing";
      }

      return current;
    });
  }, []);

  // Load saved best score.
  useEffect(() => {
    try {
      const saved = Number(
        localStorage.getItem(
          BEST_SCORE_KEY,
        ) ?? "0",
      );

      if (
        Number.isFinite(saved) &&
        saved > 0
      ) {
        setBestScore(saved);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  // Keyboard support.
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === "Enter" &&
        (status === "ready" ||
          status === "game-over")
      ) {
        event.preventDefault();
        startGame();
      }

      if (
        event.code === "Space" &&
        status === "level-complete"
      ) {
        event.preventDefault();
        nextLevel();
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        togglePause();
      }

      if (event.code === "Escape") {
        setSelectedTileId(null);
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
    nextLevel,
    startGame,
    status,
    togglePause,
  ]);

  // Automatic visual pulse for feedback.
  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(
      () => setFeedback(""),
      1300,
    );

    return () =>
      window.clearTimeout(timer);
  }, [feedback]);

  const boardCells = gameRef.current.board;
  const trayTiles = gameRef.current.tray;

  const boardGap =
    definition.size >= 9
      ? "gap-0.5 sm:gap-1"
      : definition.size >= 7
        ? "gap-1 sm:gap-1.5"
        : "gap-1.5 sm:gap-2";

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
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="inline-flex w-fit items-center rounded-xl border-2 border-transparent bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                ← Back to GameHub
              </Link>
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              🎨 Color Tile
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"
              style={{
                color: "var(--muted)",
              }}
            >
              Match every colorful pixel tile
              with its hidden pattern position.
              Correct matches reward you with
              extra moves and bigger scores.
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
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
            borderColor: "var(--border)",
            background: "var(--card)",
            boxShadow:
              "0 20px 60px var(--shadow-color)",
          }}
        >
          {/* HUD */}
          <div
            className="grid grid-cols-2 border-b sm:grid-cols-6"
            style={{
              borderColor: "var(--border)",
            }}
          >
            {[
              ["Score", score],
              ["Best", bestScore],
              [
                "Level",
                `LV ${level}`,
              ],
              ["Moves", moves],
              [
                "Combo",
                `x${combo}`,
              ],
              [
                "Status",
                status === "game-over"
                  ? "Over"
                  : status === "paused"
                    ? "Paused"
                    : status ===
                        "level-complete"
                      ? "Clear!"
                      : status ===
                          "playing"
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
                    color: "var(--muted)",
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

          {/* Game area */}
          <div
            className="relative overflow-hidden p-3 sm:p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,23,42,.025), rgba(11,180,170,.055))",
            }}
          >
            {/* Pixel background decoration */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(100,116,139,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,.08) 1px, transparent 1px)",
                backgroundSize:
                  "24px 24px",
              }}
            />

            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
              {/* Main board */}
              <div
                className="rounded-[1.75rem] border p-3 sm:p-5"
                style={{
                  borderColor:
                    "var(--border)",
                  background:
                    "rgba(255,255,255,.5)",
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,.35)",
                }}
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{
                        color:
                          "var(--muted)",
                      }}
                    >
                      Pattern Grid
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-black">
                        LV {level}
                      </span>

                      <span
                        className="border px-2 py-1 text-[10px] font-black tracking-widest"
                        style={{
                          borderColor:
                            "var(--border)",
                          background:
                            "var(--surface-soft)",
                        }}
                      >
                        {definition.size}×
                        {definition.size}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 border px-3 py-2 text-xs font-black"
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--surface-soft)",
                    }}
                  >
                    <span>
                      {tier.icon}
                    </span>
                    {tier.name}
                  </div>
                </div>

                {/* Board */}
                <div
                  className="mx-auto w-full max-w-[680px] border-[4px] p-2 sm:p-3"
                  style={{
                    borderColor:
                      "var(--foreground)",
                    background:
                      "rgba(15,23,42,.06)",
                    boxShadow:
                      "8px 8px 0 rgba(15,23,42,.12)",
                    imageRendering:
                      "pixelated",
                  }}
                >
                  <div
                    className={`grid ${boardGap}`}
                    style={{
                      gridTemplateColumns: `repeat(${definition.size}, minmax(0, 1fr))`,
                    }}
                  >
                    {boardCells.map(
                      (cell, index) =>
                        cell ? (
                          <div
                            key={cell.id}
                            className="relative aspect-square flex items-center justify-center"
                          >
                            <TileVisual
                              tile={cell}
                              size={
                                definition.size >=
                                9
                                  ? "small"
                                  : definition.size >=
                                      7
                                    ? "normal"
                                    : "large"
                              }
                              disabled
                            />

                            {/* Correct placement spark */}
                            <span className="pointer-events-none absolute -right-0.5 -top-0.5 text-[9px] font-black text-white drop-shadow">
                              ✓
                            </span>
                          </div>
                        ) : (
                          <button
                            key={`empty-${index}`}
                            type="button"
                            onClick={() =>
                              placeTile(index)
                            }
                            className="aspect-square"
                            aria-label={`Place selected tile at position ${index + 1}`}
                          >
                            <EmptyCell
                              highlighted={
                                Boolean(
                                  selectedTile,
                                )
                              }
                              size={
                                definition.size
                              }
                            />
                          </button>
                        ),
                    )}
                  </div>
                </div>

                {/* Feedback */}
                <div className="mt-4 flex min-h-9 items-center justify-center">
                  {feedback && (
                    <div
                      className="animate-pulse border-2 px-4 py-2 text-center font-mono text-xs font-black tracking-widest"
                      style={{
                        borderColor:
                          feedback.includes(
                            "WRONG",
                          )
                            ? "#ef4444"
                            : "#facc15",
                        background:
                          feedback.includes(
                            "WRONG",
                          )
                            ? "rgba(239,68,68,.08)"
                            : "rgba(250,204,21,.12)",
                      }}
                    >
                      {feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern / tray panel */}
              <aside
                className="rounded-[1.75rem] border p-4 sm:p-5"
                style={{
                  borderColor:
                    "var(--border)",
                  background:
                    "var(--surface-soft)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{
                        color:
                          "var(--muted)",
                      }}
                    >
                      Tile Tray
                    </div>

                    <h2 className="mt-1 text-lg font-black">
                      Match & Slide
                    </h2>
                  </div>

                  <div
                    className="flex h-9 w-9 items-center justify-center border-2 font-black"
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--card)",
                    }}
                  >
                    {trayTiles.length}
                  </div>
                </div>

                <p
                  className="mt-2 text-xs leading-5"
                  style={{
                    color: "var(--muted)",
                  }}
                >
                  Select a tile, then select
                  the empty grid position that
                  matches its hidden pattern.
                </p>

                {/* Mini pattern guide */}
                <div
                  className="mt-4 border-2 p-3"
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "var(--card)",
                  }}
                >
                  <div
                    className="text-[9px] font-black uppercase tracking-[0.18em]"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Pattern Code
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[
                      ["◆", "SOLID"],
                      ["///", "STRIPE"],
                      ["+", "CROSS"],
                      ["◇", "DIAMOND"],
                    ].map(
                      ([icon, label]) => (
                        <div
                          key={label}
                          className="text-center"
                        >
                          <div className="font-black">
                            {icon}
                          </div>

                          <div
                            className="mt-1 text-[7px] font-black"
                            style={{
                              color:
                                "var(--muted)",
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Tray */}
                <div
                  className={[
                    "mt-4 flex min-h-28 gap-3 overflow-x-auto",
                    "border-2 p-3",
                    trayPulse
                      ? "animate-pulse"
                      : "",
                  ].join(" ")}
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "rgba(15,23,42,.035)",
                  }}
                >
                  {trayTiles.length === 0 ? (
                    <div className="flex w-full items-center justify-center text-center">
                      <div>
                        <div className="text-3xl">
                          ✓
                        </div>

                        <div className="mt-1 text-xs font-black">
                          BOARD COMPLETE
                        </div>
                      </div>
                    </div>
                  ) : (
                    trayTiles.map(
                      (tile) => (
                        <button
                          key={tile.id}
                          type="button"
                          onClick={() =>
                            selectTile(
                              tile.id,
                            )
                          }
                          className="shrink-0"
                          aria-label={`Select ${tile.kind} tile`}
                        >
                          <TileVisual
                            tile={tile}
                            selected={
                              selectedTileId ===
                              tile.id
                            }
                          />
                        </button>
                      ),
                    )
                  )}
                </div>

                {/* Move reward */}
                <div
                  className="mt-4 border-2 p-3"
                  style={{
                    borderColor:
                      "rgba(11,180,170,.3)",
                    background:
                      "rgba(11,180,170,.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">
                      ✓ Correct Match
                    </span>

                    <span className="font-mono text-sm font-black">
                      +1 MOVE
                    </span>
                  </div>

                  <div
                    className="mt-1 text-[10px]"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Chain correct matches to
                    increase your combo bonus.
                  </div>
                </div>

                {/* Tier */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-3xl">
                    {tier.icon}
                  </div>

                  <div>
                    <div className="text-xs font-black">
                      {tier.name} TIER
                    </div>

                    <div
                      className="text-[10px]"
                      style={{
                        color:
                          "var(--muted)",
                      }}
                    >
                      {tier.description}
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Ready overlay */}
            {status === "ready" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/20 p-5 backdrop-blur-[2px]">
                <div
                  className="w-full max-w-md border-[3px] p-7 text-center"
                  style={{
                    borderColor:
                      "var(--foreground)",
                    background:
                      "rgba(255,255,255,.94)",
                    color:
                      "#0f172a",
                    boxShadow:
                      "10px 10px 0 rgba(15,23,42,.22)",
                  }}
                >
                  <div className="mx-auto grid w-fit grid-cols-3 gap-1">
                    {[
                      "ruby",
                      "azure",
                      "gold",
                      "emerald",
                      "violet",
                      "coral",
                      "cyan",
                      "lime",
                      "ruby",
                    ].map((kind, index) => (
                      <div
                        key={`${kind}-${index}`}
                        className="h-8 w-8 border-2"
                        style={{
                          background:
                            pixelStyle(
                              kind as TileKind,
                            ).background,
                          borderColor:
                            pixelStyle(
                              kind as TileKind,
                            ).dark,
                        }}
                      />
                    ))}
                  </div>

                  <h2 className="mt-5 text-3xl font-black">
                    COLOR TILE
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Match the tiles to their
                    hidden positions. Every
                    correct match gives you
                    <strong>
                      {" "}
                      +1 extra move
                    </strong>
                    .
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="border-2 border-slate-200 p-3">
                      <div className="text-lg font-black">
                        3×3
                      </div>
                      <div className="text-[9px] font-bold text-slate-500">
                        START
                      </div>
                    </div>

                    <div className="border-2 border-slate-200 p-3">
                      <div className="text-lg font-black">
                        10×10
                      </div>
                      <div className="text-[9px] font-bold text-slate-500">
                        FINAL
                      </div>
                    </div>

                    <div className="border-2 border-slate-200 p-3">
                      <div className="text-lg font-black">
                        +1
                      </div>
                      <div className="text-[9px] font-bold text-slate-500">
                        MATCH
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 w-full border-2 px-6 py-3 font-black text-white transition hover:-translate-y-1 active:translate-y-0"
                    style={{
                      borderColor:
                        "var(--primary-dark)",
                      background:
                        "var(--primary-dark)",
                      boxShadow:
                        "5px 5px 0 rgba(15,23,42,.22)",
                    }}
                  >
                    ▶ START PUZZLE
                  </button>
                </div>
              </div>
            )}

            {/* Pause overlay */}
            {status === "paused" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm">
                <div
                  className="w-full max-w-sm border-[3px] p-7 text-center"
                  style={{
                    borderColor:
                      "rgba(255,255,255,.25)",
                    background:
                      "rgba(15,23,42,.94)",
                    color: "#ffffff",
                    boxShadow:
                      "10px 10px 0 rgba(0,0,0,.25)",
                  }}
                >
                  <div className="text-5xl">
                    ⏸
                  </div>

                  <h2 className="mt-3 text-2xl font-black">
                    Puzzle Paused
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Your board is waiting.
                  </p>

                  <button
                    type="button"
                    onClick={togglePause}
                    className="mt-5 w-full border-2 px-6 py-3 font-black text-white"
                    style={{
                      borderColor:
                        "var(--primary)",
                      background:
                        "var(--primary)",
                    }}
                  >
                    ▶ RESUME
                  </button>
                </div>
              </div>
            )}

            {/* Level complete */}
            {status === "level-complete" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm">
                <div
                  className="relative w-full max-w-md overflow-hidden border-[3px] p-7 text-center"
                  style={{
                    borderColor:
                      "#facc15",
                    background:
                      "rgba(15,23,42,.96)",
                    color: "#ffffff",
                    boxShadow:
                      "10px 10px 0 rgba(0,0,0,.28)",
                  }}
                >
                  {/* Pixel celebration */}
                  <div className="pointer-events-none absolute inset-0 opacity-30">
                    {Array.from(
                      { length: 18 },
                      (_, index) => (
                        <span
                          key={index}
                          className="absolute h-2 w-2 animate-pulse"
                          style={{
                            left: `${(index * 37) % 100}%`,
                            top: `${(index * 53) % 100}%`,
                            background:
                              index % 2 === 0
                                ? "#facc15"
                                : "#22d3ee",
                          }}
                        />
                      ),
                    )}
                  </div>

                  <div className="relative">
                    <div className="text-5xl">
                      {level >=
                      LEVELS.length
                        ? "💎"
                        : "🏆"}
                    </div>

                    <h2 className="mt-3 text-3xl font-black">
                      {level >=
                      LEVELS.length
                        ? "ALL LEVELS CLEAR!"
                        : `LV ${level} CLEAR!`}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      Perfect matching earns
                      extra score and bonus
                      moves.
                    </p>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                      <div className="border border-white/10 bg-white/10 p-3">
                        <div className="text-[9px] uppercase tracking-widest text-slate-400">
                          Score
                        </div>

                        <div className="mt-1 font-mono text-lg font-black">
                          {score}
                        </div>
                      </div>

                      <div className="border border-white/10 bg-white/10 p-3">
                        <div className="text-[9px] uppercase tracking-widest text-slate-400">
                          Combo
                        </div>

                        <div className="mt-1 font-mono text-lg font-black">
                          x{combo}
                        </div>
                      </div>

                      <div className="border border-white/10 bg-white/10 p-3">
                        <div className="text-[9px] uppercase tracking-widest text-slate-400">
                          Tier
                        </div>

                        <div className="mt-1 font-mono text-lg font-black">
                          {tier.name}
                        </div>
                      </div>
                    </div>

                    {level <
                    LEVELS.length ? (
                      <button
                        type="button"
                        onClick={nextLevel}
                        className="mt-5 w-full border-2 px-6 py-3 font-black text-white transition hover:-translate-y-0.5"
                        style={{
                          borderColor:
                            "var(--primary)",
                          background:
                            "var(--primary)",
                          boxShadow:
                            "5px 5px 0 rgba(0,0,0,.25)",
                        }}
                      >
                        NEXT LEVEL →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startGame}
                        className="mt-5 w-full border-2 px-6 py-3 font-black text-white"
                        style={{
                          borderColor:
                            "#facc15",
                          background:
                            "#a16207",
                        }}
                      >
                        PLAY AGAIN
                      </button>
                    )}

                    <p className="mt-3 text-[10px] text-slate-500">
                      {level <
                      LEVELS.length
                        ? `Next: LV ${level + 1} • ${getLevel(level + 1).size}×${getLevel(level + 1).size}`
                        : "You reached the Diamond challenge."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Game over */}
            {status === "game-over" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm">
                <div
                  className="w-full max-w-md border-[3px] p-7 text-center"
                  style={{
                    borderColor:
                      "rgba(255,255,255,.2)",
                    background:
                      "rgba(15,23,42,.96)",
                    color: "#ffffff",
                    boxShadow:
                      "10px 10px 0 rgba(0,0,0,.28)",
                  }}
                >
                  <div className="text-5xl">
                    💥
                  </div>

                  <h2 className="mt-3 text-3xl font-black">
                    OUT OF MOVES
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    The puzzle defeated you this
                    time. Try again and chain
                    more correct matches.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        Score
                      </div>

                      <div className="mt-1 font-mono text-2xl font-black">
                        {score}
                      </div>
                    </div>

                    <div className="bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        Best
                      </div>

                      <div className="mt-1 font-mono text-2xl font-black">
                        {bestScore}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={startGame}
                      className="border-2 px-5 py-3 font-black text-white"
                      style={{
                        borderColor:
                          "var(--primary)",
                        background:
                          "var(--primary)",
                      }}
                    >
                      PLAY AGAIN
                    </button>

                    <Link
                      href="/leaderboard"
                      className="border-2 px-5 py-3 font-black"
                      style={{
                        borderColor:
                          "rgba(255,255,255,.2)",
                        background:
                          "rgba(255,255,255,.08)",
                      }}
                    >
                      🏆 LEADERBOARD
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div
            className="border-t p-5 sm:p-6"
            style={{
              borderColor: "var(--border)",
              background:
                "var(--surface-soft)",
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{
                    color: "var(--muted)",
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
                  Click / Tap
                  <span
                    className="mx-2"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    →
                  </span>
                  Select tile
                  <span
                    className="mx-2"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    •
                  </span>
                  Click empty slot
                  <span
                    className="mx-2"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    →
                  </span>
                  Match
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={
                    status === "ready" ||
                    status ===
                      "game-over" ||
                    status ===
                      "level-complete"
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
                  onClick={restartLevel}
                  className="rounded-xl px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                  style={{
                    background:
                      "var(--primary-dark)",
                  }}
                >
                  ↻ Restart Level
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

            {/* Progress */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{
                    color: "var(--muted)",
                  }}
                >
                  Game Progress
                </span>

                <span className="font-mono text-xs font-black">
                  {level}/{LEVELS.length}
                </span>
              </div>

              <div
                className="h-3 overflow-hidden border-2"
                style={{
                  borderColor:
                    "var(--border)",
                  background:
                    "var(--card)",
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${
                      (level /
                        LEVELS.length) *
                      100
                    }%`,
                    background:
                      "var(--primary)",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🧩",
              title: "Match the Pattern",
              text: "Select a tile from the tray and place it into the empty position that belongs to it.",
            },
            {
              icon: "➕",
              title: "Earn Bonus Moves",
              text: "Every correct match awards +1 move, score points, and builds your combo multiplier.",
            },
            {
              icon: "💎",
              title: "Climb the Tiers",
              text: "Progress from Normal through Bronze, Silver, Gold, and finally the Diamond challenge.",
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
                  color: "var(--muted)",
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
          GameHub • Color Tile • Match smart,
          chain matches, and reach Diamond.
        </p>
      </div>
    </main>
  );
}