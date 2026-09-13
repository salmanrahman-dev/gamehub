"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { saveResult } from "@/lib/game";

const WORDS = [
  "APPLE",
  "BRAVE",
  "CHAIR",
  "CLOUD",
  "DREAM",
  "EARTH",
  "FLAME",
  "GRAPE",
  "HOUSE",
  "LIGHT",
  "MUSIC",
  "OCEAN",
  "PLANT",
  "PIXEL",
  "SPACE",
  "STONE",
  "TIGER",
  "TRAIN",
  "WATER",
  "WORLD",
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type LetterState = "correct" | "present" | "absent" | "empty";

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const remaining = answer.split("");

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining[i] = "";
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") {
      continue;
    }

    const index = remaining.indexOf(guess[i]);

    if (index !== -1) {
      result[i] = "present";
      remaining[index] = "";
    }
  }

  return result;
}

export default function WordlePage() {
  const [answer, setAnswer] = useState(
    () => WORDS[Math.floor(Math.random() * WORDS.length)],
  );
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState(
    "Guess the hidden five-letter word.",
  );
  const [finished, setFinished] = useState(false);

  const resetGame = useCallback(() => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrent("");
    setMessage("Guess the hidden five-letter word.");
    setFinished(false);
  }, []);

  function submitGuess() {
    if (finished) {
      return;
    }

    if (current.length !== WORD_LENGTH) {
      setMessage("Your guess must contain 5 letters.");
      return;
    }

    if (!WORDS.includes(current)) {
      setMessage("Use a word from the available game dictionary.");
      return;
    }

    const nextGuesses = [...guesses, current];

    setGuesses(nextGuesses);
    setCurrent("");

    if (current === answer) {
      setFinished(true);
      setMessage("Excellent! You found the word.");

      const points = Math.max(
        50,
        200 - (nextGuesses.length - 1) * 25,
      );

      saveResult("win", points);
      return;
    }

    if (nextGuesses.length >= MAX_GUESSES) {
      setFinished(true);
      setMessage(`Game over. The word was ${answer}.`);
      saveResult("loss", 0);
      return;
    }

    setMessage("Keep going!");
  }

  function handleKey(key: string) {
    if (finished) {
      return;
    }

    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "BACKSPACE") {
      setCurrent((value) => value.slice(0, -1));
      return;
    }

    if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent((value) => value + key);
    }
  }

  const keyboard = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

  return (
    <main
      className="min-h-screen px-5 py-10"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: "var(--primary)" }}
          >
            ← GameHub
          </Link>

          <span
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            {guesses.length}/{MAX_GUESSES}
          </span>
        </div>

        <div className="mb-8 text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--primary)" }}
          >
            Mini Game
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            🟩 Wordle
          </h1>

          <p
            className="mt-3"
            style={{ color: "var(--muted)" }}
          >
            Find the hidden five-letter word.
          </p>
        </div>

        <div className="space-y-2">
          {Array.from({ length: MAX_GUESSES }).map((_, row) => {
            const guess = guesses[row] ?? "";
            const states =
              row < guesses.length
                ? evaluateGuess(guess, answer)
                : [];

            return (
              <div
                key={row}
                className="flex justify-center gap-2"
              >
                {Array.from({ length: WORD_LENGTH }).map(
                  (_, column) => {
                    const letter =
                      guess[column] ??
                      (row === guesses.length
                        ? current[column] ?? ""
                        : "");

                    const state =
                      states[column] ?? "empty";

                    return (
                      <div
                        key={column}
                        className="flex h-14 w-14 items-center justify-center rounded-xl border text-xl font-bold"
                        style={{
                          background:
                            state === "correct"
                              ? "var(--primary)"
                              : state === "present"
                                ? "#eab308"
                                : state === "absent"
                                  ? "#64748b"
                                  : "var(--card)",
                          borderColor:
                            state === "empty"
                              ? "var(--border)"
                              : "transparent",
                          color:
                            state === "empty"
                              ? "var(--foreground)"
                              : "white",
                        }}
                      >
                        {letter}
                      </div>
                    );
                  },
                )}
              </div>
            );
          })}
        </div>

        <p
          className="mt-5 min-h-6 text-center text-sm font-medium"
          style={{ color: "var(--muted)" }}
        >
          {message}
        </p>

        <div className="mx-auto mt-6 max-w-md space-y-2">
          <div className="flex justify-center gap-1.5">
            {keyboard.slice(0, 10).map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-11 flex-1 rounded-lg border text-xs font-bold"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-1.5">
            {keyboard.slice(10, 19).map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-11 flex-1 rounded-lg border text-xs font-bold"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => handleKey("ENTER")}
              className="h-11 rounded-lg px-4 text-xs font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              ENTER
            </button>

            {keyboard.slice(19).map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-11 flex-1 rounded-lg border text-xs font-bold"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                {key}
              </button>
            ))}

            <button
              onClick={() => handleKey("BACKSPACE")}
              className="h-11 rounded-lg px-3 text-xs font-bold"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              ←
            </button>
          </div>
        </div>

        {finished && (
          <div className="mt-7 text-center">
            <button
              onClick={resetGame}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              New Word
            </button>
          </div>
        )}
      </div>
    </main>
  );
}