import Link from "next/link";
import GameCard from "@/components/GameCard";
import Navbar from "@/components/Navbar";
import CreditCard from "@/components/CreditCard";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-700">
              🎮 Welcome to GameHub
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Play. Compete.
              <span className="block text-[#0bb4aa]">Improve.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              A mini-game platform where you can play, earn points,
              and compete for the top position on the leaderboard.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="#games"
                className="rounded-xl bg-[#0bb4aa] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#078f87]"
              >
                Explore Games
              </Link>

              <Link
                href="/leaderboard"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-[#0bb4aa]"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section id="games" className="mx-auto max-w-6xl px-5 pb-20">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0bb4aa]">
              Choose your challenge
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Featured Games
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <GameCard
              emoji="❌⭕"
              title="Tic-Tac-Toe"
              description="Challenge the computer in the classic three-in-a-row game."
              href="/games/tic-tac-toe"
            />

            <GameCard
              emoji="✊"
              title="Rock Paper Scissors"
              description="Choose your move and see if you can beat the computer."
              href="/games/rps"
            />

            <GameCard
              emoji="🔢"
              title="Number Guess"
              description="Guess the secret number using as few attempts as possible."
              href="/games/guess"
            />
            <GameCard
  emoji="🐍"
  title="Snake"
  description="Grow your snake, collect food, and survive as long as possible."
  href="/games/snake"
/>

<GameCard
  emoji="🚗"
  title="Car Dash"
  description="Switch lanes, dodge traffic, and see how long you can stay on the road."
  href="/games/car"
/>

<GameCard
  emoji="🟩"
  title="Wordle"
  description="Find the hidden five-letter word before your guesses run out."
  href="/games/wordle"
/>

<GameCard
  emoji="🧠"
  title="Memory Match"
  description="Flip the cards, remember their positions, and match every pair."
  href="/games/memory"
/>

<GameCard
  emoji="⚡"
  title="Quick Quiz"
  description="Answer fast, test your knowledge, and build your highest score."
  href="/games/quiz"
/>

<GameCard
  emoji="🧱"
  title="Block Breaker"
  description="Break the blocks, control the paddle, and chase a high score."
  href="/games/block-breaker"
/>

<GameCard
  emoji="🦖"
  title="Dino Runner"
  description="Run, jump, dodge obstacles, and survive the longest."
  href="/games/dino-runner"
/>

<GameCard
  emoji="🐦"
  title="Sky Hopper"
  description="Navigate through obstacles and keep your character flying."
  href="/games/sky-hopper"
/>

<GameCard
  emoji="👾"
  title="Space Invaders"
  description="Defend your ship and destroy the incoming alien fleet."
  href="/games/space-invaders"
/>

<GameCard
  emoji="🟩🟨🟧🟥🟪🟦"
  title="Tetris"
  description="Stack falling blocks, clear lines, and chase a higher score."
  href="/games/tetris"
/>

<GameCard
  emoji="🟡"
  title="Maze Chase"
  description="Collect every dot, avoid the chaser, and escape the maze."
  href="/games/maze-chase"
/>

<GameCard
  emoji="🎨"
  title="Color Tile"
  description="Test your reaction speed by finding the correct color."
  href="/games/color-tile"
/>

          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 text-center sm:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-slate-900">3</div>
              <div className="mt-1 text-sm text-slate-500">Mini Games</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">∞</div>
              <div className="mt-1 text-sm text-slate-500">Replayability</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900">🏆</div>
              <div className="mt-1 text-sm text-slate-500">Leaderboard</div>
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