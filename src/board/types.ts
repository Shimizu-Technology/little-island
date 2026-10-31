import { RoundResult, Seat, validSeat } from "../games/match";
export const strengths = ["gentle", "growing", "challenge"] as const;
export type Strength = (typeof strengths)[number];
/** Canonical engine state. marks is game-specific public bookkeeping. */
export type Position = {
  seed: number;
  size: number;
  starter: Seat;
  turn: Seat;
  moves: number[];
  board: number[];
  marks: number[];
  scores: [number, number];
  outcome: RoundResult;
};
export type Engine = {
  create: (seed?: number, size?: number, starter?: Seat) => Position;
  move: (state: Position, move: number) => Position;
  legal: (state: Position) => number[];
  choose: (state: Position, strength: Strength) => number | null;
  validate: (value: unknown) => value is Position;
};
export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const integer = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
export function rng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}
export function shuffle<T>(values: readonly T[], seed: number): T[] {
  const a = [...values],
    random = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function blank(seed: number, size: number, starter: Seat, board: number[], marks: number[] = []): Position {
  return { seed: seed >>> 0, size, starter, turn: starter, board, marks, scores: [0, 0], moves: [], outcome: null };
}
export function tally(scores: readonly number[]): RoundResult {
  return scores[0] === scores[1] ? "draw" : scores[0] > scores[1] ? 0 : 1;
}
/** Replaying rejects forged outcomes, wrong turns, duplicate/illegal moves and unreachable boards. */
export function replayValidator(create: Engine["create"], move: Engine["move"], sizes: number[], maxMoves: number) {
  return (value: unknown): value is Position => {
    if (
      !object(value) ||
      Object.keys(value).sort().join() !== "board,marks,moves,outcome,scores,seed,size,starter,turn" ||
      !integer(value.seed, 0, 0xffffffff) ||
      !sizes.includes(value.size as number) ||
      !validSeat(value.starter) ||
      !Array.isArray(value.moves) ||
      value.moves.length > maxMoves ||
      !value.moves.every((m) => integer(m, 0, 1000))
    )
      return false;
    let state = create(value.seed, value.size as number, value.starter);
    for (const action of value.moves) {
      const next = move(state, action);
      if (next === state) return false;
      state = next;
    }
    return Object.keys(state).every((k) => JSON.stringify(state[k as keyof Position]) === JSON.stringify(value[k]));
  };
}
/** Fixed node budget bounds alpha-beta even on extra-turn games. */
export function minimax(
  state: Position,
  depth: number,
  legal: Engine["legal"],
  move: Engine["move"],
  evaluate: (s: Position, seat: Seat) => number,
  budget = 9000
): number | null {
  const seat = state.turn;
  let nodes = 0;
  function search(s: Position, remaining: number, alpha: number, beta: number): number {
    if (s.outcome !== null)
      return s.outcome === "draw" ? 0 : s.outcome === seat ? 100000 + remaining : -100000 - remaining;
    if (remaining <= 0 || ++nodes > budget) return evaluate(s, seat);
    const maximize = s.turn === seat;
    let best = maximize ? -Infinity : Infinity;
    for (const m of legal(s)) {
      const score = search(move(s, m), remaining - 1, alpha, beta);
      best = maximize ? Math.max(best, score) : Math.min(best, score);
      if (maximize) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (alpha >= beta || nodes > budget) break;
    }
    return Number.isFinite(best) ? best : evaluate(s, seat);
  }
  let best = -Infinity,
    selected: number | null = null;
  for (const m of legal(state)) {
    const score = search(move(state, m), depth - 1, -Infinity, Infinity);
    if (score > best) {
      best = score;
      selected = m;
    }
  }
  return selected;
}
