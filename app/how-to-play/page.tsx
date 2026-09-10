import Link from "next/link";
import Navbar from "@/components/Navbar";
import CreditCard from "@/components/CreditCard";

const games = [
  {
    number: "01",
    emoji: "❌⭕",
    title: "Tic-Tac-Toe",
    shortDescription:
      "Outsmart the computer and create a line of three.",
    href: "/games/tic-tac-toe",
    accent: "teal",
    objective:
      "Be the first player to place three of your marks in a horizontal, vertical, or diagonal line.",
    steps: [
      "You play as X and the computer plays as O.",
      "Select any empty square on the 3×3 board.",
      "The computer automatically makes its move after yours.",
      "Build a line of three X marks while blocking the computer.",
      "The first player to complete a line wins.",
      "If every square is filled without a winner, the game ends in a draw.",
    ],
    scoring: [
      ["Win", "+100", "You defeat the computer."],
      ["Draw", "+25", "The board fills without a winner."],
      ["Loss", "0", "The computer completes a winning line."],
    ],
    tips: [
      "Control the center whenever possible.",
      "Look for opportunities to create two winning paths.",
      "Block the computer when it has two marks in a row.",
      "Use corners strategically when the center is unavailable.",
    ],
  },
  {
    number: "02",
    emoji: "✊",
    title: "Rock Paper Scissors",
    shortDescription:
      "Pick your move and see if you can beat the computer.",
    href: "/games/rps",
    accent: "purple",
    objective:
      "Choose Rock, Paper, or Scissors and use the classic rules to defeat the computer.",
    steps: [
      "Choose Rock, Paper, or Scissors.",
      "The computer randomly selects its move.",
      "Rock defeats Scissors.",
      "Scissors defeats Paper.",
      "Paper defeats Rock.",
      "If both choices are identical, the round is a draw.",
    ],
    scoring: [
      ["Win", "+100", "Your move defeats the computer."],
      ["Draw", "+25", "Both players choose the same move."],
      ["Loss", "0", "The computer's move defeats yours."],
    ],
    tips: [
      "The computer chooses randomly, so there is no guaranteed winning move.",
      "Play multiple rounds to build your score.",
      "Pay attention to the result rather than relying on one round.",
      "The goal is consistent performance over repeated games.",
    ],
  },
  {
    number: "03",
    emoji: "🔢",
    title: "Number Guess",
    shortDescription:
      "Find the hidden number using as few attempts as possible.",
    href: "/games/guess",
    accent: "orange",
    objective:
      "Discover a randomly generated number between 1 and 100 while minimizing the number of guesses.",
    steps: [
      "GameHub generates a secret number from 1 to 100.",
      "Enter a whole number within that range.",
      "Submit your guess.",
      "GameHub tells you whether your guess is too high or too low.",
      "Use the feedback to narrow the possible range.",
      "Continue until you discover the secret number.",
    ],
    scoring: [
      ["1 attempt", "+200", "Perfect first guess."],
      ["2 attempts", "+150", "Excellent deduction."],
      ["3 attempts", "+100", "Strong performance."],
      ["4+ attempts", "+50", "Successful completion."],
    ],
    tips: [
      "Start near the middle of the possible range.",
      "Use every high/low clue to eliminate possibilities.",
      "Think like a binary search algorithm.",
      "Fewer attempts always means a better score.",
    ],
  },
];

