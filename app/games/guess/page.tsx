"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { saveResult } from "@/lib/game";

export default function GuessPage() {
  const [target, setTarget] = useState(() =>
    Math.floor(Math.random() * 100) + 1,
  );
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState(
    "Guess a number between 1 and 100.",
  );
  const [gameOver, setGameOver] = useState(false);

  function resetGame() {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess("");
    setAttempts(0);
    setMessage("Guess a number between 1 and 100.");
    setGameOver(false);
  }

  function submitGuess() {
    if (gameOver) {
      return;
    }

    const value = Number(guess);

    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setMessage("Please enter a whole number from 1 to 100.");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (value === target) {
      const points =
        newAttempts === 1
          ? 200
          : newAttempts === 2
            ? 150
            : newAttempts === 3
              ? 100
              : 50;

      setMessage(`🎉 Correct! You earned ${points} points.`);
      saveResult("win", points);
      setGameOver(true);
      return;
    }

    if (value < target) {
      setMessage("📈 Too low! Try a higher number.");
    } else {
      setMessage("📉 Too high! Try a lower number.");
    }

    setGuess("");
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-xl px-5 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-[#0bb4aa]"
        >
          ← Back to games
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Number Guess
          </h1>

          <p className="mt-2 text-slate-500">
            Find the secret number using as few attempts as possible.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-6xl">🔢</div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Attempts: {attempts}
            </p>

            <p className="mt-4 font-semibold text-slate-800">{message}</p>

            {!gameOver && (
              <div className="mx-auto mt-6 flex max-w-sm gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      submitGuess();
                    }
                  }}
                  placeholder="1 - 100"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center outline-none focus:border-teal-400"
                />

                <button
                  onClick={submitGuess}
                  className="rounded-xl bg-[#0bb4aa] px-5 py-3 text-sm font-semibold text-white hover:bg-[#078f87]"
                >
                  Guess
                </button>
              </div>
            )}

            <button
              onClick={resetGame}
              className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-[#0bb4aa]"
            >
              New Game
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}