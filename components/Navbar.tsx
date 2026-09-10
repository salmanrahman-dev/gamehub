import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          🎮 <span className="text-[#0bb4aa]">Game</span>Hub
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-[#0bb4aa] dark:text-slate-300"
          >
            Home
          </Link>

          <Link
            href="/games/tic-tac-toe"
            className="text-sm font-medium text-slate-600 transition hover:text-[#0bb4aa] dark:text-slate-300"
          >
            Games
          </Link>

          <Link
            href="/leaderboard"
            className="text-sm font-medium text-slate-600 transition hover:text-[#0bb4aa] dark:text-slate-300"
          >
            Leaderboard
          </Link>

<Link
  href="/how-to-play"
  className="text-sm font-medium text-slate-600 transition hover:text-[#0bb4aa] dark:text-slate-300"
>
  Guide
</Link>

<Link
  href="/developer"
  className="hidden text-sm font-medium text-slate-600 transition hover:text-[#0bb4aa] sm:block dark:text-slate-300"
>
  Developer
</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}