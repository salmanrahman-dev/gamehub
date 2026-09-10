"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getStats, resetStats, type PlayerStats } from "@/lib/game";

export default function LeaderboardPage() {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  function handleReset() {
    resetStats();
    setStats(getStats());
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-[#0bb4aa]"
        >
          ← Back home
        </Link>

        <div className="mt-8">
          <div className="text-center">
            <div className="text-5xl">🏆</div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              Leaderboard
            </h1>

            <p className="mt-2 text-slate-500">
              Your performance across all games.
            </p>
          </div>

          {stats && (
            <>
              <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
                  <span>Rank</span>
                  <span>Player</span>
                  <span className="text-right">Score</span>
                </div>

                <div className="grid grid-cols-3 items-center px-5 py-6">
                  <span className="text-xl font-bold">🥇</span>

                  <span className="font-semibold text-slate-900">
                    {stats.username}
                  </span>

                  <span className="text-right text-xl font-bold text-[#0bb4aa]">
                    {stats.score}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <Stat label="Games" value={stats.gamesPlayed} />
                <Stat label="Wins" value={stats.wins} />
                <Stat label="Losses" value={stats.losses} />
                <Stat label="Draws" value={stats.draws} />
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Reset Score
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}