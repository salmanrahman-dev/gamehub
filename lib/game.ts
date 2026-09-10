export type GameResult = "win" | "loss" | "draw";

export interface PlayerStats {
  username: string;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

const STORAGE_KEY = "gamehub-stats";

const DEFAULT_STATS: PlayerStats = {
  username: "Player",
  score: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
};

export function getStats(): PlayerStats {
  if (typeof window === "undefined") {
    return DEFAULT_STATS;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_STATS;
    }

    return {
      ...DEFAULT_STATS,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveResult(result: GameResult, points: number): PlayerStats {
  const stats = getStats();

  const updated: PlayerStats = {
    ...stats,
    score: stats.score + points,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + (result === "win" ? 1 : 0),
    losses: stats.losses + (result === "loss" ? 1 : 0),
    draws: stats.draws + (result === "draw" ? 1 : 0),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function resetStats(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRpsResult(
  player: string,
  computer: string,
): GameResult {
  if (player === computer) {
    return "draw";
  }

  const playerWins =
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper");

  return playerWins ? "win" : "loss";
}