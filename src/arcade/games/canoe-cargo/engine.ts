import { nextRandom, worldIds, worldRank, type ArcadeEngine, type ArcadeLevel, type ArcadeResult, type LevelId } from "../../types";

export const COLS = 9, ROWS = 14;
export const LOCK_DELAY = .5, MAX_LOCK_RESETS = 15, SOFT_DROP = 20;
export const cargoKinds = ["crate", "coconut", "fish", "taro"] as const;
export type CargoKind = typeof cargoKinds[number];
export type CargoCell = { kind: CargoKind; value: number; stuck: boolean };
export type Point = readonly [number, number];
/** Seven four-parcel bundles. Coordinates are row, column; public cell coordinates stay normalized; rotation retains the fixed pivot below. */
export const cargoShapes: readonly (readonly Point[])[] = [
  [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]],
  [[0, 2], [1, 0], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
];
export type CargoPiece = { shape: number; turn: number; kind: CargoKind; value: number };
export type CargoLevel = ArcadeLevel & { goal: "canoes" | "crates" | "score"; target: number; fall: number; opening: number; garbageEvery: number; targetSum: number; par: number; tide: "none" | "wide" | "narrow" | "shift" | "crowded" };
// Verified by the seed-42 packing fixtures in tests/fixtures/puzzle-feel.json.
const fixtureLoads: number[][] = [[10,10,10,13,13,14,14,17],[13,15,13,16,16,18,17,19],[18,17,18,18,19,25,19,22],[18,21,24,20,20,21,22,26],[22,25,23,26,23,27,25,27],[28,28,28,34,34,38,38,33],[9,10,10,10,14,12,13,10]];
export const cargoLevels: CargoLevel[] = worldIds.flatMap((world, w) => Array.from({ length: 8 }, (_, i): CargoLevel => {
  const rank = worldRank(world), learning = world === "learn";
  const opening = learning ? 1 : rank === 0 ? 0 : rank === 1 ? 1 : rank === 2 ? 2 : rank === 3 ? 3 : rank === 4 ? 4 : 5;
  const target = learning ? 4 + Math.floor(i / 2) : 4 + rank * 2 + Math.floor(i * 3 / 7);
  const par = fixtureLoads[w][i] ?? Math.ceil((target * COLS - opening * 5) / 4) + 4;
  const fall = learning ? 0.8 : Number(([.8, .53, .37, .24, .165, .115][rank] - i * [.025, .018, .01, .009, .006, .002][rank]).toFixed(3));
  const tide = (["none", "none", "wide", "narrow", "shift", "crowded"] as const)[rank];
  return { id: `${world}-${i + 1}`, world, index: i + 1, name: `${learning ? "Number voyage" : ["Picnic packing", "Precious crates", "Moon tide", "Narrow passage", "Shifting stacks", "Star compass"][rank]} ${i + 1}`,
    goal: "canoes", target, opening, targetSum: learning ? [9, 12, 15, 18, 12, 15, 18, 21][i] : 0, par, fall, tide: learning ? "none" : tide,
    garbageEvery: !learning && rank >= 2 ? Math.max(6, 12 - rank - Math.floor(i / 3)) : 0,
    goals: [`Send ${target} canoes${learning ? " · matching sums sail twice" : ""}`, `Finish in ${par + 4} loads or fewer`, `Finish in ${par} loads or fewer`] };
}));
export function cargoLevel(id: LevelId): CargoLevel { const level = cargoLevels.find(l => l.id === id); if (!level) throw new Error("Unknown cargo level"); return level; }
export type CargoState = {
  version: 2; level: CargoLevel | "endless"; seed: number; helper: boolean; board: (CargoCell | null)[];
  piece: CargoPiece; next: [CargoPiece, CargoPiece]; bag: number[]; held: CargoPiece | null; holdUsed: boolean;
  row: number; col: number; clock: number; grounded: number; resets: number; soft: boolean; elapsed: number;
  loads: number; lines: number; canoes: number; freed: number; score: number; combo: number;
  status: "playing" | "cleared" | "over" | "finished"; event: number; lastRows: number[]; lastBonus: number; lastPoints: number; bump: number;
  lastDrop: { cells: number[]; distance: number } | null; helped?: boolean;
};
export type CargoInput = { type: "left" | "right" | "rotate" | "down" | "drop" | "hold" | "finish" | "idle" } | { type: "helper" | "soft"; value: boolean };
/** Fisher–Yates consumes a whole bag before drawing another. Preview and hold never duplicate draws. */
export function drawCargo(seed: number, bag: number[], targetSum = 0): { seed: number; bag: number[]; piece: CargoPiece } {
  let remaining = [...bag], n: number;
  if (!remaining.length) {
    remaining = cargoShapes.map((_, i) => i);
    for (let i = remaining.length - 1; i > 0; i--) { [seed, n] = nextRandom(seed); const j = Math.floor(n * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]]; }
  }
  const shape = remaining.shift()!;
  [seed, n] = nextRandom(seed); const kind = cargoKinds[Math.floor(n * 4)];
  [seed, n] = nextRandom(seed);
  return { seed, bag: remaining, piece: { shape, turn: 0, kind, value: targetSum ? 1 + Math.floor(n * 3) : 1 } };
}
/** SRS-sized rotation boxes: I pivots at (1.5, 1.5), others at (1, 1); O is fixed.
 * Normalize only at the API boundary so the existing authored packing coordinates stay valid.
 */
