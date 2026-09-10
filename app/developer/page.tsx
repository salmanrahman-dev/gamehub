import Link from "next/link";
import Navbar from "@/components/Navbar";
import CreditCard from "@/components/CreditCard";

const architecture = [
  {
    number: "01",
    title: "Next.js",
    description:
      "Application framework responsible for routing, rendering, project structure, and the development server.",
  },
  {
    number: "02",
    title: "React",
    description:
      "Provides the component model and client-side state required for interactive games.",
  },
  {
    number: "03",
    title: "TypeScript",
    description:
      "Provides static typing for safer components, game logic, and shared data structures.",
  },
  {
    number: "04",
    title: "Tailwind CSS",
    description:
      "Utility-first styling system used to build the responsive GameHub interface.",
  },
  {
    number: "05",
    title: "localStorage",
    description:
      "Browser persistence layer used by the MVP to store player statistics.",
  },
];

const structure = [
  ["app/page.tsx", "Homepage and game discovery."],
  ["app/games/tic-tac-toe/page.tsx", "Tic-Tac-Toe game."],
  ["app/games/rps/page.tsx", "Rock Paper Scissors game."],
  ["app/games/guess/page.tsx", "Number Guess game."],
  ["app/leaderboard/page.tsx", "Player statistics and leaderboard."],
  ["app/how-to-play/page.tsx", "Player-facing game documentation."],
  ["app/developer/page.tsx", "Developer documentation."],
  ["app/globals.css", "Global design system and theme."],
  ["components/Navbar.tsx", "Global navigation."],
  ["components/GameCard.tsx", "Reusable game discovery card."],
  ["components/ThemeToggle.tsx", "Theme switching component."],
  ["lib/game.ts", "Shared game logic and persistence."],
];

const principles = [
  "Keep game logic isolated and easy to understand.",
  "Reuse components instead of duplicating interface code.",
  "Keep shared utilities inside lib/.",
  "Use TypeScript to make data structures explicit.",
  "Design for responsive desktop and mobile experiences.",
  "Prefer simple architecture over unnecessary infrastructure.",
  "Keep the MVP easy to demonstrate and extend.",
];

