"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResult } from "@/lib/game";

type GameStatus = "ready" | "running" | "crashed";

type Vehicle = {
  id: number;
  lane: number;
  y: number;
  speed: number;
  color: string;
  type: "sedan" | "sport" | "truck";
};

const LANES = 3;
const ROAD_HEIGHT = 620;
const PLAYER_Y = 500;
const PLAYER_HEIGHT = 82;
const PLAYER_WIDTH = 50;

const INITIAL_SPEED = 4.5;
const MAX_SPEED = 10;

const TRAFFIC_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
];

const STORAGE_KEY = "gamehub-car-best";

function getLaneX(lane: number) {
  return `calc(${(lane + 0.5) * (100 / LANES)}% - ${PLAYER_WIDTH / 2}px)`;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export default function CarGamePage() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [playerLane, setPlayerLane] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [bestScore, setBestScore] = useState(0);
  const [flash, setFlash] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef(0);
  const vehicleIdRef = useRef(0);
  const resultSavedRef = useRef(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));

    if (Number.isFinite(stored) && stored > 0) {
      setBestScore(stored);
    }
  }, []);

  const finishGame = useCallback(() => {
    if (resultSavedRef.current) {
      return;
    }

    resultSavedRef.current = true;

    setStatus("crashed");
    setFlash(true);

    window.setTimeout(() => {
      setFlash(false);
    }, 350);

    setScore((currentScore) => {
      const finalScore = Math.floor(currentScore);

      if (finalScore > bestScore) {
        setBestScore(finalScore);
        localStorage.setItem(STORAGE_KEY, String(finalScore));
      }

      saveResult("loss", 0);

      return finalScore;
    });
  }, [bestScore]);

  const moveLeft = useCallback(() => {
    if (status !== "running") {
      return;
    }

    setPlayerLane((lane) => Math.max(0, lane - 1));
  }, [status]);

  const moveRight = useCallback(() => {
    if (status !== "running") {
      return;
    }

    setPlayerLane((lane) => Math.min(LANES - 1, lane + 1));
  }, [status]);

  const startGame = useCallback(() => {
    setStatus("running");
    setPlayerLane(1);
    setVehicles([]);
    setScore(0);
    setDistance(0);
    setSpeed(INITIAL_SPEED);
    setFlash(false);

    spawnTimerRef.current = 0;
    lastTimeRef.current = 0;
    resultSavedRef.current = false;
  }, []);

  const spawnVehicle = useCallback(() => {
    const lane = Math.floor(Math.random() * LANES);

    const type = randomItem<Vehicle["type"]>([
      "sedan",
      "sedan",
      "sport",
      "truck",
    ]);

    const vehicle: Vehicle = {
      id: vehicleIdRef.current++,
      lane,
      y: -100,
      speed: speed * (0.75 + Math.random() * 0.45),
      color: randomItem(TRAFFIC_COLORS),
      type,
    };

    setVehicles((current) => [...current, vehicle]);
  }, [speed]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
      ) {
        event.preventDefault();
        moveLeft();
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        moveRight();
      }

      if (
        (event.key === "Enter" || event.key === " ") &&
        (status === "ready" || status === "crashed")
      ) {
        event.preventDefault();
        startGame();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [moveLeft, moveRight, startGame, status]);

  useEffect(() => {
    if (status !== "running") {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      return;
    }

    const tick = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(time - lastTimeRef.current, 40);
      lastTimeRef.current = time;

      const frameScale = delta / 16.67;

      spawnTimerRef.current += delta;

      const spawnInterval = Math.max(
        420,
        1050 - score * 5,
      );

      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        spawnVehicle();
      }

      setVehicles((currentVehicles) => {
        const nextVehicles: Vehicle[] = [];
        let collision = false;

        for (const vehicle of currentVehicles) {
          const nextY =
            vehicle.y +
            vehicle.speed *
              frameScale;

          const playerVerticalCollision =
            nextY + 70 >= PLAYER_Y &&
            nextY <= PLAYER_Y + PLAYER_HEIGHT;

          const sameLane =
            vehicle.lane === playerLane;

          if (playerVerticalCollision && sameLane) {
            collision = true;
          }

          if (nextY < ROAD_HEIGHT + 120) {
            nextVehicles.push({
              ...vehicle,
              y: nextY,
            });
          }
        }

        if (collision) {
          finishGame();
          return nextVehicles;
        }

        return nextVehicles;
      });

      setDistance((current) =>
        current + 0.12 * frameScale * speed,
      );

      setScore((current) =>
        current + 0.08 * frameScale * speed,
      );

      setSpeed((current) =>
        Math.min(
          MAX_SPEED,
          current + 0.0015 * frameScale,
        ),
      );

      animationRef.current =
        requestAnimationFrame(tick);
    };

    animationRef.current =
      requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [
    finishGame,
    playerLane,
    score,
    spawnVehicle,
    speed,
    status,
  ]);

  const displayedScore = Math.floor(score);
  const displayedDistance = Math.floor(distance);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
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

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              🚗 Car Dash
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Dodge traffic, switch lanes, and survive as long as possible.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Score"
            value={displayedScore.toString()}
            icon="🏆"
          />

          <StatCard
            label="Distance"
            value={`${displayedDistance}m`}
            icon="📍"
          />

          <StatCard
            label="Speed"
            value={`${speed.toFixed(1)}x`}
            icon="⚡"
          />

          <StatCard
            label="Best"
            value={bestScore.toString()}
            icon="🥇"
          />
        </div>

        {/* Game shell */}
        <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_70px_var(--shadow-color)]">
          {/* Top game bar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status === "running"
                    ? "animate-pulse bg-emerald-500"
                    : status === "crashed"
                      ? "bg-red-500"
                      : "bg-amber-500"
                }`}
              />

              <span className="text-sm font-semibold">
                {status === "running"
                  ? "Driving"
                  : status === "crashed"
                    ? "Crashed"
                    : "Ready"}
              </span>
            </div>

            <span className="text-xs text-[var(--muted)]">
              ← → / A D to steer
            </span>
          </div>

          {/* Road */}
          <div className="relative mx-auto w-full max-w-2xl overflow-hidden bg-[#172033]">
            <div
              className="relative mx-auto overflow-hidden"
              style={{
                height: ROAD_HEIGHT,
              }}
            >
              {/* Sky / horizon */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-400/20 to-transparent dark:from-sky-500/10" />

              {/* Road */}
              <div className="absolute inset-y-0 left-[12%] right-[12%] bg-[#303744] shadow-[inset_20px_0_30px_rgba(0,0,0,0.2),inset_-20px_0_30px_rgba(0,0,0,0.2)]">
                {/* Road edges */}
                <div className="absolute inset-y-0 left-0 w-1 bg-white/80" />
                <div className="absolute inset-y-0 right-0 w-1 bg-white/80" />

                {/* Lane dividers */}
                <LaneDivider
                  lane={1}
                  speed={speed}
                />

                <LaneDivider
                  lane={2}
                  speed={speed}
                />
              </div>

              {/* Side scenery */}
              <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950" />
              <div className="absolute inset-y-0 right-0 w-[12%] bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950" />

              {/* Decorative roadside markers */}
              {Array.from({ length: 12 }).map(
                (_, index) => (
                  <RoadsideMarker
                    key={index}
                    index={index}
                    speed={speed}
                  />
                ),
              )}

              {/* Traffic */}
              {vehicles.map((vehicle) => (
                <TrafficCar
                  key={vehicle.id}
                  vehicle={vehicle}
                />
              ))}

              {/* Player */}
              <PlayerCar
                lane={playerLane}
                crashed={status === "crashed"}
              />

              {/* Ready overlay */}
              {status === "ready" && (
                <GameOverlay
                  icon="🏁"
                  title="Ready to Drive?"
                  description="Dodge the traffic and build the highest score."
                  buttonText="Start Game"
                  onAction={startGame}
                />
              )}

              {/* Crash overlay */}
              {status === "crashed" && (
                <GameOverlay
                  icon="💥"
                  title="Crash!"
                  description={`You traveled ${displayedDistance}m and scored ${displayedScore} points.`}
                  buttonText="Play Again"
                  onAction={startGame}
                />
              )}

              {/* Flash effect */}
              {flash && (
                <div className="pointer-events-none absolute inset-0 z-40 animate-pulse bg-red-500/30" />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
            <div className="mx-auto flex max-w-md items-center justify-center gap-4">
              <ControlButton
                label="Left"
                icon="←"
                onClick={moveLeft}
                disabled={status !== "running"}
              />

              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-[var(--muted)]">
                  STEER
                </span>

                <span className="mt-1 text-xs text-[var(--muted)]">
                  A / D
                </span>
              </div>

              <ControlButton
                label="Right"
                icon="→"
                onClick={moveRight}
                disabled={status !== "running"}
              />
            </div>
          </div>
        </section>

        {/* Tips */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <TipCard
            icon="👀"
            title="Watch ahead"
            text="Traffic can appear in any lane."
          />

          <TipCard
            icon="↔️"
            title="Switch early"
            text="Move before a car gets too close."
          />

          <TipCard
            icon="⚡"
            title="Stay sharp"
            text="The road gets faster as you survive."
          />
        </div>
      </div>
    </main>
  );
}

/* ==========================================================================
   Stat Card
   ========================================================================== */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>

        <span className="text-lg">{icon}</span>
      </div>

      <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

/* ==========================================================================
   Lane Divider
   ========================================================================== */

function LaneDivider({
  lane,
  speed,
}: {
  lane: number;
  speed: number;
}) {
  const left =
    lane === 1
      ? "33.333%"
      : "66.666%";

  return (
    <div
      className="absolute inset-y-0 w-1"
      style={{
        left,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0 45%, rgba(255,255,255,0.85) 45% 58%, transparent 58% 100%)",
          backgroundSize: `100% ${Math.max(
            72,
            110 - speed * 3,
          )}px`,
          animation: `roadMove ${Math.max(
            0.25,
            0.65 - speed * 0.035,
          )}s linear infinite`,
        }}
      />
    </div>
  );
}

/* ==========================================================================
   Roadside Marker
   ========================================================================== */

function RoadsideMarker({
  index,
  speed,
}: {
  index: number;
  speed: number;
}) {
  const side = index % 2 === 0 ? "left" : "right";

  return (
    <div
      className="absolute z-10"
      style={{
        top: `${(index * 58) % ROAD_HEIGHT}px`,
        [side]: "4%",
        animation: `roadsideMove ${Math.max(
          0.6,
          1.5 - speed * 0.08,
        )}s linear infinite`,
      }}
    >
      <div className="h-8 w-2 rounded-full bg-white/70" />
      <div className="mx-auto h-3 w-5 rounded-full bg-white/30 blur-sm" />
    </div>
  );
}

/* ==========================================================================
   Player Car
   ========================================================================== */

function PlayerCar({
  lane,
  crashed,
}: {
  lane: number;
  crashed: boolean;
}) {
  return (
    <div
      className={`absolute z-30 transition-[left] duration-150 ease-out ${
        crashed ? "animate-[carCrash_0.4s_ease-in-out]" : ""
      }`}
      style={{
        left: `calc(${12 + ((lane + 0.5) * 76) / LANES}% - 25px)`,
        top: PLAYER_Y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      }}
    >
      {/* Shadow */}
      <div className="absolute -bottom-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-full bg-black/40 blur-md" />

      {/* Car body */}
      <div className="absolute inset-x-1 top-1 h-[70px] rounded-[16px] bg-gradient-to-b from-[#20c9c0] via-[#0bb4aa] to-[#078f87] shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
        {/* Windshield */}
        <div className="absolute left-2 top-2 h-6 w-10 rounded-t-[10px] border border-white/20 bg-slate-900/70" />

        {/* Rear window */}
        <div className="absolute bottom-2 left-2 h-5 w-10 rounded-b-[8px] bg-slate-900/55" />

        {/* Center highlight */}
        <div className="absolute left-1/2 top-1 h-[60px] w-px -translate-x-1/2 bg-white/20" />

        {/* Lights */}
        <div className="absolute -left-1 top-3 h-4 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        <div className="absolute -right-1 top-3 h-4 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />

        {/* Tail lights */}
        <div className="absolute -left-1 bottom-3 h-3 w-2 rounded-full bg-red-500" />
        <div className="absolute -right-1 bottom-3 h-3 w-2 rounded-full bg-red-500" />
      </div>

      {/* Wheels */}
      <div className="absolute -left-1 top-4 h-7 w-2 rounded-full bg-slate-950" />
      <div className="absolute -right-1 top-4 h-7 w-2 rounded-full bg-slate-950" />
      <div className="absolute -left-1 bottom-4 h-7 w-2 rounded-full bg-slate-950" />
      <div className="absolute -right-1 bottom-4 h-7 w-2 rounded-full bg-slate-950" />
    </div>
  );
}

/* ==========================================================================
   Traffic Car
   ========================================================================== */

function TrafficCar({
  vehicle,
}: {
  vehicle: Vehicle;
}) {
  const dimensions =
    vehicle.type === "truck"
      ? {
          width: 54,
          height: 94,
        }
      : vehicle.type === "sport"
        ? {
            width: 48,
            height: 76,
          }
        : {
            width: 50,
            height: 82,
          };

  return (
    <div
      className="absolute z-20"
      style={{
        left: `calc(${12 + ((vehicle.lane + 0.5) * 76) / LANES}% - ${
          dimensions.width / 2
        }px)`,
        top: vehicle.y,
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <div
        className="absolute -bottom-2 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-black/35 blur-sm"
      />

      <div
        className="absolute inset-x-1 top-1 rounded-[14px] shadow-[0_8px_18px_rgba(0,0,0,0.3)]"
        style={{
          height: dimensions.height - 8,
          background: `linear-gradient(to bottom, ${vehicle.color}, color-mix(in srgb, ${vehicle.color} 75%, black))`,
        }}
      >
        {/* Windows */}
        <div className="absolute left-2 right-2 top-2 h-7 rounded-[9px] bg-slate-900/70" />

        {/* Center reflection */}
        <div className="absolute left-1/2 top-2 h-[55px] w-px -translate-x-1/2 bg-white/15" />

        {/* Lights */}
        <div className="absolute -left-1 top-3 h-3 w-2 rounded-full bg-red-500" />
        <div className="absolute -right-1 top-3 h-3 w-2 rounded-full bg-red-500" />

        <div className="absolute -left-1 bottom-3 h-3 w-2 rounded-full bg-amber-200" />
        <div className="absolute -right-1 bottom-3 h-3 w-2 rounded-full bg-amber-200" />
      </div>

      {/* Wheels */}
      <div className="absolute -left-1 top-5 h-6 w-2 rounded-full bg-slate-950" />
      <div className="absolute -right-1 top-5 h-6 w-2 rounded-full bg-slate-950" />
      <div className="absolute -left-1 bottom-5 h-6 w-2 rounded-full bg-slate-950" />
      <div className="absolute -right-1 bottom-5 h-6 w-2 rounded-full bg-slate-950" />
    </div>
  );
}

/* ==========================================================================
   Game Overlay
   ========================================================================== */

function GameOverlay({
  icon,
  title,
  description,
  buttonText,
  onAction,
}: {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-[3px]">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/85 p-7 text-center text-white shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
          {icon}
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-300">
          {description}
        </p>

        <button
          type="button"
          onClick={onAction}
          className="mt-6 w-full rounded-xl bg-[#0bb4aa] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-[#078f87] active:scale-[0.98]"
        >
          {buttonText} →
        </button>

        <p className="mt-4 text-xs text-slate-400">
          Press Enter or Space to start
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   Controls
   ========================================================================== */

function ControlButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Move ${label}`}
      className="flex h-14 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-2xl font-bold shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-16 sm:w-24"
    >
      {icon}
    </button>
  );
}

/* ==========================================================================
   Tip Card
   ========================================================================== */

function TipCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-lg">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}