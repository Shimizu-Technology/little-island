/**
 * A two-seat family match: names, a running score and who starts.
 *
 * The tally stored on a round counts only *earlier* rounds. The current round's result is
 * derived live from its board, so undo after a win un-counts it, reloading never double-counts,
 * and "Play again" carries `settle(match, result)` into the next round.
 */
export type Seat = 0 | 1;
export type Match = {
  names: [string, string];
  wins: [number, number];
  draws: number;
  /** Swap who starts after every round. */
  alternate: boolean;
};
export type RoundResult = Seat | "draw" | null;
export const NAME_MAX = 16;
export const MATCH_MAX = 9999;
export const defaultNames: [string, string] = ["Player 1", "Player 2"];

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** Trim, collapse spaces, drop control characters and cap by visible characters (emoji count once). */
export function cleanName(raw: string, fallback: string): string {
  const tidy = [...raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim()].slice(0, NAME_MAX).join("");
  return tidy || fallback;
}
export const nameLength = (raw: string) => [...raw.trim()].length;

export function newMatch(names: readonly string[] = defaultNames, alternate = true): Match {
  return {
    names: [cleanName(names[0] ?? "", defaultNames[0]), cleanName(names[1] ?? "", defaultNames[1])],
    wins: [0, 0],
    draws: 0,
    alternate,
  };
}

/** The tally including a finished round's result. Unfinished rounds (null) leave it unchanged. */
export function settle(match: Match, result: RoundResult): Match {
  if (result === null) return match;
  if (result === "draw") return { ...match, draws: Math.min(MATCH_MAX, match.draws + 1) };
  const wins: [number, number] = [...match.wins];
  wins[result] = Math.min(MATCH_MAX, wins[result] + 1);
  return { ...match, wins };
}

export const nextStarter = (match: Match, starter: Seat): Seat => (match.alternate ? other(starter) : starter);

export const roundsPlayed = (match: Match) => match.wins[0] + match.wins[1] + match.draws;

const count = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MATCH_MAX;
const validName = (v: unknown) => typeof v === "string" && v.trim().length > 0 && nameLength(v) <= NAME_MAX;

export function validMatch(v: unknown): v is Match {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const m = v as Record<string, unknown>;
  return (
    Array.isArray(m.names) &&
    m.names.length === 2 &&
    m.names.every(validName) &&
    Array.isArray(m.wins) &&
    m.wins.length === 2 &&
    m.wins.every(count) &&
    count(m.draws) &&
    typeof m.alternate === "boolean"
  );
}
export const validSeat = (v: unknown): v is Seat => v === 0 || v === 1;

/** Remembered family names for quick setup (most recent first, unique, at most eight). */
export const PLAYERS_MAX = 8;
export function rememberNames(previous: readonly string[] | undefined, used: readonly string[]): string[] {
  const fresh = used.map((n) => cleanName(n, "")).filter((n) => n && !/^Player [1-8]$/.test(n));
  const merged: string[] = [];
  for (const name of [...fresh, ...(previous ?? [])])
    if (!merged.some((m) => m.toLowerCase() === name.toLowerCase())) merged.push(name);
  return merged.slice(0, PLAYERS_MAX);
}
export const validPlayers = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= PLAYERS_MAX && v.every(validName) && new Set(v.map((n: string) => n.toLowerCase())).size === v.length;
