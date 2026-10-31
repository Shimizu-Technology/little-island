import { Seat } from "../../games/match";
import { blank, integer, Position, replayValidator, shuffle, Strength } from "../types";
export const urchins = (n: number) => (n === 5 ? 3 : n === 6 ? 5 : 8);
export function neighbors(n: number, cell: number): number[] {
  return Array.from({ length: n * n }, (_, i) => i).filter(
    (i) => i !== cell && Math.abs(Math.floor(i / n) - Math.floor(cell / n)) <= 1 && Math.abs((i % n) - (cell % n)) <= 1
  );
}
export function create(seed = 1, size = 5, _starter: Seat = 0): Position {
  const n = [5, 6, 7].includes(size) ? size : 5;
  return blank(seed, n, 0, Array(n * n).fill(0), Array(n * n).fill(0));
}
/** 0..N-1 opens a tile; N..2N-1 toggles a flag. First opening and its neighbors are safe. */
export function legal(s: Position): number[] {
  if (s.outcome !== null) return [];
  const n = s.size * s.size;
  return s.marks.flatMap((m, i) => (m === 1 ? [] : m === 2 ? [i + n] : s.moves.length < 400 ? [i, i + n] : [i]));
}
export function move(s: Position, action: number): Position {
  const count = s.size * s.size;
  if (!integer(action, 0, 2 * count - 1) || !legal(s).includes(action)) return s;
  const cell = action % count,
    marks = [...s.marks];
  let board = s.board;
  if (action >= count) {
    marks[cell] = marks[cell] === 2 ? 0 : 2;
    return { ...s, marks, moves: [...s.moves, action] };
  }
  if (!s.marks.includes(1)) {
    const excluded = [cell, ...neighbors(s.size, cell)];
    board = Array(count).fill(0);
    for (const i of shuffle(
      Array.from({ length: count }, (_, i) => i).filter((i) => !excluded.includes(i)),
      s.seed
    ).slice(0, urchins(s.size)))
      board[i] = -1;
    for (let i = 0; i < count; i++)
      if (board[i] !== -1) board[i] = neighbors(s.size, i).filter((j) => board[j] === -1).length;
  }
  marks[cell] = 1;
  const queue = board[cell] === 0 ? [cell] : [];
  while (queue.length)
    for (const i of neighbors(s.size, queue.pop()!))
      if (marks[i] === 0 && board[i] !== -1) {
        marks[i] = 1;
        if (board[i] === 0) queue.push(i);
      }
  const won = board.every((v, i) => v === -1 || marks[i] === 1),
    outcome = board[cell] === -1 ? 1 : won ? 0 : null;
  return {
    ...s,
    board,
    marks,
    moves: [...s.moves, action],
    scores: [marks.filter((m, i) => m === 1 && board[i] !== -1).length, 0],
    outcome,
  };
}
/** Logical hints use only visible numbers. null means the board needs a considered guess. */
export function deductions(s: Position): { safe: number[]; flags: number[] } {
  const clear = new Set<number>(),
    flags = new Set<number>();
  for (let i = 0; i < s.board.length; i++)
    if (s.marks[i] === 1 && s.board[i] >= 0) {
      const near = neighbors(s.size, i),
        unknown = near.filter((j) => s.marks[j] === 0),
        marked = near.filter((j) => s.marks[j] === 2).length;
      if (s.board[i] === marked) unknown.forEach((j) => clear.add(j));
      if (s.board[i] === marked + unknown.length) unknown.forEach((j) => flags.add(j));
    }
  return { safe: [...clear], flags: [...flags] };
}
export function choose(s: Position, _strength: Strength): number | null {
  if (s.outcome !== null) return null;
  if (!s.marks.includes(1)) {
    const center = Math.floor(s.size / 2) * s.size + Math.floor(s.size / 2);
    const openings = legal(s).filter((i) => i < s.board.length);
    return openings.includes(center) ? center : (openings[0] ?? null);
  }
  const d = deductions(s);
  return d.safe[0] ?? (d.flags.length && s.moves.length < 400 ? d.flags[0] + s.board.length : null);
}
export const validate = replayValidator(create, move, [5, 6, 7], 500);
