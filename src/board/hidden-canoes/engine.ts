import { other, Seat } from "../../games/match";
import { blank, integer, Position, replayValidator, shuffle, Strength } from "../types";
export const fleet = [3, 2, 2];
export const coordinate = (i: number) => `${"ABCDEF"[i % 6]}${Math.floor(i / 6) + 1}`;
export function create(seed = 1, _size = 6, starter: Seat = 0): Position {
  const board = Array(72).fill(0);
  for (const seat of [0, 1])
    for (const [id, length] of fleet.entries()) {
      const options: number[][] = [];
      for (let i = 0; i < 36; i++)
        for (const d of [1, 6]) {
          const cells = Array.from({ length }, (_, j) => i + j * d);
          if (
            cells.every((p) => p < 36 && (d !== 1 || Math.floor(p / 6) === Math.floor(i / 6)) && !board[seat * 36 + p])
          )
            options.push(cells);
        }
      for (const p of shuffle(options, seed + seat * 177 + id * 37)[0]) board[seat * 36 + p] = id + 1;
    }
  return blank(seed, 6, starter, board, Array(72).fill(0));
}
/** marks[seat*36+cell] is that seat's search of the other lagoon; boards stay private. */
export function legal(s: Position): number[] {
  return s.outcome !== null ? [] : Array.from({ length: 36 }, (_, i) => i).filter((i) => !s.marks[s.turn * 36 + i]);
}
export function move(s: Position, cell: number): Position {
  if (!integer(cell, 0, 35) || !legal(s).includes(cell)) return s;
  const marks = [...s.marks],
    scores: [number, number] = [...s.scores],
    found = s.board[other(s.turn) * 36 + cell] > 0;
  marks[s.turn * 36 + cell] = found ? 2 : 1;
  if (found) scores[s.turn]++;
  return {
    ...s,
    marks,
    scores,
    moves: [...s.moves, cell],
    turn: other(s.turn),
    outcome: scores[s.turn] === 7 ? s.turn : null,
  };
}
/** Decisions use only the searching player's marks, never private canoe positions. */
export function choose(s: Position, strength: Strength): number | null {
  const all = shuffle(legal(s), s.seed + s.moves.length);
  if (strength === "gentle") return all[0] ?? null;
  const seen = s.marks.slice(s.turn * 36, (s.turn + 1) * 36),
    targets = new Map<number, number>();
  for (let i = 0; i < 36; i++)
    if (seen[i] === 2) {
      for (const d of [-6, -1, 1, 6]) {
        const next = i + d;
        if (!all.includes(next) || (Math.abs(d) === 1 && Math.floor(i / 6) !== Math.floor(next / 6))) continue;
        const behind = i - d,
          aligned =
            behind >= 0 &&
            behind < 36 &&
            seen[behind] === 2 &&
            (Math.abs(d) === 6 || Math.floor(behind / 6) === Math.floor(i / 6));
        targets.set(next, (targets.get(next) ?? 0) + (aligned && strength === "challenge" ? 4 : 1));
      }
    }
  const target = [...targets].sort((a, b) => b[1] - a[1])[0]?.[0];
  return (
    target ??
    (strength === "challenge" ? all.find((i) => (Math.floor(i / 6) + (i % 6)) % 2 === 0) : undefined) ??
    all[0] ??
    null
  );
}
export const validate = replayValidator(create, move, [6], 71);
