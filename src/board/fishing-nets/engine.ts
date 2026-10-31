import { other, Seat } from "../../games/match";
import { blank, integer, Position, replayValidator, shuffle, Strength, tally } from "../types";
export const edgeCount = (n: number) => 2 * n * (n + 1);
export function boxEdges(n: number, box: number): number[] {
  const r = Math.floor(box / n),
    c = box % n,
    vertical = n * (n + 1);
  return [r * n + c, (r + 1) * n + c, vertical + r * (n + 1) + c, vertical + r * (n + 1) + c + 1];
}
export function create(seed = 1, size = 3, starter: Seat = 0): Position {
  const n = [3, 4, 5].includes(size) ? size : 3;
  return blank(seed, n, starter, Array(edgeCount(n)).fill(-1), Array(n * n).fill(-1));
}
export function legal(s: Position): number[] {
  return s.outcome !== null ? [] : s.board.flatMap((v, i) => (v === -1 ? [i] : []));
}
export function move(s: Position, edge: number): Position {
  if (s.outcome !== null || !integer(edge, 0, s.board.length - 1) || s.board[edge] !== -1) return s;
  const board = [...s.board],
    marks = [...s.marks],
    scores: [number, number] = [...s.scores];
  board[edge] = s.turn;
  let caught = 0;
  for (let b = 0; b < marks.length; b++)
    if (marks[b] === -1 && boxEdges(s.size, b).every((e) => board[e] !== -1)) {
      marks[b] = s.turn;
      scores[s.turn]++;
      caught++;
    }
  return {
    ...s,
    board,
    marks,
    scores,
    moves: [...s.moves, edge],
    turn: caught ? s.turn : other(s.turn),
    outcome: marks.every((m) => m !== -1) ? tally(scores) : null,
  };
}
const sides = (s: Position, b: number) => boxEdges(s.size, b).filter((e) => s.board[e] !== -1).length;
export function scoring(s: Position): number[] {
  return legal(s).filter((e) =>
    s.marks.some((v, b) => v === -1 && sides(s, b) === 3 && boxEdges(s.size, b).includes(e))
  );
}
export function safe(s: Position): number[] {
  return legal(s).filter(
    (e) => !s.marks.some((v, b) => v === -1 && sides(s, b) === 2 && boxEdges(s.size, b).includes(e))
  );
}
/** Count the complete forced chain offered by an edge, without looking past a fixed board. */
export function giveaway(s: Position, edge: number): number {
  const start = move(s, edge);
  let p = start,
    caught = 0;
  for (let i = 0; i < s.size * s.size; i++) {
    const next = scoring(p)[0];
    if (next === undefined) break;
    const q = move(p, next);
    caught += q.scores[p.turn] - p.scores[p.turn];
    p = q;
  }
  return caught;
}
export function choose(s: Position, strength: Strength): number | null {
  const all = shuffle(legal(s), s.seed + s.moves.length);
  if (!all.length) return null;
  if (strength === "gentle") return all[0];
  const captures = scoring(s),
    quiet = safe(s).filter((e) => !captures.includes(e));
  if (captures.length) {
    // Prefer the largest chain now; retain a safe exit when one exists.
    return strength === "challenge" ? [...captures].sort((a, b) => giveaway(s, b) - giveaway(s, a))[0] : captures[0];
  }
  if (quiet.length) return all.find((e) => quiet.includes(e))!;
  // Chain phase: open the shortest chain rather than handing over an entire lagoon.
  return strength === "challenge" ? [...all].sort((a, b) => giveaway(s, a) - giveaway(s, b))[0] : all[0];
}
export const validate = replayValidator(create, move, [3, 4, 5], 60);
export function edgeDots(n: number, edge: number): [number, number] {
  const h = n * (n + 1);
  if (edge < h) {
    const r = Math.floor(edge / n),
      c = edge % n;
    return [r * (n + 1) + c, r * (n + 1) + c + 1];
  }
  const at = edge - h;
  return [at, at + n + 1];
}
export function edgeFromDots(n: number, a: number, b: number): number | null {
  for (let e = 0; e < edgeCount(n); e++) {
    const [x, y] = edgeDots(n, e);
    if ((x === a && y === b) || (x === b && y === a)) return e;
  }
  return null;
}

export function hintReason(s: Position, edge: number): string {
  const boxes = s.marks.flatMap((v,b) => v === -1 && boxEdges(s.size,b).includes(edge) ? [b] : []);
  const label = (b: number) => `${String.fromCharCode(65+b%s.size)}${Math.floor(b/s.size)+1}`;
  const closes = boxes.filter(b => sides(s,b) === 3);
  if (closes.length) return `Close ${closes.map(label).join(" and ")} with its fourth side. You keep the turn.`;
  const thirds = boxes.filter(b => sides(s,b) === 2);
  if (thirds.length) return `This adds a third side to ${thirds.map(label).join(" and ")}. The next player can close it. This move offers a chain of ${giveaway(s,edge)} box${giveaway(s,edge) === 1 ? "" : "es"}; look for a shorter chain if you can.`;
  return "This edge leaves every touching box with fewer than three sides. It gives away no box on the next move.";
}