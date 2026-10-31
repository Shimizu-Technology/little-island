import { WordState, wordRules, wordStatus, wrongLetters } from "../games/words";

export type WordRecords = {
  wins: number;
  losses: number;
  assistedWins: number;
  bestWrong: number | null;
  counted: string[];
};
export const emptyWordRecords = (): WordRecords => ({
  wins: 0,
  losses: 0,
  assistedWins: 0,
  bestWrong: null,
  counted: [],
});

/** Count a newly completed Challenge once; loading, restoring and viewing a result do not earn another result. */
export function recordWordRound(
  previous: WordState | undefined,
  next: WordState | undefined,
  records?: WordRecords
): WordRecords | undefined {
  if (!next || wordRules(next) !== "challenge" || wordStatus(next) === "playing" || records?.counted.includes(next.id))
    return records;
  if (!previous || previous.id !== next.id || wordStatus(previous) !== "playing") return records;
  const current = records ?? emptyWordRecords();
  const won = wordStatus(next) === "won",
    assisted = next.hints > 0,
    mistakes = wrongLetters(next).length;
  return {
    wins: current.wins + Number(won),
    losses: current.losses + Number(!won),
    assistedWins: current.assistedWins + Number(won && assisted),
    bestWrong: won && !assisted ? Math.min(current.bestWrong ?? 6, mistakes) : current.bestWrong,
    counted: [...current.counted.slice(-255), next.id],
  };
}

export function validWordRecords(value: unknown): value is WordRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const count = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 1_000_000;
  return (
    count(v.wins) &&
    count(v.losses) &&
    count(v.assistedWins) &&
    v.assistedWins <= v.wins &&
    (v.bestWrong === null || (count(v.bestWrong) && v.bestWrong <= 5 && v.wins > v.assistedWins)) &&
    Array.isArray(v.counted) &&
    v.counted.length <= 256 &&
    new Set(v.counted).size === v.counted.length &&
    v.counted.every((id) => typeof id === "string" && id.length > 0 && id.length <= 100)
  );
}
