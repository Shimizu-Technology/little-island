import { describe, expect, it } from "vitest";
import { nextRandom } from "../src/arcade";
import { createReef, placementCells, reefLevel, reefTransition, type ReefState } from "../src/arcade/games/reef-builder/engine";
import { cargoLevel, cargoTransition, COLS, createCargo, validCargo, type CargoState } from "../src/arcade/games/canoe-cargo/engine";

/** Wrong learning answers must turn a later finish into helped practice, never independent credit. */
describe("learning-world credit", () => {
  it("Reef Builder: a sum that would pass 10 marks the round helped; a legal placement does not", () => {
    const s = createReef(reefLevel("learn-1"), 1, false);
    expect(s.helped).toBeFalsy();
    let rejected: ReefState | null = null, legal: ReefState | null = null;
    s.pieces.forEach((piece, slot) => {
      if (!piece) return;
      for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
        const open = placementCells({ ...s, level: "endless" }, piece, row, col), allowed = placementCells(s, piece, row, col);
        if (open && !allowed && !rejected) rejected = reefTransition(s, { type: "place", slot, row, col });
        if (allowed && !legal) legal = reefTransition(s, { type: "place", slot, row, col });
      }
    });
    expect(rejected).not.toBeNull();
    expect(rejected!.helped).toBe(true);
    expect(rejected!.moves).toBe(0);
    expect(legal!.helped).toBeFalsy();
    // A spot blocked by other coral (not the sum) is not a wrong answer.
    const piece = s.pieces.find(Boolean)!, slot = s.pieces.indexOf(piece);
    const filled = s.board.findIndex(Boolean);
    expect(reefTransition(s, { type: "place", slot, row: Math.floor(filled / 8), col: filled % 8 }).helped).toBeFalsy();
  });

  it("Canoe Cargo: a full learning row that misses the target marks the round helped", () => {
    let mismatches = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s: CargoState = createCargo(cargoLevel("learn-2"), seed, false), rng = seed, missed = false;
      for (let i = 0; i < 400 && s.status === "playing"; i++) {
        let n: number; [rng, n] = nextRandom(rng);
        const moves = Math.floor(n * COLS) - 4;
        for (let m = 0; m < Math.abs(moves); m++) s = cargoTransition(s, { type: moves < 0 ? "left" : "right" });
        s = cargoTransition(s, { type: "drop" });
        if (s.lastRows.length) {
          if (s.lastBonus < s.lastRows.length) missed = true;
        }
        expect(!!s.helped).toBe(missed);
        expect(validCargo(s)).toBe(true);
      }
      if (missed) mismatches++;
    }
    expect(mismatches).toBeGreaterThan(0);
  });
});
