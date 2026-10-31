import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/puzzle-feel.json";
import { cargoLevel, cargoResult, cargoTransition, createCargo, validCargo } from "../src/arcade/games/canoe-cargo/engine";
import { createReef, reefLevel, reefResult, reefTransition, validReef } from "../src/arcade/games/reef-builder/engine";
import { allLevelIds, type LevelId } from "../src/arcade/types";
describe("deterministic planning receipts for every puzzle level", () => {
  it("covers all 112 levels with fixed seeds and authored par receipts", () => {
    expect(fixtures.cargo.map(f => f.id)).toEqual(allLevelIds); expect(fixtures.reef.map(f => f.id)).toEqual(allLevelIds);
  });
  it.each(fixtures.cargo)("Cargo $id reaches a real clear through packing actions", f => {
    const level = cargoLevel(f.id as LevelId); let s = createCargo(level, f.seed, false);
    for (const m of f.moves) {
      for (let n = 0; n < m.turn; n++) s = cargoTransition(s, { type: "rotate" });
      for (let n = 0; n < 9 && s.col !== m.col; n++) s = cargoTransition(s, { type: s.col < m.col ? "right" : "left" });
      expect(s.col).toBe(m.col); s = cargoTransition(s, { type: "drop" }); expect(validCargo(s)).toBe(true);
    }
    expect(s.loads).toBe(f.loads); expect(s.score).toBe(f.score); expect(s.lines).toBe(f.lines); expect(level.par).toBe(f.loads); expect(cargoResult(s)).toMatchObject({ cleared: true, stars: 3 });
  });
  it.each(fixtures.reef)("Reef $id clears within the fixture-based three-star par", f => {
    const level = reefLevel(f.id as LevelId); let a = createReef(level, f.seed, false), b = createReef(level, f.seed, true);
    for (const move of f.moves) { a = reefTransition(a, { type: "place", ...move }); b = reefTransition(b, { type: "place", ...move }); expect(a.board).toEqual(b.board); expect(validReef(a)).toBe(true); }
    expect(a.moves).toBe(f.count); expect(a.score).toBe(f.score); expect(a.lines).toBe(f.lines); expect(level.greatMoves).toBe(f.count); expect(reefResult(a)).toMatchObject({ cleared: true, stars: 3 });
    expect(reefResult({ ...a, moves: level.goodMoves })?.stars).toBe(2); expect(reefResult({ ...a, moves: level.goodMoves + 1 })?.stars).toBe(1);
  });
});
