export type GameId = "tic-tac-toe" | "word-rescue" | "memory" | "checkers" | "maze" | "numbers";
export type Difficulty = "easy" | "medium" | "hard";
export type Mode = "solo" | "together";
export type CheckersRules = "friendly" | "classic";
export type WordRules = "challenge" | "practice";
export type Options = {
  difficulty: Difficulty;
  mode: Mode;
  computerFirst: boolean;
  checkersRules?: CheckersRules;
  wordRules?: WordRules;
};
export const defaultOptions: Options = { difficulty: "easy", mode: "solo", computerFirst: false };
export type Base = { game: GameId; id: string; options: Options };
export function base(game: GameId, options: Options): Base {
  return { game, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, options: { ...options } };
}
export function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: readonly T[], rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
