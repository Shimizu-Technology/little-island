import type { SpritePose } from "../../poses";
import { landingRow, pieceCells, type CargoState } from "./engine";
/** Match MovingCargo's four cells, active boundary (4), and landing outline (5). */
export function cargoPoses(s: CargoState, cell: number): SpritePose[] {
    const ghost = landingRow(s), visible = s.status === "playing" ? 1 : 0;
    const identity = `${s.loads}:${s.piece.kind}:${s.piece.turn}:${cell}`;
    // Four tiles plus the puzzle renderer's active boundary and discrete landing outline.
    return [...pieceCells(s.piece).map(([r, c]) => ({ x: (s.col + c) * cell, y: (s.row + r) * cell, opacity: visible, identity })),
      { x: s.col * cell, y: s.row * cell, opacity: visible, identity },
      { x: s.col * cell, y: ghost * cell, opacity: visible, snap: true }];
}
