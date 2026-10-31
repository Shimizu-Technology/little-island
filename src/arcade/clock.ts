export const FIXED_DT = 1 / 60;
export const MAX_FRAME = .1;
export type FixedClock = { remainder: number; ticks: number; dropped: number };
/** Clamp background stalls. Never catch up seconds of unplayed simulation on resume. */
export function advanceClock(clock: FixedClock, elapsed: number): { clock: FixedClock; steps: number } {
  "worklet";
  if (!Number.isFinite(elapsed) || elapsed <= 0) return { clock, steps: 0 };
  const safe = Math.min(MAX_FRAME, elapsed), accumulated = clock.remainder + safe;
  const steps = Math.min(6, Math.floor((accumulated + 1e-10) / FIXED_DT));
  return { steps, clock: { remainder: Math.max(0, accumulated - steps * FIXED_DT), ticks: clock.ticks + steps, dropped: clock.dropped + Math.max(0, elapsed - safe) } };
}
export type Swipe = "up" | "down" | "left" | "right";
export function swipeDirection(dx: number, dy: number, threshold = 24): Swipe | null {
  "worklet";
  if (![dx, dy].every(Number.isFinite) || Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up";
}
export type BoardRect = { x: number; y: number; width: number; height: number };
/** Pointer is the top-left cell's center, giving touch and accessible tap the same pure rule. */
export function snapDrop(x: number, y: number, board: BoardRect, rows: number, cols: number): { row: number; col: number } | null {
  if (![x, y, board.x, board.y, board.width, board.height].every(Number.isFinite) || board.width <= 0 || board.height <= 0 || !Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) return null;
  const col = Math.floor((x - board.x) / (board.width / cols)), row = Math.floor((y - board.y) / (board.height / rows));
  return row < 0 || row >= rows || col < 0 || col >= cols ? null : { row, col };
}