const futureFeatures = [
  "User authentication",
  "PostgreSQL database",
  "Global online leaderboard",
  "Player profiles",
  "Multiplayer games",
  "WebSocket real-time communication",
  "Achievements and badges",
  "Tournaments",
  "Game history",
  "Performance analytics",
  "Progressive Web App support",
];

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main>
        {/* ================================================================
            Developer Hero
           ================================================================ */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(11,180,170,0.14),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(20,184,166,0.07),transparent_25%)]" />

          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
            >
              ← Back to GameHub
            </Link>

            <div className="mt-12 max-w-4xl">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                  DEV
                </span>

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Technical Documentation
                </span>
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                Build.
                <span className="text-[var(--primary)]"> Understand.</span>
                <br />
                Extend.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                Technical documentation for the GameHub MVP, including its
                architecture, project structure, game logic, persistence
                model, development workflow, and future expansion path.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              <TechBadge>Next.js 16</TechBadge>
              <TechBadge>React</TechBadge>
              <TechBadge>TypeScript</TechBadge>
              <TechBadge>Tailwind CSS</TechBadge>
              <TechBadge>localStorage</TechBadge>
            </div>
          </div>
        </section>

        {/* ================================================================
            Documentation Content
           ================================================================ */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  On this page
                </p>

                <nav className="mt-5 space-y-2 border-l border-[var(--border)] pl-4">
                  {[
                    "Overview",
                    "Technology",
                    "Architecture",
                    "Project Structure",
                    "Game Flow",
                    "Persistence",
                    "Theme System",
                    "Development",
                    "Adding a Game",
                    "Principles",
                    "Future Scope",
                  ].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                      className="block text-sm text-[var(--muted)] transition hover:text-[var(--primary)]"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 space-y-14">
              {/* Overview */}
              <DocSection id="overview" number="01" title="Project Overview">
                <p>
                  GameHub is a lightweight web-based mini-game platform
                  created as an educational application project. The MVP
                  focuses on three playable games, a shared scoring system,
                  browser persistence, responsive design, and clear
                  navigation.
                </p>

                <p>
                  The project deliberately avoids a backend and database in
                  the first version. This keeps the architecture small,
                  understandable, and suitable for demonstration while
                  leaving a clear path for future expansion.
                </p>
              </DocSection>

              {/* Technology */}
              <DocSection id="technology" number="02" title="Technology Stack">
                <div className="grid gap-3 sm:grid-cols-2">
                  {architecture.map((item) => (
                    <div
                      key={item.title}
                      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:border-teal-300 dark:hover:border-teal-700"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">
                          {item.number}
                        </span>

                        <span className="text-slate-300 transition group-hover:text-[var(--primary)] dark:text-slate-700">
                          ↗
                        </span>
                      </div>

                      <h3 className="mt-6 font-bold text-[var(--foreground)]">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Architecture */}
              <DocSection id="architecture" number="03" title="Application Architecture">
                <p>
                  GameHub follows a deliberately simple client-side
                  architecture. Each game owns its interactive state, while
                  shared game utilities handle common result and scoring
                  behavior.
                </p>

                <div className="relative mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-950 p-6 shadow-inner">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      game-flow
                    </span>
                  </div>

                  <pre className="overflow-x-auto font-mono text-sm leading-8 text-slate-300">
{`Player
  ▼
Game Page
  ▼
React State
  ▼
Game Logic
  ▼
Game Result
  ▼
saveResult()
  ▼
localStorage
  ▼
Leaderboard`}
                  </pre>
                </div>
              </DocSection>

              {/* Structure */}
              <DocSection
                id="project-structure"
                number="04"
                title="Project Structure"
              >
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  {structure.map(([file, description]) => (
                    <div
                      key={file}
                      className="grid gap-2 border-b border-[var(--border)] p-4 last:border-b-0 sm:grid-cols-[minmax(220px,0.7fr)_1fr]"
                    >
                      <code className="break-all text-sm font-semibold text-[var(--primary)]">
                        {file}
                      </code>

                      <span className="text-sm leading-6 text-[var(--muted)]">
                        {description}
                      </span>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Game Flow */}
              <DocSection id="game-flow" number="05" title="Game Flow">
                <p>
                  Every game follows the same high-level lifecycle, even
                  though the individual rules are different.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-4">
                  {[
                    ["01", "Start", "Player begins a new round."],
                    ["02", "Interact", "Player makes a move."],
                    ["03", "Resolve", "Game determines the result."],
                    ["04", "Score", "Statistics are updated."],
                  ].map(([number, title, description]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">
                        {number}
                      </span>

                      <h3 className="mt-5 font-bold text-[var(--foreground)]">
                        {title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Persistence */}
              <DocSection
                id="persistence"
                number="06"
                title="Data Persistence"
              >
                <p>
                  The MVP uses the browser's localStorage API instead of a
                  server-side database. This allows the leaderboard to
                  persist between page refreshes without requiring a backend.
                </p>

                <CodeWindow title="gamehub-stats">
{`{
  username: "Player",
  score: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0
}`}
                </CodeWindow>

                <p>
                  The shared <code>saveResult()</code> utility updates the
                  player's statistics after a completed game and writes the
                  updated object back to localStorage.
                </p>
              </DocSection>

              {/* Theme */}
              <DocSection id="theme-system" number="07" title="Theme System">
                <p>
                  GameHub provides light and dark themes through the shared
                  <code>ThemeToggle</code> component.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ThemeCard
                    title="Light Mode"
                    description="Bright surfaces, clean borders, and teal accents."
                    icon="☀️"
                  />

                  <ThemeCard
                    title="Dark Mode"
                    description="Deep surfaces, reduced glare, and high-contrast accents."
                    icon="🌙"
                  />
                </div>

                <p>
                  The selected preference is stored under{" "}
                  <code>gamehub-theme</code>. If the user has not selected a
                  preference, GameHub checks the operating system's preferred
                  color scheme.
                </p>
              </DocSection>

              {/* Development */}
              <DocSection id="development" number="08" title="Development Workflow">
                <p>Install project dependencies:</p>

                <CodeWindow title="terminal">
                  npm install
                </CodeWindow>

                <p>Start the development server:</p>

                <CodeWindow title="terminal">
                  npm run dev
                </CodeWindow>

                <p>
                  During development, Next.js provides fast refresh so
                  interface and component changes can be observed immediately
                  in the browser.
                </p>
              </DocSection>

              {/* Adding a Game */}
              <DocSection
                id="adding-a-game"
                number="09"
                title="Adding a New Game"
              >
                <div className="space-y-3">
                  {[
                    "Create a new route under app/games/.",
                    "Implement the game UI and state management.",
                    "Define the game's rules and result calculation.",
                    "Call saveResult() after a completed round.",
                    "Add the game to the homepage using GameCard.",
                    "Document the rules on the How to Play page.",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
                        {index + 1}
                      </span>

                      <p className="text-sm leading-7 text-[var(--muted)]">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Principles */}
              <DocSection
                id="principles"
                number="10"
                title="Development Principles"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {principles.map((principle) => (
                    <div
                      key={principle}
                      className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                    >
                      <span className="text-[var(--primary)]">✓</span>

                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {principle}
                      </p>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Future Scope */}
              <DocSection
                id="future-scope"
                number="11"
                title="Future Development"
              >
                <p>
                  The current MVP is intentionally small, but its structure
                  provides a foundation for a more complete gaming platform.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {futureFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-medium text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-teal-300 dark:hover:border-teal-700"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* Closing */}
              <section className="relative overflow-hidden rounded-[2rem] border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-slate-50 p-8 dark:border-teal-900 dark:from-teal-950/60 dark:via-slate-950 dark:to-slate-950 sm:p-10">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/10" />

                <div className="relative">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                    Architecture Philosophy
                  </span>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                    Start simple. Build cleanly. Leave room to grow.
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    GameHub demonstrates how a focused MVP can solve its
                    immediate requirements without unnecessary complexity,
                    while maintaining a structure that can evolve into a
                    larger application.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/how-to-play"
                      className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
                    >
                      Player Guide
                    </Link>

                    <Link
                      href="/"
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-teal-300 dark:hover:border-teal-700"
                    >
                      Back to GameHub
                    </Link>
                  </div>
                </div>
              </section>
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

function DocSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-start gap-4">
        <span className="font-mono text-xs font-bold text-[var(--primary)]">
          {number}
        </span>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {title}
          </h2>

          <div className="mt-2 h-0.5 w-8 rounded-full bg-[var(--primary)]" />
        </div>
      </div>

      <div className="space-y-5 text-sm leading-7 text-[var(--muted)]">
        {children}
      </div>
    </section>
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 font-mono text-xs font-medium text-[var(--muted)] shadow-sm">
      {children}
    </span>
  );
}

function CodeWindow({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

        <span className="ml-2 font-mono text-xs text-slate-500">
          {title}
        </span>
      </div>

      <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function ThemeCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
        {icon}
      </div>

      <h3 className="mt-5 font-bold text-[var(--foreground)]">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}