function rotationCells(piece: CargoPiece): Point[] {
  let cells = cargoShapes[piece.shape].map(([r, c]) => [r + (piece.shape === 0 ? 1 : 0), c] as Point);
  if (piece.shape === 1) return cells;
  const edge = piece.shape === 0 ? 3 : 2;
  for (let turn = 0; turn < piece.turn; turn++) cells = cells.map(([r, c]) => [c, edge - r]);
  return cells;
}
function rotationOrigin(piece: CargoPiece): Point {
  const cells = rotationCells(piece);
  return [Math.min(...cells.map(p => p[0])), Math.min(...cells.map(p => p[1]))];
}
export function pieceCells(piece: CargoPiece): Point[] {
  const [row, col] = rotationOrigin(piece);
  return rotationCells(piece).map(([r, c]) => [r - row, c - col]);
}
// Clockwise wall/floor kicks, in row-down / column-right coordinates. Test in order.
export const CARGO_KICKS: readonly (readonly Point[])[] = [
  [[0, 0], [0, -1], [-1, -1], [2, 0], [2, -1]],
  [[0, 0], [0, 1], [1, 1], [-2, 0], [-2, 1]],
  [[0, 0], [0, 1], [-1, 1], [2, 0], [2, 1]],
  [[0, 0], [0, -1], [1, -1], [-2, 0], [-2, -1]],
];
export const CARGO_I_KICKS: readonly (readonly Point[])[] = [
  [[0, 0], [0, -2], [0, 1], [1, -2], [-2, 1]],
  [[0, 0], [0, -1], [0, 2], [-2, -1], [1, 2]],
  [[0, 0], [0, 2], [0, -1], [-1, 2], [2, -1]],
  [[0, 0], [0, 1], [0, -2], [2, 1], [-1, -2]],
];
export function fits(s: Pick<CargoState, "board">, piece: CargoPiece, row: number, col: number): boolean {
  return pieceCells(piece).every(([r, c]) => row + r >= -3 && row + r < ROWS && col + c >= 0 && col + c < COLS && (row + r < 0 || !s.board[(row + r) * COLS + col + c]));
}
export function landingRow(s: CargoState): number { let row = s.row; while (fits(s, s.piece, row + 1, s.col)) row++; return row; }
export const cargoGoalValue = (s: CargoState) => s.level === "endless" || s.level.goal === "score" ? s.score : s.level.goal === "crates" ? s.freed : s.canoes;
export function createCargo(level: CargoLevel | "endless", seed: number, helper: boolean): CargoState {
  const targetSum = level === "endless" ? 0 : level.targetSum;
  const a = drawCargo(seed >>> 0, [], targetSum), b = drawCargo(a.seed, a.bag, targetSum), c = drawCargo(b.seed, b.bag, targetSum);
  const board: (CargoCell | null)[] = Array(COLS * ROWS).fill(null);
  if (level !== "endless") for (let j = 0; j < level.opening; j++) {
    const gap = level.tide === "shift" ? (j * 2 + level.index) % 6 : level.tide === "crowded" ? (j % 2 ? 0 : 5) : (level.index + j) % 6;
    for (let col = 0; col < COLS; col++) if (col < gap || col >= gap + 4) board[(ROWS - 1 - j) * COLS + col] = { kind: "crate", value: targetSum ? Math.max(1, Math.min(3, Math.floor(targetSum / 9))) : 1, stuck: true };
  }
  return { version: 2, level, seed: c.seed, bag: c.bag, helper, board, piece: a.piece, next: [b.piece, c.piece], held: null, holdUsed: false, row: 0, col: 3, clock: 0, grounded: 0, resets: 0, soft: false, elapsed: 0, loads: 0, lines: 0, canoes: 0, freed: 0, score: 0, combo: 0, status: "playing", event: 0, lastRows: [], lastBonus: 0, lastPoints: 0, bump: 0, lastDrop: null };
}
function spawn(s: CargoState): CargoState {
  const reset = { row: 0, col: 3, clock: 0, grounded: 0, resets: 0 };
  const drawn = drawCargo(s.seed, s.bag, s.level === "endless" ? 0 : s.level.targetSum);
  const next: CargoState = { ...s, ...reset, seed: drawn.seed, bag: drawn.bag, piece: s.next[0], next: [s.next[1], drawn.piece] };
  return fits(next, next.piece, 0, 3) ? next : { ...next, status: "over" };
}
function lock(s: CargoState): CargoState {
  // Rotation may use the three hidden ceiling rows; locking above the hold is top-out.
  if (pieceCells(s.piece).some(([r]) => s.row + r < 0)) return { ...s, status: "over", soft: false };
  const board = s.board.slice();
  pieceCells(s.piece).forEach(([r, c]) => { board[(s.row + r) * COLS + s.col + c] = { kind: s.piece.kind, value: s.piece.value, stuck: false }; });
  const lastRows: number[] = []; let freed = 0, bonus = 0, missed = false;
  for (let row = 0; row < ROWS; row++) {
    const line = board.slice(row * COLS, (row + 1) * COLS);
    if (line.every(Boolean)) { lastRows.push(row); freed += line.filter(c => c?.stuck).length;
      if (s.level !== "endless" && s.level.targetSum) { if (line.reduce((n, c) => n + c!.value, 0) === s.level.targetSum) bonus++; else missed = true; }
    }
  }
  const remaining = board.filter((_, i) => !lastRows.includes(Math.floor(i / COLS)));
  const combo = lastRows.length ? s.combo + 1 : 0, lastPoints = lastRows.length * 100 + bonus * 100 + Math.max(0, combo - 1) * 40 + (lastRows.length > 1 ? lastRows.length * 40 : 0) + 5;
  let next: CargoState = { ...s, board: [...Array(lastRows.length * COLS).fill(null), ...remaining], loads: s.loads + 1, lines: s.lines + lastRows.length, canoes: s.canoes + lastRows.length + bonus, freed: s.freed + freed, score: Math.min(99999999, s.score + lastPoints), combo, event: s.event + 1, lastRows, lastBonus: bonus, lastPoints, ...(missed || s.helped ? { helped: true } : {}) };
  if (s.level !== "endless" && cargoGoalValue(next) >= s.level.target) return { ...next, status: "cleared" };
  const every = s.level === "endless" ? Math.max(6, 14 - Math.floor(next.lines / 5)) : s.level.garbageEvery;
  // Tighten the tide cadence halfway through a level. Always leave a reachable channel.
  const cadence = every ? Math.max(5, every - (s.level !== "endless" && cargoGoalValue(next) >= s.level.target / 2 ? 1 : 0)) : 0;
  if (cadence && next.loads % (cadence + (s.helper ? 2 : 0)) === 0) {
    if (next.board.slice(0, COLS).some(Boolean)) return { ...next, status: "over" };
    const [seed, r] = nextRandom(next.seed), tide = s.level === "endless" ? "wide" : s.level.tide;
    const width = tide === "narrow" || tide === "crowded" ? 2 : tide === "shift" ? 3 : 4;
    const gap = tide === "shift" ? (Math.floor(next.loads / cadence) * 2) % (COLS - width + 1) : Math.floor(r * (COLS - width + 1));
    next = { ...next, seed, board: [...next.board.slice(COLS), ...Array.from({ length: COLS }, (_, c) => c >= gap && c < gap + width ? null : { kind: "crate" as const, value: 1, stuck: true })] };
  }
  return spawn({ ...next, holdUsed: false });
}
function moved(s: CargoState, next: CargoState): CargoState {
  // Reset only a successful grounded action, including a kick off a ledge. Failed moves cannot stall a lock.
  return !fits(s, s.piece, s.row + 1, s.col) && s.resets < MAX_LOCK_RESETS ? { ...next, grounded: 0, resets: s.resets + 1 } : next;
}
export function cargoTransition(s: CargoState, input: CargoInput): CargoState {
  if (s.status !== "playing" || !input || typeof input !== "object") return s;
  if (input.type === "helper") return typeof input.value === "boolean" ? { ...s, helper: input.value } : s;
  // Changing fall speed restarts the row timer, so time banked at normal gravity is never spent at soft-drop speed.
  if (input.type === "soft") return typeof input.value === "boolean" ? input.value === s.soft ? s : { ...s, soft: input.value, clock: 0 } : s;
  if (input.type === "finish") return s.level === "endless" ? { ...s, status: "finished" } : s;
  if (input.type === "hold") {
    if (s.holdUsed) return s;
    const next: CargoState = s.held ? { ...s, piece: { ...s.held, turn: 0 }, row: 0, col: 3, clock: 0, grounded: 0, resets: 0 } : spawn(s);
    return { ...next, held: { ...s.piece, turn: 0 }, holdUsed: true, status: fits(next, next.piece, 0, 3) ? "playing" : "over" };
  }
  if (input.type === "drop") {
    const row = landingRow(s), cells = pieceCells(s.piece).map(([r, c]) => (s.row + r) * COLS + s.col + c);
    return lock({ ...s, row, lastDrop: { cells, distance: row - s.row } });
  }
  if (input.type === "down") return fits(s, s.piece, s.row + 1, s.col) ? { ...s, row: s.row + 1, clock: 0 } : s;
  if (input.type === "left" || input.type === "right") {
    const col = s.col + (input.type === "left" ? -1 : 1);
    return fits(s, s.piece, s.row, col) ? moved(s, { ...s, col }) : { ...s, bump: s.bump + 1 };
  }
  if (input.type === "rotate") {
    const piece = { ...s.piece, turn: (s.piece.turn + 1) % 4 };
    const [oldR, oldC] = rotationOrigin(s.piece), [newR, newC] = rotationOrigin(piece);
    const kicks = s.piece.shape === 1 ? [[0, 0] as Point] : (s.piece.shape === 0 ? CARGO_I_KICKS : CARGO_KICKS)[s.piece.turn];
    for (const [dr, dc] of kicks) {
      const row = s.row + newR - oldR + dr, col = s.col + newC - oldC + dc;
      if (fits(s, piece, row, col)) return moved(s, { ...s, piece, row, col });
    }
    return { ...s, bump: s.bump + 1 };
  }
  return s;
}
export function cargoGravity(s: CargoState): number {
  const base = s.level === "endless" ? Math.max(.1, .65 - s.lines * .012) : s.level.fall;
  const progress = s.level === "endless" ? 0 : Math.min(1, cargoGoalValue(s) / s.level.target);
  return base * (s.helper ? 1.25 : 1) * (1 - .15 * progress);
}
export function cargoStep(s: CargoState, _input: CargoInput, dt: number): CargoState {
  if (s.status !== "playing" || !Number.isFinite(dt) || dt <= 0 || dt > .1) return s;
  // Number voyages are turn-based: arithmetic and reading never race gravity.
  if (s.level !== "endless" && s.level.world === "learn" && !s.soft) return s;
  let next = { ...s, elapsed: s.elapsed + dt, clock: s.clock + dt };
  const fall = cargoGravity(s) / (s.soft ? SOFT_DROP : 1);
  while (next.clock + 1e-9 >= fall && fits(next, next.piece, next.row + 1, next.col)) next = { ...next, clock: Math.max(0, next.clock - fall), row: next.row + 1 };
  if (!fits(next, next.piece, next.row + 1, next.col)) {
    next = { ...next, clock: 0, grounded: next.grounded + dt };
    if (next.grounded + 1e-9 >= LOCK_DELAY) return lock({ ...next, lastDrop: null });
  } else if (next.resets < MAX_LOCK_RESETS) next = { ...next, grounded: 0 };
  return next;
}
export function cargoResult(s: CargoState): ArcadeResult | null {
  if (s.status === "playing") return null;
  const cleared = s.status === "cleared", stars = cleared && s.level !== "endless" ? s.loads <= s.level.par ? 3 : s.loads <= s.level.par + 4 ? 2 : 1 : 0;
  const hasCrates = s.freed > 0 || s.level !== "endless" && (s.level.opening > 0 || s.level.garbageEvery > 0);
  return { cleared, outcome: cleared ? "cleared" : s.status === "finished" ? "stopped" : "game-over", stars, score: s.score, detail: `${s.canoes} canoes sailed${hasCrates ? ` · ${s.freed} crates freed` : ""} · ${s.loads} loads packed.${s.lastBonus ? " A target-sum delivery sailed twice!" : ""}` };
}
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === [...keys].sort().join();
const uint = (v: unknown, max = 99999999): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
const finite = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
function validPiece(v: unknown): v is CargoPiece { return exact(v, ["shape", "turn", "kind", "value"]) && uint(v.shape, 6) && uint(v.turn, 3) && cargoKinds.includes(v.kind as CargoKind) && uint(v.value, 3) && v.value >= 1; }
export function validCargo(v: unknown): v is CargoState {
  if (v && typeof v === "object" && !Array.isArray(v) && "helped" in v) { const { helped, ...rest } = v as Record<string, unknown>; return typeof helped === "boolean" && validCargo(rest); }
  if (!exact(v, ["version", "level", "seed", "helper", "board", "piece", "next", "bag", "held", "holdUsed", "row", "col", "clock", "grounded", "resets", "soft", "elapsed", "loads", "lines", "canoes", "freed", "score", "combo", "status", "event", "lastRows", "lastBonus", "lastPoints", "bump", "lastDrop"]) || v.version !== 2 || typeof v.helper !== "boolean" || typeof v.soft !== "boolean" || typeof v.holdUsed !== "boolean" || !uint(v.seed, 0xffffffff)) return false;
  if (v.level !== "endless" && !cargoLevels.some(l => JSON.stringify(l) === JSON.stringify(v.level))) return false;
  if (!Array.isArray(v.board) || v.board.length !== COLS * ROWS || !v.board.every(c => c === null || (exact(c, ["kind", "value", "stuck"]) && cargoKinds.includes(c.kind as CargoKind) && uint(c.value, 3) && c.value >= 1 && typeof c.stuck === "boolean"))) return false;
  if (!validPiece(v.piece) || !Array.isArray(v.next) || v.next.length !== 2 || !v.next.every(validPiece) || !(v.held === null || validPiece(v.held)) || !Array.isArray(v.bag) || v.bag.length > 6 || new Set(v.bag).size !== v.bag.length || !v.bag.every(n => uint(n, 6))) return false;
  if (!["loads", "lines", "canoes", "freed", "score", "combo", "event", "lastBonus", "lastPoints", "bump"].every(k => uint(v[k])) || !(typeof v.row === "number" && Number.isInteger(v.row) && v.row >= -3 && v.row < ROWS) || !uint(v.col, COLS - 1) || !finite(v.clock, 1) || !finite(v.grounded, LOCK_DELAY + .1) || !uint(v.resets, MAX_LOCK_RESETS) || !finite(v.elapsed, 99999999)) return false;
  if (v.lastDrop !== null && (!exact(v.lastDrop, ["cells", "distance"]) || !uint(v.lastDrop.distance, ROWS + 2) || !Array.isArray(v.lastDrop.cells) || v.lastDrop.cells.length !== 4 || new Set(v.lastDrop.cells).size !== 4 || !v.lastDrop.cells.every(n => typeof n === "number" && Number.isInteger(n) && n >= -3 * COLS && n < COLS * ROWS))) return false;
  if (!["playing", "cleared", "over", "finished"].includes(v.status as string) || !Array.isArray(v.lastRows) || v.lastRows.length > 4 || new Set(v.lastRows).size !== v.lastRows.length || !v.lastRows.every(r => uint(r, ROWS - 1))) return false;
  const s = v as CargoState;
  return s.event === s.loads && s.lines <= s.loads * 4 && s.canoes >= s.lines && s.canoes <= s.lines * 2 && s.lastBonus <= s.lastRows.length && s.combo <= s.loads && (s.status !== "playing" || fits(s, s.piece, s.row, s.col)) && (s.status !== "cleared" || (s.level !== "endless" && cargoGoalValue(s) >= s.level.target)) && (s.status !== "finished" || s.level === "endless");
}
export const cargoEngine: ArcadeEngine<CargoState, CargoInput, CargoLevel> = { create: createCargo, reduce: cargoTransition, step: cargoStep, result: cargoResult, validate: validCargo };

/** Project the same landing and row totals used by lock(), without changing the board. */
export function cargoRowPreview(s: CargoState) {
  const board = [...s.board], row = landingRow(s), touched = new Set<number>();
  for (const [r,c] of pieceCells(s.piece)) if (row+r >= 0) { board[(row+r)*COLS+s.col+c] = { kind: s.piece.kind, value: s.piece.value, stuck: false }; touched.add(row+r); }
  const target = s.level === "endless" ? 0 : s.level.targetSum;
  return [...touched].sort((a,b) => a-b).map(row => {
    const line = board.slice(row*COLS,(row+1)*COLS), values = line.flatMap(c => c ? [c.value] : []), sum = values.reduce((a,b) => a+b,0), full = values.length === COLS;
    return { row, values, sum, missing: COLS-values.length, canoes: full ? 1 + Number(!!target && sum === target) : 0 };
  });
}