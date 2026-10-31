import { other, Seat } from "../../games/match";
import { blank, integer, minimax, Position, replayValidator, Strength, tally } from "../types";
/** Counterclockwise: seat 0 pits 0..5, store 6; seat 1 pits 7..12, store 13. */
export function create(seed = 1, _size = 6, starter: Seat = 0): Position {
  return blank(
    seed,
    6,
    starter,
    Array.from({ length: 14 }, (_, i) => (i === 6 || i === 13 ? 0 : 4))
  );
}
export function legal(s: Position): number[] {
  return s.outcome !== null ? [] : Array.from({ length: 6 }, (_, i) => i + s.turn * 7).filter((i) => s.board[i] > 0);
}
export function sowPath(s: Position, pit: number): number[] {
  if (!integer(pit, 0, 13) || !legal(s).includes(pit)) return [];
  let at = pit;
  const path: number[] = [];
  for (let n = 0; n < s.board[pit]; n++) {
    do {
      at = (at + 1) % 14;
    } while (at === (s.turn === 0 ? 13 : 6));
    path.push(at);
  }
  return path;
}
export function move(s: Position, pit: number): Position {
  const path = sowPath(s, pit);
  if (!path.length) return s;
  const board = [...s.board],
    store = s.turn === 0 ? 6 : 13;
  board[pit] = 0;
  for (const i of path) board[i]++;
  const last = path[path.length - 1],
    own = s.turn === 0 ? last < 6 : last > 6 && last < 13;
  if (own && board[last] === 1 && board[12 - last] > 0) {
    board[store] += board[12 - last] + 1;
    board[last] = 0;
    board[12 - last] = 0;
  }
  const ended = board.slice(0, 6).every((n) => n === 0) || board.slice(7, 13).every((n) => n === 0);
  if (ended)
    for (let i = 0; i < 14; i++)
      if (i !== 6 && i !== 13) {
        board[i < 6 ? 6 : 13] += board[i];
        board[i] = 0;
      }
  const scores: [number, number] = [board[6], board[13]];
  return {
    ...s,
    board,
    scores,
    moves: [...s.moves, pit],
    turn: last === store ? s.turn : other(s.turn),
    outcome: ended ? tally(scores) : null,
  };
}
export function choose(s: Position, strength: Strength): number | null {
  return minimax(s, strength === "gentle" ? 1 : strength === "growing" ? 3 : 6, legal, move, (p, seat) => {
    const material = p.board.slice(0, 6).reduce((a, b) => a + b, 0) - p.board.slice(7, 13).reduce((a, b) => a + b, 0);
    return (seat === 0 ? 1 : -1) * ((p.board[6] - p.board[13]) * 12 + material) + (p.turn === seat ? 3 : -3);
  });
}
export const validate = replayValidator(create, move, [6], 4096);
