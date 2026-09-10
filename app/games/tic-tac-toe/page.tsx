"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { saveResult } from "@/lib/game";

type Cell = "X" | "O" | null;

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board: Cell[]): Cell {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [message, setMessage] = useState("Your turn");
  const [gameOver, setGameOver] = useState(false);

  function resetGame() {
    setBoard(Array(9).fill(null));
    setMessage("Your turn");
    setGameOver(false);
  }

  function computerMove(currentBoard: Cell[]) {
    const available = currentBoard
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);

    if (available.length === 0) {
      return currentBoard;
    }

    const randomIndex =
      available[Math.floor(Math.random() * available.length)];

    const nextBoard = [...currentBoard];
    nextBoard[randomIndex] = "O";

    return nextBoard;
  }

  function handleMove(index: number) {
    if (board[index] || gameOver) {
      return;
    }

    const playerBoard = [...board];
    playerBoard[index] = "X";

    const playerWinner = getWinner(playerBoard);

    if (playerWinner === "X") {
      setBoard(playerBoard);
      setMessage("🎉 You won! +100 points");
      saveResult("win", 100);
      setGameOver(true);
      return;
    }

    if (playerBoard.every(Boolean)) {
      setBoard(playerBoard);
      setMessage("🤝 Draw! +25 points");
      saveResult("draw", 25);
      setGameOver(true);
      return;
    }

    const computerBoard = computerMove(playerBoard);
    const computerWinner = getWinner(computerBoard);

    setBoard(computerBoard);

    if (computerWinner === "O") {
      setMessage("Computer won. Try again!");
      saveResult("loss", 0);
      setGameOver(true);
      return;
    }

    if (computerBoard.every(Boolean)) {
      setMessage("🤝 Draw! +25 points");
      saveResult("draw", 25);
      setGameOver(true);
      return;
    }

    setMessage("Your turn");
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
            Tic-Tac-Toe
          </h1>

          <p className="mt-2 text-slate-500">
            You are X. The computer is O.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleMove(index)}
                  className="aspect-square rounded-2xl border border-slate-200 bg-slate-50 text-4xl font-bold transition hover:border-teal-300 hover:bg-teal-50"
                >
                  {cell}
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="font-semibold text-slate-800">{message}</p>

              <button
                onClick={resetGame}
                className="mt-5 rounded-xl bg-[#0bb4aa] px-5 py-3 text-sm font-semibold text-white hover:bg-[#078f87]"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}