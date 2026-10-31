import { describe, expect, it } from "vitest";
import { cargoTouch, cargoTap, cargoSpeed } from "../src/arcade/games/canoe-cargo/gestures";
import { createCargo, cargoTransition, fits, validCargo, pieceCells, landingRow, type CargoState } from "../src/arcade/games/canoe-cargo/engine";
import { createReef, reefTransition, validReef, migrateReef, reefLevel, SHAPES } from "../src/arcade/games/reef-builder/engine";

describe("Cargo mobile manipulation", () => {
  it("rotates one successful stationary contact, never a cancelled gesture, drag or flick", () => {
    expect(cargoTap(0, false, true)).toBe(true); expect(cargoTap(8, false, true)).toBe(true);
    expect(cargoTap(0, false, false)).toBe(false); expect(cargoTap(9, false, true)).toBe(false); expect(cargoTap(0, true, true)).toBe(false);
  });
  it("tracks every crossed column in either direction, independent of the grab offset", () => {
    for (const cell of [18, 29, 43]) for (const col of [-3, -2, -1, 0, 1, 2, 3]) {
      expect(cargoTouch(col * cell, 0, 500, cell, 0).columns).toBe(col);
      expect(cargoTouch(col * cell + cell * .2, 0, 500, cell, 0).columns).toBe(col);
    }
  });
  it("recognizes a short fast flick even before the fitted gesture velocity has enough samples", () => {
    const speed = cargoSpeed(60, 24, 20, 0); expect(speed).toBe(1800);
    expect(cargoTouch(0, 60, 40, 30, speed).flick).toBe(true);
    expect(cargoTouch(0, 60, 600, 30, cargoSpeed(60, 54, 60, 0)).flick).toBe(false);
  });
  it("distinguishes held slow pulls from deliberate flicks, requiring distance and two velocity measures", () => {
    expect(cargoTouch(0, 30, 360, 30, 85)).toMatchObject({ soft: true, flick: false });
    expect(cargoTouch(0, 120, 1200, 30, 1000).flick).toBe(false);
    expect(cargoTouch(0, 50, 35, 30, 1500).flick).toBe(true);
    expect(cargoTouch(0, 40, 20, 30, 2000).flick).toBe(false);
    expect(cargoTouch(70, 50, 35, 30, 1500).flick).toBe(false);
    expect(cargoTouch(0, 50, 35, 30, 300).flick).toBe(false);
    expect(cargoTouch(30, 5, 300, 30, 10).soft).toBe(false);
  });
  it("returns all seven bundles to their exact cells and origin after four turns in free space", () => {
    for (let shape = 0; shape < 7; shape++) {
      let s: CargoState = { ...createCargo("endless", 42, false), piece: { shape, turn: 0, kind: "fish" as const, value: 1 }, row: 5, col: 3 };
      const before = structuredClone(s);
      for (let i = 0; i < 4; i++) s = cargoTransition(s, { type: "rotate" });
      expect([s.row, s.col, pieceCells(s.piece)]).toEqual([before.row, before.col, pieceCells(before.piece)]);
      expect(s.board).toEqual(before.board); expect(validCargo(s)).toBe(true);
    }
  });
  it("uses ordered T floor and wall kicks, and a separate I floor kick", () => {
    const start = createCargo("endless", 42, false);
    const t = { ...start, piece: { shape: 2, turn: 0, kind: "fish" as const, value: 1 }, row: 12, col: 3, grounded: .4 };
    const floor = cargoTransition(t, { type: "rotate" });
    expect([floor.row, floor.col, floor.piece.turn, floor.resets, floor.grounded]).toEqual([11, 3, 1, 1, 0]);
    const wall = cargoTransition({ ...t, row: 4, col: 0, piece: { ...t.piece, turn: 1 } }, { type: "rotate" });
    expect([wall.row, wall.col, wall.piece.turn]).toEqual([5, 0, 2]);
    const i = cargoTransition({ ...t, row: 13, piece: { ...t.piece, shape: 0 } }, { type: "rotate" });
    expect([i.row, i.col, i.piece.turn]).toEqual([10, 6, 1]); expect(fits(i, i.piece, i.row, i.col)).toBe(true);
  });
  it("rejects a fully blocked rotation without a lock reset, and tops out a hidden lock", () => {
    const start = createCargo("endless", 42, false);
    const piece = { shape: 2, turn: 0, kind: "fish" as const, value: 1 }, occupied = pieceCells(piece).map(([r, c]) => (r + 6) * 9 + c + 3);
    const board = start.board.map((_, i) => occupied.includes(i) ? null : { kind: "crate" as const, value: 1, stuck: false });
    const blocked = { ...start, piece, row: 6, col: 3, board, grounded: .4 };
    const rotated = cargoTransition(blocked, { type: "rotate" });
    expect(rotated.piece).toEqual(piece); expect(rotated.resets).toBe(0); expect(rotated.grounded).toBe(.4); expect(rotated.bump).toBe(1);
    const ceiling = { ...start, piece: { ...piece, shape: 0, turn: 1 }, row: -3, col: 3, board: start.board.map((_, i) => i >= 9 ? { kind: "crate" as const, value: 1, stuck: false } : null) };
    expect(landingRow(ceiling)).toBe(-3);
    const over = cargoTransition(ceiling, { type: "drop" }); expect(over.status).toBe("over"); expect(over.board).toEqual(ceiling.board); expect(validCargo(over)).toBe(true);
  });
});

describe("Reef appearance identity and legacy upgrade", () => {
  it("keeps all tray appearances on placement, preserving independent number values", () => {
    for (let color = 0; color < 4; color++) {
      const s = createReef("endless", 42), piece = { cells: SHAPES[3], value: 7, color };
      const next = reefTransition({ ...s, pieces: [piece, null, null] }, { type: "place", slot: 0, row: 3, col: 2 });
      for (const i of [26, 27, 28]) { expect(next.board[i]).toBe(7); expect(next.appearance[i]).toBe(color); }
      expect(validReef(next)).toBe(true); expect(s.appearance.every(n => n === -1)).toBe(true);
    }
  });
  it("clears appearance with its cells and retains the other pieces' appearances", () => {
    const s = createReef(reefLevel("learn-1"), 42), t = reefTransition(s, { type: "place", slot: 0, row: 7, col: 1 });
    expect(t.lastClear).toEqual([56, 57]); expect(t.appearance[56]).toBe(-1); expect(t.appearance[57]).toBe(-1); expect(validReef(t)).toBe(true);
  });
  it("upgrades old states without mutating their originals, preserving their previous visible appearance", () => {
    const s = createReef(reefLevel("w4-1"), 42), { version: _v, appearance: _a, ...legacy } = s;
    const original = structuredClone(legacy), migrated = migrateReef(legacy)!;
    expect(validReef(legacy)).toBe(false); expect(validReef(migrated)).toBe(true); expect(migrated.appearance).toEqual(s.appearance);
    expect(legacy).toEqual(original); expect(migrateReef(migrated)).toBe(migrated);
    for (const bad of [{ ...legacy, injected: true }, { ...legacy, board: [] }, { ...legacy, pieces: [] }, { ...s, version: 3 }, { ...s, appearance: s.appearance.map(() => 4) }, { ...s, appearance: s.appearance.map(() => -1) }, { ...s, appearance: [] }]) expect(migrateReef(bad)).toBeNull();
  });
});
