import { Base, Options, base } from "./types";
import { Match, Seat, RoundResult, newMatch, settle, nextStarter } from "./match";
export type Mark = "X" | "O";
export type TicState = Base & {
  game: "tic-tac-toe";
  board: (Mark | null)[];
  human: Mark;
  history: (Mark | null)[][];
  first?: Mark;
  match?: Match;
  starter?: Seat;
  xSeat?: Seat;
};
export const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export function ticOutcome(board: TicState["board"]): Mark | "draw" | null {
  for (const [a, b, c] of lines)
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? "draw" : null;
}
export const ticTurn = (board: TicState["board"], first: Mark = "X"): Mark =>
  board.filter(Boolean).length % 2 === 0 ? first : first === "X" ? "O" : "X";
export const createTic = (options: Options): TicState => ({
  ...base("tic-tac-toe", options),
  game: "tic-tac-toe",
  board: Array(9).fill(null),
  human: options.computerFirst ? "O" : "X",
  history: [],
});
export function ticMove(s: TicState, index: number): TicState {
  if (!Number.isInteger(index) || index < 0 || index > 8 || s.board[index] || ticOutcome(s.board)) return s;
  const board = [...s.board];
  board[index] = ticTurn(board, s.first);
  return { ...s, board, history: [...s.history, s.board] };
}
function score(board: TicState["board"], player: Mark, depth = 0, first: Mark = "X"): number {
  const result = ticOutcome(board);
  if (result) return result === "draw" ? 0 : result === player ? 10 - depth : depth - 10;
  const turn = ticTurn(board, first);
  const values = board.flatMap((v, i) => {
    if (v) return [];
    const next = [...board];
    next[i] = turn;
    return [score(next, player, depth + 1, first)];
  });
  return turn === player ? Math.max(...values) : Math.min(...values);
}
export function ticChoice(s: TicState, rng = Math.random, perfect = false): number | null {
  if (ticOutcome(s.board)) return null;
  const available = s.board.flatMap((m, i) => (m ? [] : [i]));
  if (!perfect && (s.options.difficulty === "easy" || (s.options.difficulty === "medium" && rng() < 0.3)))
    return available[Math.floor(rng() * available.length)];
  const player = ticTurn(s.board, s.first);
  return available
    .map((i) => {
      const b = [...s.board];
      b[i] = player;
      return { i, score: score(b, player, 0, s.first) };
    })
    .sort((a, b) => b.score - a.score)[0].i;
}
export function ticUndo(s: TicState): TicState {
  if (!s.history.length) return s;
  const history = [...s.history];
  let board = history.pop()!;
  if (s.options.mode === "solo" && ticTurn(board, s.first) !== s.human && history.length)
    board = history.pop()!;
  return { ...s, board, history };
}

export function ticHintReason(s: TicState, index: number): string {
  const player = ticTurn(s.board, s.first),
    other = player === "X" ? "O" : "X";
  const after = [...s.board];
  after[index] = player;
  if (ticOutcome(after) === player) return "This square completes your line of three.";
  after[index] = other;
  if (ticOutcome(after) === other) return "Block here: the other shape already has two in this line.";
  const opportunities = lines.filter(
    (line) => line.includes(index) && line.every((i) => s.board[i] === null || s.board[i] === player)
  ).length;
  return opportunities > 1
    ? "This square helps more than one possible line. Watch across, down, and diagonally."
    : "Try this square to keep a line open while defending against the other shape.";
}

export const ticXSeat = (s: TicState): Seat =>
  s.xSeat ?? (s.options.mode === "solo" && s.human === "O" ? 1 : 0);
export const ticStarter = (s: TicState): Seat =>
  s.starter ?? ((s.first ?? "X") === (ticXSeat(s) === 0 ? "X" : "O") ? 0 : 1);

/** Scores contain earlier rounds only; the current board remains reversible. */
export function ticResult(s: TicState): RoundResult {
  const result = ticOutcome(s.board),
    xSeat = ticXSeat(s);
  return !result || result === "draw" ? result : result === "X" ? xSeat : xSeat === 0 ? 1 : 0;
}
export function replayTic(s: TicState): TicState {
  const match = settle(
    s.match ?? newMatch(s.options.mode === "solo" ? ["You", "Island friend"] : undefined),
    ticResult(s)
  );
  const starter = nextStarter(match, ticStarter(s)),
    xSeat = ticXSeat(s);
  return {
    ...createTic(s.options),
    human: s.human,
    match,
    starter,
    xSeat,
    first: starter === xSeat ? "X" : "O",
  };
}
