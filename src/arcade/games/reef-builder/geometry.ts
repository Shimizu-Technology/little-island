export type ReefAnchor = { row: number; col: number; x: number; y: number };
export type ReefRect = { x: number; y: number; cell: number };
/** Anchor an occupied cell, retaining the precise fraction grabbed inside it. */
export function reefGrab(cells: readonly (readonly [number, number])[], x: number, y: number, cell: number): ReefAnchor {
  "worklet";
  let best = cells[0], distance = Infinity;
  for (const p of cells) { const d = (x / cell - p[1] - .5) ** 2 + (y / cell - p[0] - .5) ** 2; if (d < distance) { distance = d; best = p; } }
  return { row: best[0], col: best[1], x: Math.max(0, Math.min(1, x / cell - best[1])), y: Math.max(0, Math.min(1, y / cell - best[0])) };
}
/** One transform for the lifted art, preview and final drop; positions use board-cell units. */
export function reefDrag(x: number, y: number, board: ReefRect, anchor: ReefAnchor, lift = 72) {
  "worklet";
  const left = x - (anchor.col + anchor.x) * board.cell, top = y - lift - (anchor.row + anchor.y) * board.cell;
  return { left, top, row: Math.round((top - board.y) / board.cell), col: Math.round((left - board.x) / board.cell) };
}
