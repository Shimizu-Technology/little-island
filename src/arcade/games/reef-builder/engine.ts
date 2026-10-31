import { allLevelIds, levelNumber, nextRandom, worldOf, type ArcadeEngine, type ArcadeLevel, type ArcadeResult, type LevelId } from "../../types";
export type ReefLevel = ArcadeLevel & { goal: "lines" | "fish" | "score"; target: number; greatMoves: number; goodMoves: number; startingRows: number; complexity: number; rocks: number[]; targetSum?: number };
export type CoralPiece = { cells: readonly (readonly [number, number])[]; value: number; color: number };
export type ReefState = { version: 2; appearance: number[]; level: ReefLevel | "endless"; board: number[]; fish: number[]; pieces: (CoralPiece | null)[]; seed: number; helper: boolean; moves: number; lines: number; rescued: number; score: number; status: "playing" | "cleared" | "full" | "stopped"; event: number; lastClear: number[]; lastFish: number; lastFishCells: number[]; lastPoints: number; message: string; /** Set once a learning-world sum was too big; the finish counts as helped practice. */ helped?: boolean };
export type ReefInput = { type: "place"; slot: number; row: number; col: number } | { type: "reroll"; slot: number } | { type: "helper"; value: boolean } | { type: "finish" };
/** Original coral silhouettes; complexity grows after each tray is used. */
export const SHAPES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
];
const worldRank = (id: LevelId) => ({ w1: 0, w2: 1, w3: 2, w4: 3, w5: 4, w6: 5, learn: 0 })[worldOf(id)];
// Seed-42 fixture move counts, replayed by the pure reducer in tests/fixtures/puzzle-feel.json.
const fixtureMoves: number[][] = [[10,10,10,10,10,10,12,12],[13,13,13,16,16,16,19,19],[19,19,19,21,19,19,21,21],[20,20,20,23,22,22,25,25],[29,29,29,31,31,31,34,34],[30,30,30,34,34,34,37,37],[4,4,6,6,9,9,10,10]];
export const reefLevels: readonly ReefLevel[] = allLevelIds.map((id, n) => {
  const index = levelNumber(id), world = worldOf(id), rank = worldRank(id), learning = world === "learn";
  const target = learning ? 2 + Math.floor((index - 1) / 2) : 3 + rank * 2 + Math.floor((index - 1) / 3);
  const greatMoves = fixtureMoves[Math.floor(n / 8)][(n % 8)] ?? (learning ? target + 2 : target * 3);
  const rocks = learning || rank < 3 ? [] : rank === 3 ? [18, 45] : rank === 4 ? [10, 26, 37, 53] : [9, 22, 33, 46, 49, 62];
  return { id, index, world, name: learning ? ["Two corals make ten", "Ten along the reef", "Find a number partner", "A cross of ten", "Three number corals", "Ten in two directions", "Leave room for ten", "A reef full of tens"][index - 1] : `${["Little lagoon", "Corner garden", "Deep reef", "Current caves", "Winding nursery", "Scattered atoll"][rank]} ${index}`,
    goal: "lines", target, greatMoves, goodMoves: greatMoves + (learning ? 3 : 4), startingRows: 1, rocks,
    complexity: learning ? 1 : Math.min(SHAPES.length, 7 + rank + Math.floor((index - 1) / 4)), ...(learning ? { targetSum: 10 } : {}),
    goals: [learning ? `Make ${target} lines of 10` : `Clear ${target} lines`, `Finish in ${greatMoves + (learning ? 3 : 4)} moves`, `Finish in ${greatMoves} moves`] };
});
export const reefLevel = (id: LevelId) => reefLevels.find(l => l.id === id)!;
function deal(seed: number, level: ReefState["level"], moves = 0): { seed: number; pieces: CoralPiece[] } {
  const pieces: CoralPiece[] = [];
  for (let i = 0; i < 3; i++) {
    let n: number; [seed, n] = nextRandom(seed);
    const shape = level !== "endless" && level.targetSum ? 0 : Math.floor(n * (level === "endless" ? SHAPES.length : Math.min(SHAPES.length, level.complexity + Math.floor(moves / 9))));
    [seed, n] = nextRandom(seed);
    pieces.push({ cells: SHAPES[shape], value: level !== "endless" && level.targetSum ? 1 + Math.floor(n * 9) : 1, color: i + 1 });
  }
  return { seed, pieces };
}
export function createReef(level: ReefState["level"], seed: number, helper = false): ReefState {
  const board = Array<number>(64).fill(0), fish: number[] = [];
  const learning = level !== "endless" && !!level.targetSum;
  if (level !== "endless") {
    level.rocks.forEach(i => { board[i] = 9; });
    if (learning) { board[56] = 4; fish.push(56); }
    else { for (let c = 0; c < 3; c++) board[56 + c] = 1; fish.push(57); }
  }
  const dealt = deal(seed >>> 0, level);
  if (learning) dealt.pieces[0] = { cells: SHAPES[0], value: 6, color: 1 };
  // Three usable, varied pieces; none solves the opening in one action.
  else if (level !== "endless" && level.world === "w1") dealt.pieces = [3, 6, 5].map((shape, i) => ({ cells: SHAPES[shape], value: 1, color: i + 1 }));
  return { version: 2, appearance: board.map((value, i) => value ? (i + value) % 4 : -1), level, board, fish, ...dealt, helper, moves: 0, lines: 0, rescued: 0, score: 0, event: 0, status: "playing", lastClear: [], lastFish: 0, lastFishCells: [], lastPoints: 0, message: learning ? "Put 6 beside 4. Together they make 10." : "Leave room for all three coral pieces. Rows and columns both clear." };
}
export function placementCells(s: ReefState, piece: CoralPiece, row: number, col: number): number[] | null {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  const cells = piece.cells.map(([r, c]) => [row + r, col + c] as const);
  if (cells.some(([r, c]) => r < 0 || r >= 8 || c < 0 || c >= 8 || s.board[r * 8 + c])) return null;
  if (s.level !== "endless" && s.level.targetSum) {
    const target = s.level.targetSum;
    const next = [...s.board]; cells.forEach(([r, c]) => { next[r * 8 + c] = piece.value; });
    if (cells.some(([r, c]) => Array.from({ length: 8 }, (_, i) => next[r * 8 + i]).reduce((a, b) => a + b, 0) > target || Array.from({ length: 8 }, (_, i) => next[i * 8 + c]).reduce((a, b) => a + b, 0) > target)) return null;
  }
  return cells.map(([r, c]) => r * 8 + c);
}
export function clearLines(board: number[], target?: number, rocks: readonly number[] = []): { cells: number[]; count: number } {
  const lines: number[][] = [];
  for (let i = 0; i < 8; i++) for (const vertical of [false, true]) {
    const cells = Array.from({ length: 8 }, (_, j) => vertical ? j * 8 + i : i * 8 + j), values = cells.map(j => board[j]);
    if (!cells.some(j => rocks.includes(j)) && (target ? values.filter(Boolean).length >= 2 && values.reduce((a, b) => a + b, 0) === target : values.every(Boolean))) lines.push(cells);
  }
  return { cells: [...new Set(lines.flat())].filter(i => !!board[i]), count: lines.length };
}
/** The landing ghost and the reducer share placement and line rules, including make-ten reefs. */
export function previewReefPlacement(s: ReefState, piece: CoralPiece, row: number, col: number): { cells: number[]; clear: { cells: number[]; count: number } } | null {
  const cells = placementCells(s, piece, row, col);
  if (!cells) return null;
  const board = [...s.board]; cells.forEach(i => { board[i] = piece.value; });
  return { cells, clear: clearLines(board, s.level !== "endless" ? s.level.targetSum : undefined, s.level === "endless" ? [] : s.level.rocks) };
}
export function legalReefMoves(s: ReefState, slot?: number): { slot: number; row: number; col: number }[] {
  const moves: { slot: number; row: number; col: number }[] = [];
  s.pieces.forEach((piece, i) => {
    if (!piece || (slot !== undefined && slot !== i)) return;
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) if (placementCells(s, piece, row, col)) moves.push({ slot: i, row, col });
  });
  return moves;
}
export function hasReefMove(s: ReefState): boolean {
  for (const piece of s.pieces) if (piece) for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) if (placementCells(s, piece, row, col)) return true;
  return false;
}
export const reefGoalValue = (s: ReefState) => s.level === "endless" ? s.score : s.level.goal === "lines" ? s.lines : s.level.goal === "fish" ? s.rescued : s.score;
export function reefTransition(s: ReefState, input: ReefInput): ReefState {
  if (!input || typeof input !== "object" || s.status !== "playing") return s;
  if (input.type === "helper") return typeof input.value === "boolean" ? { ...s, helper: input.value } : s;
  if (input.type === "finish") return s.level === "endless" ? { ...s, status: "stopped", message: "Your reef is ready to rest." } : s;
  // Legacy command is deliberately inert. Helper previews legal moves and cannot manufacture a fit.
  if (input.type === "reroll") return s;
  if (input.type !== "place" || !Number.isInteger(input.slot)) return s;
  const piece = s.pieces[input.slot];
  if (!piece) return s;
  const preview = previewReefPlacement(s, piece, input.row, input.col);
  if (!preview) {
    // An open, in-bounds spot rejected only by the target sum is a wrong learning answer.
    const sumMiss = s.level !== "endless" && !!s.level.targetSum && !!placementCells({ ...s, level: "endless" }, piece, input.row, input.col);
    return { ...s, ...(sumMiss ? { helped: true } : {}), message: sumMiss ? reefSumRejection(s, piece, input.row, input.col) : "That coral needs a little more room. Try an open spot." };
  }
  const { cells, clear } = preview;
  const board = [...s.board], appearance = [...s.appearance]; cells.forEach(i => { board[i] = piece.value; appearance[i] = piece.color; });
  const fish = s.fish.length && s.moves % 3 !== 2 ? s.fish : [...s.fish, cells[0]], target = s.level !== "endless" ? s.level.targetSum : undefined;
  const rescued = fish.filter(i => clear.cells.includes(i)).length;
  clear.cells.forEach(i => { board[i] = 0; appearance[i] = -1; });
  let next: ReefState = { ...s, board, appearance, fish: fish.filter(i => !clear.cells.includes(i)), pieces: s.pieces.map((p, i) => i === input.slot ? null : p), moves: s.moves + 1, lines: s.lines + clear.count, rescued: s.rescued + rescued, score: Math.min(99999999, s.score + cells.length * 10 + clear.count * 80 + rescued * 50), event: s.event + 1, lastClear: clear.cells, lastFish: rescued, lastFishCells: fish.filter(i => clear.cells.includes(i)), lastPoints: cells.length * 10 + clear.count * 80 + rescued * 50, message: clear.count ? `${target ? `You made ${target}! ` : ""}${clear.count} line${clear.count === 1 ? "" : "s"} clear${clear.count === 1 ? "s" : ""}. ${rescued ? `${rescued} fish swimming free!` : "Room for new coral."}` : target ? "Look for a number partner. Each line needs 10." : "A lovely fit. Keep a little space for your next piece." };
  if (next.level !== "endless" && reefGoalValue(next) >= next.level.target) return { ...next, status: "cleared" };
  if (next.pieces.every(p => p === null)) next = { ...next, ...deal(next.seed, next.level, next.moves) };
  if (!hasReefMove(next)) next = { ...next, status: "full", message: "No offered piece fits. Try again and leave a little channel." };
  return next;
}
export function reefResult(s: ReefState): ArcadeResult | null {
  if (s.status === "playing") return null;
  const stars = s.status === "cleared" && s.level !== "endless" ? s.moves <= s.level.greatMoves ? 3 : s.moves <= s.level.goodMoves ? 2 : 1 : 0;
  return { cleared: s.status === "cleared", outcome: s.status === "cleared" ? "cleared" : s.status === "stopped" ? "stopped" : "game-over", stars, score: s.score, detail: `${s.lines} line${s.lines === 1 ? "" : "s"} · ${s.rescued} fish · ${s.moves} move${s.moves === 1 ? "" : "s"}` };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => object(v) && Object.keys(v).sort().join() === [...keys].sort().join();
const integer = (v: unknown, max = 99999999) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
/** Upgrade only a strictly valid old state, without mutating or discarding its original. */
export function migrateReef(v: unknown): ReefState | null {
  if (validReef(v)) return v;
  if (!object(v) || "version" in v || "appearance" in v || !Array.isArray(v.board)) return null;
  const next = { ...v, version: 2, appearance: v.board.map((value, i) => typeof value === "number" && value ? (i + value) % 4 : -1) };
  return validReef(next) ? next : null;
}
export function validReef(v: unknown): v is ReefState {
  if (object(v) && "helped" in v) { const { helped, ...rest } = v; return typeof helped === "boolean" && validReef(rest); }
  if (!exact(v, ["version", "appearance", "level", "board", "fish", "pieces", "seed", "helper", "moves", "lines", "rescued", "score", "status", "event", "lastClear", "lastFish", "lastFishCells", "lastPoints", "message"]) || !(v.level === "endless" || reefLevels.some(l => JSON.stringify(l) === JSON.stringify(v.level))) || !Array.isArray(v.board) || v.board.length !== 64 || !v.board.every(n => integer(n, 9)) || !Array.isArray(v.fish) || new Set(v.fish).size !== v.fish.length || !v.fish.every(n => integer(n, 63) && (v.board as number[])[n]) || !Array.isArray(v.pieces) || v.pieces.length !== 3) return false;
  if (!v.pieces.every(p => p === null || exact(p, ["cells", "value", "color"]) && integer(p.value, 9) && (p.value as number) > 0 && integer(p.color, 3) && Array.isArray(p.cells) && SHAPES.some(shape => JSON.stringify(shape) === JSON.stringify(p.cells))) || !integer(v.seed, 0xffffffff) || typeof v.helper !== "boolean" || ![v.moves, v.lines, v.rescued, v.score, v.lastFish, v.lastPoints, v.event].every(n => integer(n)) || !["playing", "cleared", "full", "stopped"].includes(v.status as string) || typeof v.message !== "string" || v.message.length > 400) return false;
  for (const cells of [v.lastClear, v.lastFishCells]) if (!Array.isArray(cells) || new Set(cells).size !== cells.length || !cells.every(n => integer(n, 63))) return false;
  if (v.version !== 2 || !Array.isArray(v.appearance) || v.appearance.length !== 64 || !v.appearance.every((id, i) => (v.board as number[])[i] ? integer(id, 3) : id === -1)) return false;
  const s = v as ReefState;
  if (s.event !== s.moves || s.lastFish !== s.lastFishCells.length || s.lastFishCells.some(n => !s.lastClear.includes(n)) || (s.level !== "endless" && s.level.rocks.some(i => s.board[i] !== 9 || s.fish.includes(i) || s.lastClear.includes(i)))) return false;
  return (s.status !== "playing" || hasReefMove(s)) && (s.status !== "full" || !hasReefMove(s)) && (s.status !== "cleared" || s.level !== "endless" && reefGoalValue(s) >= s.level.target) && (s.status !== "stopped" || s.level === "endless");
}
export const reefEngine: ArcadeEngine<ReefState, ReefInput, ReefLevel> = { create: createReef, reduce: reefTransition, result: reefResult, validate: validReef };

function reefSumRejection(s: ReefState, piece: CoralPiece, row: number, col: number): string {
  const cells = placementCells({ ...s, level: "endless" }, piece, row, col)!;
  const board = [...s.board]; cells.forEach(i => { board[i] = piece.value; });
  const target = s.level === "endless" ? 10 : s.level.targetSum!;
  for (const i of cells) for (const line of [Array.from({ length: 8 }, (_, c) => Math.floor(i / 8) * 8 + c), Array.from({ length: 8 }, (_, r) => r * 8 + i % 8)]) {
    const values = line.map(j => board[j]).filter(Boolean), sum = values.reduce((a,b) => a+b, 0);
    if (sum > target) return `${values.join(" + ")} = ${sum}. Each row and column must stay at ${target} or less. Try another spot.`;
  }
  return `Keep each row and column at ${target} or less.`;
}