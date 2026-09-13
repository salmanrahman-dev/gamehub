"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { saveResult } from "@/lib/game";

interface Card {
  id: number;
  value: string;
  matched: boolean;
}

const SYMBOLS = ["🎮", "🚀", "🐍", "🎯", "⭐", "🔥"];

function createDeck(): Card[] {
  const cards = [...SYMBOLS, ...SYMBOLS].map((value, index) => ({
    id: index,
    value,
    matched: false,
  }));

  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryPage() {
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const resetGame = useCallback(() => {
    setCards(createDeck());
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
  }, []);

  function handleCard(id: number) {
    if (locked || won || flipped.includes(id)) {
      return;
    }

    const card = cards.find((item) => item.id === id);

    if (!card || card.matched) {
      return;
    }

    const nextFlipped = [...flipped, id];

    setFlipped(nextFlipped);

    if (nextFlipped.length !== 2) {
      return;
    }

    setMoves((value) => value + 1);
    setLocked(true);

    const first = cards.find(
      (item) => item.id === nextFlipped[0],
    );
    const second = cards.find(
      (item) => item.id === nextFlipped[1],
    );

    if (first?.value === second?.value) {
      setTimeout(() => {
        setCards((current) =>
          current.map((item) =>
            nextFlipped.includes(item.id)
              ? { ...item, matched: true }
              : item,
          ),
        );

        setFlipped([]);
        setLocked(false);
      }, 450);
    } else {
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 750);
    }
  }

  useEffect(() => {
    if (
      cards.length > 0 &&
      cards.every((card) => card.matched)
    ) {
      setWon(true);

      const points = Math.max(50, 250 - moves * 10);
      saveResult("win", points);
    }
  }, [cards, moves]);

  return (
    <main
      className="min-h-screen px-5 py-10"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: "var(--primary)" }}
          >
            ← GameHub
          </Link>

          <div
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            Moves: {moves}
          </div>
        </div>

        <div className="mb-8 text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--primary)" }}
          >
            Mini Game
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            🧠 Memory Match
          </h1>

          <p
            className="mt-3"
            style={{ color: "var(--muted)" }}
          >
            Find every matching pair.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {cards.map((card) => {
            const visible =
              flipped.includes(card.id) || card.matched;

            return (
              <button
                key={card.id}
                onClick={() => handleCard(card.id)}
                disabled={locked || card.matched}
                className="
                  aspect-square
                  rounded-2xl
                  border
                  text-3xl
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-1
                "
                style={{
                  background: visible
                    ? "var(--primary-soft)"
                    : "var(--card)",
                  borderColor: card.matched
                    ? "var(--primary)"
                    : "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {visible ? card.value : "?"}
              </button>
            );
          })}
        </div>

        {won && (
          <div
            className="mt-7 rounded-3xl border p-6 text-center"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="text-3xl">🎉</div>

            <h2 className="mt-3 text-2xl font-bold">
              You matched them all!
            </h2>

            <p
              className="mt-2"
              style={{ color: "var(--muted)" }}
            >
              Completed in {moves} moves.
            </p>

            <button
              onClick={resetGame}
              className="mt-5 rounded-xl px-5 py-2.5 font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}