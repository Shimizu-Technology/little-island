import { describe, expect, it } from "vitest";
import { allLevelIds } from "../src/arcade/types";
import { clearLines, createReef, hasReefMove, legalReefMoves, placementCells, previewReefPlacement, reefLevel, reefLevels, reefResult, reefTransition, SHAPES, validReef } from "../src/arcade/games/reef-builder/engine";
import { reefDrag, reefGrab } from "../src/arcade/games/reef-builder/geometry";
describe("Reef feel and planning", () => {
  it("has 56 playable levels; W1 requires planning after a varied opening tray", () => {
    expect(reefLevels.map(l => l.id)).toEqual(allLevelIds);
    for (const level of reefLevels) {
      const s = createReef(level, 42, false); expect(validReef(s)).toBe(true); expect(hasReefMove(s)).toBe(true); expect(level.greatMoves).toBeLessThan(level.goodMoves); expect(level.goals).toHaveLength(3);
    }
    const s = createReef(reefLevel("w1-1"), 42); expect(s.helper).toBe(false); expect(s.level !== "endless" && s.level.target).toBe(3);
    expect(s.board.filter(Boolean)).toHaveLength(3); expect(new Set(s.pieces.map(p => JSON.stringify(p?.cells))).size).toBe(3);
    for (const m of legalReefMoves(s)) expect(reefTransition(s, { type: "place", ...m }).status).toBe("playing");
  });
  it("previews exactly the cells, clears and fish used by the placement without mutation", () => {
    for (const level of reefLevels) {
      const s = createReef(level, 42), original = structuredClone(s);
      for (const m of legalReefMoves(s).filter((_, i) => i % 8 === 0)) {
        const preview = previewReefPlacement(s, s.pieces[m.slot]!, m.row, m.col)!;
        const t = reefTransition(s, { type: "place", ...m }); expect(t.lastClear).toEqual(preview.clear.cells); expect(t.lines - s.lines).toBe(preview.clear.count); expect(t.lastFishCells.every(i => t.lastClear.includes(i))).toBe(true); expect(validReef(t)).toBe(true);
      }
      expect(s).toEqual(original);
    }
  });
  it("clears crossing rows and columns once, and retains fish origins after removal", () => {
    const s = createReef("endless", 42), board = Array(64).fill(0);
    for (let i = 0; i < 8; i++) { board[24 + i] = 1; board[i * 8 + 4] = 1; } board[28] = 0;
    expect(clearLines(board).count).toBe(0);
    const t = reefTransition({ ...s, board, fish: [24, 4], pieces: [{ cells: SHAPES[0], value: 1, color: 1 }, s.pieces[1], s.pieces[2]] }, { type: "place", slot: 0, row: 3, col: 4 });
    expect(t.lines).toBe(2); expect(t.lastClear).toHaveLength(15); expect(t.lastFishCells).toEqual([24, 4]); expect(t.lastFish).toBe(2); expect(t.board.every(n => !n)).toBe(true); expect(t.lastPoints).toBe(270); expect(t.event).toBe(1);
  });
  it.each([false, true])("no-fit is terminal with Helper=%s even if empty cells remain", helper => {
    // A checkerboard leaves 32 isolated spaces. The remaining horizontal domino cannot fit.
    const s = createReef("endless", 42, helper), board = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) + i % 8) % 2 ? 1 : 0);
    const ready = { ...s, board, appearance: board.map(n => n ? 1 : -1), fish: [], pieces: [{ cells: SHAPES[0], value: 1, color: 1 }, { cells: SHAPES[1], value: 1, color: 2 }, null] };
    const t = reefTransition(ready, { type: "place", slot: 0, row: 0, col: 0 });
    expect(t.status).toBe("full"); expect(t.board.some(n => !n)).toBe(true); expect(validReef(t)).toBe(true); expect(reefResult(t)).toMatchObject({ outcome: "game-over", stars: 0 });
    expect(reefTransition(t, { type: "helper", value: true })).toBe(t); expect(reefTransition(t, { type: "reroll", slot: 1 })).toBe(t); expect(createReef("endless", 42, helper).moves).toBe(0);
  });
  it("Helper never changes pieces, while a legal hint remains available", () => {
    const s = createReef(reefLevel("w1-1"), 42, true); expect(reefTransition(s, { type: "reroll", slot: 0 })).toBe(s);
    expect(legalReefMoves(s)[0]).toBeDefined(); expect(reefTransition(s, { type: "helper", value: false }).pieces).toBe(s.pieces);
  });
  it("number reefs make ten with real arithmetic and have no time input", () => {
    const s = createReef(reefLevel("learn-1"), 42, false);
    const t = reefTransition(s, { type: "place", slot: 0, row: 7, col: 1 }); expect(t.lines).toBe(1); expect(t.status).toBe("playing"); expect(t.rescued).toBe(1);
    expect(placementCells(s, { cells: SHAPES[0], value: 7, color: 1 }, 7, 1)).toBeNull();
    expect(reefTransition({ ...s, pieces: [{ cells: SHAPES[0], value: 7, color: 1 }, null, null] }, { type: "place", slot: 0, row: 7, col: 1 }).helped).toBe(true);
  });
  it("makes rocks permanent and excludes blocked lines from previews and clears", () => {
    const level = reefLevel("w6-8"), s = createReef(level, 42);
    expect(level.rocks.length).toBeGreaterThan(reefLevel("w4-1").rocks.length);
    for (const i of level.rocks) expect(s.board[i]).toBe(9);
    const board = Array(64).fill(1); level.rocks.forEach(i => { board[i] = 9; });
    expect(clearLines(board, undefined, level.rocks).cells.some(i => level.rocks.includes(i))).toBe(false);
  });
  it("rejects injected fields, changed level rules, duplicate origins and invalid coordinates", () => {
    const s = createReef(reefLevel("w1-1"), 42);
    for (const value of [null, {}, { ...s, injected: true }, { ...s, board: [] }, { ...s, pieces: [null, null, null] }, { ...s, seed: NaN }, { ...s, level: { ...reefLevel("w1-1"), target: 0 } }, { ...s, lastClear: [1, 1] }, { ...s, lastFishCells: [1] }, { ...s, pieces: [{ ...s.pieces[0], value: 99 }, null, null] }, { ...s, status: "cleared" }, { ...s, status: "full" }]) expect(validReef(value)).toBe(false);
    for (const input of [null, { type: "wat" }, { type: "helper", value: 1 }, { type: "place", slot: NaN, row: 0, col: 0 }]) expect(reefTransition(s, input as never)).toBe(s);
    expect(reefTransition(s, { type: "place", slot: 0, row: NaN, col: 0 }).moves).toBe(0);
  });
  it("anchors any grabbed occupied cell at board scale and uses identical snap/drop mapping", () => {
    for (const cell of [24, 44, 72]) for (const shape of SHAPES) for (const [row, col] of shape) {
      const anchor = reefGrab(shape, (col + .3) * 27, (row + .7) * 27, 27); expect(anchor.row).toBe(row); expect(anchor.col).toBe(col);
      const rect = { x: 15, y: 80, cell }, pointer = { x: rect.x + (2 + col + .3) * cell, y: rect.y + (3 + row + .7) * cell + 72 };
      const spot = reefDrag(pointer.x, pointer.y, rect, anchor); expect(spot.row).toBe(3); expect(spot.col).toBe(2); expect(spot.left).toBeCloseTo(rect.x + 2 * cell); expect(spot.top).toBeCloseTo(rect.y + 3 * cell);
    }
  });
});