const accentStyles = {
  teal: {
    badge:
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-800",
    icon:
      "bg-teal-50 ring-teal-200 dark:bg-teal-950 dark:ring-teal-800",
    number: "text-teal-600 dark:text-teal-400",
    button:
      "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400",
  },
  purple: {
    badge:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800",
    icon:
      "bg-violet-50 ring-violet-200 dark:bg-violet-950 dark:ring-violet-800",
    number: "text-violet-600 dark:text-violet-400",
    button:
      "bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400",
  },
  orange: {
    badge:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800",
    icon:
      "bg-orange-50 ring-orange-200 dark:bg-orange-950 dark:ring-orange-800",
    number: "text-orange-600 dark:text-orange-400",
    button:
      "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400",
  },
} as const;

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main>
        {/* ================================================================
            Hero
           ================================================================ */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(11,180,170,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.08),transparent_30%)]" />

          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
            >
              ← Back to GameHub
            </Link>

            <div className="mt-12 max-w-4xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[var(--primary)]" />

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Player Guide
                </span>
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                Learn the games.
                <span className="block text-[var(--primary)]">
                  Master the score.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                A complete guide to every GameHub game. Learn the rules,
                understand the scoring system, and discover strategies that
                can help you improve.
              </p>
            </div>

            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
              <QuickStat value="03" label="Games" />
              <QuickStat value="∞" label="Replayability" />
              <QuickStat value="🏆" label="Score System" />
            </div>
          </div>
        </section>

        {/* ================================================================
            Game Guide
           ================================================================ */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
              Game Library
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Choose your challenge
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Each game has its own rules, scoring system, and strategy.
              Explore the guide before you play.
            </p>
          </div>

          <div className="space-y-10">
            {games.map((game) => {
              const style = accentStyles[game.accent as keyof typeof accentStyles];

              return (
                <article
                  key={game.title}
                  className="group overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.10)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.3)]"
                >
                  {/* Game Header */}
                  <div className="relative overflow-hidden border-b border-[var(--border)] p-6 sm:p-8">
                    <div className="absolute right-0 top-0 text-[10rem] font-black leading-none text-slate-100/70 dark:text-slate-800/30">
                      {game.number}
                    </div>

                    <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-5">
                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.icon}`}
                        >
                          <span className="text-3xl">{game.emoji}</span>
                        </div>

                        <div>
                          <div className={`text-xs font-bold uppercase tracking-[0.18em] ${style.number}`}>
                            Game {game.number}
                          </div>

                          <h3 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                            {game.title}
                          </h3>

                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {game.shortDescription}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={game.href}
                        className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${style.button}`}
                      >
                        Play {game.title} →
                      </Link>
                    </div>
                  </div>

                  {/* Game Content */}
                  <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="p-6 sm:p-8 lg:border-r lg:border-[var(--border)]">
                      <div className="mb-7">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${style.badge}`}>
                          Objective
                        </span>

                        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                          {game.objective}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-[var(--foreground)]">
                          How to play
                        </h4>

                        <div className="mt-5 space-y-4">
                          {game.steps.map((step, index) => (
                            <div key={step} className="flex gap-4">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
                                {index + 1}
                              </span>

                              <p className="text-sm leading-7 text-[var(--muted)]">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-6 sm:p-8 dark:bg-slate-950/40">
                      <h4 className="text-lg font-bold text-[var(--foreground)]">
                        Scoring
                      </h4>

                      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                        {game.scoring.map(([label, points, description]) => (
                          <div
                            key={label}
                            className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border)] p-4 last:border-b-0"
                          >
                            <div>
                              <div className="text-sm font-semibold text-[var(--foreground)]">
                                {label}
                              </div>

                              <div className="mt-1 text-xs leading-5 text-[var(--muted)]">
                                {description}
                              </div>
                            </div>

                            <span className={`text-sm font-bold ${style.number}`}>
                              {points}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <h4 className="text-lg font-bold text-[var(--foreground)]">
                          Pro tips
                        </h4>

                        <div className="mt-4 space-y-3">
                          {game.tips.map((tip) => (
                            <div
                              key={tip}
                              className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
                            >
                              <span className="mt-0.5 text-[var(--primary)]">
                                ✓
                              </span>

                              <p className="text-xs leading-5 text-[var(--muted)]">
                                {tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ==============================================================
              Score System
             ============================================================== */}
          <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-7 dark:border-teal-900 dark:from-teal-950/70 dark:to-slate-950 sm:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/10" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                  🏆 Progress
                </span>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                  Your score follows your performance.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                  Completed games update your score and statistics
                  automatically. GameHub stores this information locally in
                  your browser so you can continue playing without creating
                  an account.
                </p>
              </div>

              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              >
                View Leaderboard →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-4 px-5 py-8 text-center text-sm text-slate-400">
       <CreditCard />
        <span>© 2026 GameHub · Play. Compete. Improve.</span>
      </footer>
    </div>
  );
}

function QuickStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 px-5 py-4 backdrop-blur">
      <div className="text-2xl font-bold text-[var(--foreground)]">
        {value}
      </div>

      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}