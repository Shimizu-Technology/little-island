import { Base, Options, CheckersRules, base } from "./types";
import { Match, Seat, RoundResult, newMatch, settle, nextStarter } from "./match";
export type Side = 1 | -1;
export type CheckersMove = { from: number; path: number[]; captured: number[] };
export type Position = {
  board: number[];
  turn: Side;
  quiet: number;
  repetitions: Record<string, number>;
  outcome: "red" | "blue" | "draw" | null;
};
export type CheckersState = Base & {
  game: "checkers";
  match?: Match;
  starter?: Seat;
  position: Position;
  history: Position[];
  lesson: number | null;
  lessonBackup: { position: Position; history: Position[] } | null;
};
// Missing rules belong to pre-variant saves and retain Classic behavior.
export const checkersRules = (s: CheckersState): CheckersRules =>
  s.lesson !== null ? "classic" : (s.options.checkersRules ?? "classic");
export const row = (i: number) => Math.floor(i / 8);
export const col = (i: number) => i % 8;
export const side = (piece: number) => Math.sign(piece) as Side;
export const positionKey = (board: number[], turn: Side) =>
  `${turn}:${board.map((piece) => piece + 2).join("")}`;
export function position(board: number[], turn: Side = 1): Position {
  return { board: [...board], turn, quiet: 0, repetitions: { [positionKey(board, turn)]: 1 }, outcome: null };
}
function steps(piece: number): number[][] {
  return Math.abs(piece) === 2
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
    : [
        [side(piece), -1],
        [side(piece), 1],
      ];
}
function square(r: number, c: number): number | null {
  return r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : null;
}
function crowned(piece: number, to: number) {
  return Math.abs(piece) === 1 && (side(piece) === 1 ? row(to) === 7 : row(to) === 0);
}
export function checkersMoves(
  p: Pick<Position, "board" | "turn">,
  rules: CheckersRules = "classic"
): CheckersMove[] {
  const captures: CheckersMove[] = [],
    walks: CheckersMove[] = [];
  function jump(board: number[], from: number, current: number, path: number[], taken: number[]) {
    const piece = board[current];
    let continued = false;
    for (const [dr, dc] of steps(piece)) {
      const middle = square(row(current) + dr, col(current) + dc),
        to = square(row(current) + 2 * dr, col(current) + 2 * dc);
      if (
        middle === null ||
        to === null ||
        !board[middle] ||
        side(board[middle]) === side(piece) ||
        board[to]
      )
        continue;
      continued = true;
      const next = [...board];
      next[current] = 0;
      next[middle] = 0;
      next[to] = piece;
      const newPath = [...path, to],
        newTaken = [...taken, middle];
      if (crowned(piece, to)) captures.push({ from, path: newPath, captured: newTaken });
      else jump(next, from, to, newPath, newTaken);
    }
    if (!continued && taken.length) captures.push({ from, path, captured: taken });
  }
  p.board.forEach((piece, from) => {
    if (!piece || side(piece) !== p.turn) return;
    jump(p.board, from, from, [], []);
    for (const [dr, dc] of steps(piece)) {
      const to = square(row(from) + dr, col(from) + dc);
      if (to !== null && !p.board[to]) walks.push({ from, path: [to], captured: [] });
    }
  });
  return captures.length && rules === "classic" ? captures : [...captures, ...walks];
}
export function checkersResult(p: Position, rules: CheckersRules = "classic"): Position["outcome"] {
  if (!checkersMoves(p, rules).length) return p.turn === 1 ? "blue" : "red";
  if (p.quiet >= 80 || p.repetitions[positionKey(p.board, p.turn)] >= 3) return "draw";
  return null;
}
export function applyCheckers(p: Position, move: CheckersMove, rules: CheckersRules = "classic"): Position {
  const board = [...p.board],
    piece = board[move.from],
    to = move.path[move.path.length - 1];
  board[move.from] = 0;
  for (const captured of move.captured) board[captured] = 0;
  board[to] = crowned(piece, to) ? side(piece) * 2 : piece;
  const turn = (p.turn * -1) as Side,
    key = positionKey(board, turn);
  const irreversible = move.captured.length > 0 || Math.abs(piece) === 1;
  const next: Position = {
    board,
    turn,
    quiet: irreversible ? 0 : p.quiet + 1,
    repetitions: irreversible ? { [key]: 1 } : { ...p.repetitions, [key]: (p.repetitions[key] ?? 0) + 1 },
    outcome: null,
  };
  next.outcome = checkersResult(next, rules);
  return next;
}
export function createCheckers(options: Options): CheckersState {
  const board = Array<number>(64).fill(0);
  for (let i = 0; i < 64; i++)
    if ((row(i) + col(i)) % 2 === 1) board[i] = row(i) < 3 ? 1 : row(i) > 4 ? -1 : 0;
  return {
    ...base("checkers", options),
    game: "checkers",
    position: position(board),
    history: [],
    lesson: null,
    lessonBackup: null,
  };
}
export function checkersMove(s: CheckersState, move: CheckersMove): CheckersState {
  if (s.position.outcome) return s;
  const rules = checkersRules(s);
  const legal = checkersMoves(s.position, rules).find(
    (m) => m.from === move.from && m.path.join(",") === move.path.join(",")
  );
  if (!legal) return s;
  return {
    ...s,
    position: applyCheckers(s.position, legal, rules),
    history: [...s.history, s.position].slice(-160),
  };
}
export function checkersUndo(s: CheckersState): CheckersState {
  if (!s.history.length) return s;
  const history = [...s.history];
  let p = history.pop()!;
  if (s.options.mode === "solo" && s.lesson === null && p.turn === -1 && history.length) p = history.pop()!;
  return { ...s, position: p, history };
}
function evaluate(p: Position, player: Side, rules: CheckersRules): number {
  const result = p.outcome ?? checkersResult(p, rules);
  if (result) return result === "draw" ? 0 : (result === "red" ? 1 : -1) === player ? 10000 : -10000;
  return p.board.reduce(
    (sum, piece, i) =>
      sum +
      (piece
        ? side(piece) *
          player *
          (Math.abs(piece) === 2 ? 175 : 100 + (side(piece) === 1 ? row(i) : 7 - row(i)) * 3)
        : 0),
    0
  );
}
// Yield between root branches; each recursive slice also has a strict time/node budget.
export async function checkersChoice(
  s: CheckersState,
  cancelled: () => boolean = () => false
): Promise<CheckersMove | null> {
  if (s.position.outcome) return null;
  const rules = checkersRules(s),
    moves = checkersMoves(s.position, rules);
  if (!moves.length) return null;
  if (s.options.difficulty === "easy") return moves[Math.floor(Math.random() * moves.length)];
  let best = moves[0],
    bestScore = -Infinity;
  const player = s.position.turn,
    depth = s.options.difficulty === "hard" ? 4 : 2;
  let nodes = 0;
  const maxNodes = s.options.difficulty === "hard" ? 9000 : 1800;
  for (const move of moves) {
    if (cancelled()) return null;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const deadline = Date.now() + 8;
    function search(p: Position, remaining: number, alpha: number, beta: number): number {
      nodes++;
      if (!remaining || p.outcome || nodes >= maxNodes || Date.now() > deadline)
        return evaluate(p, player, rules);
      const children = checkersMoves(p, rules);
      if (!children.length) return evaluate(p, player, rules);
      let score = p.turn === player ? -Infinity : Infinity;
      for (const child of children) {
        const value = search(applyCheckers(p, child, rules), remaining - 1, alpha, beta);
        if (p.turn === player) {
          score = Math.max(score, value);
          alpha = Math.max(alpha, score);
        } else {
          score = Math.min(score, value);
          beta = Math.min(beta, score);
        }
        if (beta <= alpha || nodes >= maxNodes || Date.now() > deadline) break;
      }
      return score;
    }
    const value = search(applyCheckers(s.position, move, rules), depth - 1, -Infinity, Infinity);
    if (value > bestScore) {
      bestScore = value;
      best = move;
    }
    if (nodes >= maxNodes) break;
  }
  return cancelled() ? null : best;
}
export const LESSONS = [
  {
    title: "One step at a time",
    text: "Tap your red piece, then a bright square. Ordinary pieces move diagonally forward.",
    red: [[2, 1]],
    blue: [[7, 0]],
  },
  {
    title: "Make a jump",
    text: "A jump is available! Hop over the blue piece. In Classic checkers, you must take a jump when you can. Friendly games let you choose.",
    red: [[2, 1]],
    blue: [[3, 2]],
  },
  {
    title: "Keep jumping",
    text: "After the first jump, keep going with the same piece. Follow the bright squares.",
    red: [[2, 1]],
    blue: [
      [3, 2],
      [5, 4],
    ],
  },
  {
    title: "Meet your king",
    text: "Reach the far row to earn a crown. Your turn ends there. Kings can move forward and backward.",
    red: [[6, 1]],
    blue: [[1, 0]],
  },
] as const;
export function checkersLesson(s: CheckersState, index: number): CheckersState {
  const lesson = LESSONS[index];
  if (!lesson) return s;
  const board = Array<number>(64).fill(0);
  lesson.red.forEach(([r, c]) => (board[r * 8 + c] = 1));
  lesson.blue.forEach(([r, c]) => (board[r * 8 + c] = -1));
  return {
    ...s,
    id: base("checkers", s.options).id,
    position: position(board),
    history: [],
    lesson: index,
    lessonBackup: s.lesson === null ? { position: s.position, history: s.history } : s.lessonBackup,
  };
}
export function finishCheckersLessons(s: CheckersState): CheckersState {
  return s.lessonBackup
    ? {
        ...s,
        id: base("checkers", s.options).id,
        lesson: null,
        position: s.lessonBackup.position,
        history: s.lessonBackup.history,
        lessonBackup: null,
      }
    : createCheckers(s.options);
}

/** Red always starts. Alternating the starting seat swaps the family colours. */
export function checkersResultSeat(s: CheckersState): RoundResult {
  const result = s.lesson === null ? s.position.outcome : null;
  const redSeat = s.options.mode === "solo" ? 0 : (s.starter ?? 0);
  return !result || result === "draw" ? result : result === "red" ? redSeat : redSeat === 0 ? 1 : 0;
}
export function replayCheckers(s: CheckersState): CheckersState {
  const match = settle(
    s.match ?? newMatch(s.options.mode === "solo" ? ["You", "Island friend"] : undefined),
    checkersResultSeat(s)
  );
  return {
    ...createCheckers(s.options),
    match,
    starter: s.options.mode === "together" ? nextStarter(match, s.starter ?? 0) : 0,
  };
}
