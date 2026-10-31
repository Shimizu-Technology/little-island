import { other, Seat } from "../../games/match";
import { blank, integer, minimax, Position, replayValidator, Strength } from "../types";
export const lines: number[][] = [];
for (let r = 0; r < 6; r++)
  for (let c = 0; c < 7; c++)
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      if (r + 3 * dr < 6 && c + 3 * dc >= 0 && c + 3 * dc < 7)
        lines.push(Array.from({ length: 4 }, (_, n) => (r + n * dr) * 7 + c + n * dc));
    }
export function create(seed = 1, _size = 7, starter: Seat = 0): Position {
  return blank(seed, 7, starter, Array(42).fill(-1));
}
export function legal(s: Position): number[] {
  return s.outcome !== null ? [] : [3, 2, 4, 1, 5, 0, 6].filter((c) => s.board[c] === -1);
}
export function move(s: Position, column: number): Position {
  if (!integer(column, 0, 6) || !legal(s).includes(column)) return s;
  const board = [...s.board];
  let i = 35 + column;
  while (board[i] !== -1) i -= 7;
  board[i] = s.turn;
  const outcome = lines.some((l) => l.every((p) => board[p] === s.turn))
    ? s.turn
    : board.every((p) => p !== -1)
      ? "draw"
      : null;
  return { ...s, board, moves: [...s.moves, column], turn: other(s.turn), outcome };
}
function evaluate(s: Position, seat: Seat): number {
  return lines.reduce((score, line) => {
    const own = line.filter((i) => s.board[i] === seat).length,
      rival = line.filter((i) => s.board[i] === other(seat)).length;
    return score + (rival ? 0 : [0, 1, 8, 60, 10000][own]) - (own ? 0 : [0, 1, 8, 65, 10000][rival]);
  }, 0);
}
export function choose(s: Position, strength: Strength): number | null {
  return minimax(s, strength === "gentle" ? 1 : strength === "growing" ? 3 : 5, legal, move, evaluate);
}
export const validate = replayValidator(create, move, [7], 42);

export function hintReason(s: Position, column: number): string {
  if (!legal(s).includes(column)) return "Choose an open column.";
  if (move(s, column).outcome === s.turn) return `Column ${column+1} completes your four in a line!`;
  const rival = { ...s, turn: other(s.turn) };
  if (move(rival, column).outcome === rival.turn) return `Block column ${column+1}: the other shape could complete four there next turn.`;
  const next = move(s, column), threats = legal({ ...next, turn: s.turn }).filter(c => move({ ...next, turn: s.turn }, c).outcome === s.turn);
  if (threats.length > 1) return `Column ${column+1} builds two ways to finish four. The other shape can block only one.`;
  const cell = next.board.findIndex((v,i) => v !== s.board[i]);
  const open = lines.filter(l => l.includes(cell) && l.every(i => next.board[i] !== other(s.turn))).length;
  return `Column ${column+1} keeps ${open} possible line${open === 1 ? "" : "s"} of four open. Central columns can join lines in more directions; watch for a new threat after every turn.`;
}