"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { getRpsResult, saveResult, type GameResult } from "@/lib/game";

const choices = [
  { id: "rock", label: "Rock", emoji: "✊" },
  { id: "paper", label: "Paper", emoji: "✋" },
  { id: "scissors", label: "Scissors", emoji: "✌️" },
];

export default function RpsPage() {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  function play(choice: string) {
    const computer =
      choices[Math.floor(Math.random() * choices.length)].id;

    const gameResult = getRpsResult(choice, computer);

    setPlayerChoice(choice);
    setComputerChoice(computer);
    setResult(gameResult);

    saveResult(
      gameResult,
      gameResult === "win" ? 100 : gameResult === "draw" ? 25 : 0,
    );
  }

  function reset() {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  }

  const getLabel = (id: string | null) =>
    choices.find((choice) => choice.id === id)?.label ?? "";

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-[#0bb4aa]"
        >
          ← Back to games
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Rock Paper Scissors
          </h1>

          <p className="mt-2 text-slate-500">
            Make your move and challenge the computer.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => play(choice.id)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-teal-300 hover:bg-teal-50"
                >
                  <div className="text-4xl">{choice.emoji}</div>
                  <div className="mt-2 text-sm font-semibold">
                    {choice.label}
                  </div>
                </button>
              ))}
            </div>

            {result && (
              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">You chose</p>
                <p className="font-bold text-slate-900">
                  {getLabel(playerChoice)}
                </p>

                <p className="mt-4 text-sm text-slate-500">
                  Computer chose
                </p>
                <p className="font-bold text-slate-900">
                  {getLabel(computerChoice)}
                </p>

                <p className="mt-5 text-xl font-bold text-[#0bb4aa]">
                  {result === "win" && "🎉 You won! +100 points"}
                  {result === "loss" && "😔 Computer won"}
                  {result === "draw" && "🤝 Draw! +25 points"}
                </p>

                <button
                  onClick={reset}
                  className="mt-5 rounded-xl bg-[#0bb4aa] px-5 py-3 text-sm font-semibold text-white hover:bg-[#078f87]"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}