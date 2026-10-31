import { describe, expect, it } from "vitest";
import { COLS, ROWS, LOCK_DELAY, MAX_LOCK_RESETS, cargoEngine, cargoGravity, cargoLevel, cargoLevels, cargoResult, cargoShapes, cargoStep, cargoTransition, createCargo, drawCargo, fits, landingRow, pieceCells, validCargo } from "../src/arcade/games/canoe-cargo/engine";
import { arcadeTransition, emptyArcade, validArcade } from "../src/arcade/progress";
const idle = { type: "idle" } as const;
describe("Canoe Cargo feel rules", () => {
  it("draws seven distinct four-cell shapes per bag and preserves seed and input bags", () => {
    expect([COLS, ROWS]).toEqual([9, 14]); expect(cargoShapes).toHaveLength(7);
    for (const shape of cargoShapes) expect(new Set(shape.map(c => c.join())).size).toBe(4);
    for (let seed = 0; seed < 30; seed++) {
      let a = { seed, bag: [] as number[] }; const shapes = [];
      for (let n = 0; n < 28; n++) { const copy = structuredClone(a); const next = drawCargo(a.seed, a.bag); expect(a).toEqual(copy); shapes.push(next.piece.shape); a = next; }
      for (let n = 0; n < 28; n += 7) expect(new Set(shapes.slice(n, n + 7)).size).toBe(7);
    }
    expect(drawCargo(42, [])).toEqual(drawCargo(42, []));
  });
  it("creates all 56 canonical levels, actual W1 opening and ramped gravity", () => {
    expect(cargoLevels).toHaveLength(56);
    for (const level of cargoLevels) { expect(level.goals).toHaveLength(3); expect(new Set(level.goals).size).toBe(3); expect(validCargo(createCargo(level, 42, false))).toBe(true); }
    const s = createCargo(cargoLevel("w1-1"), 42, false);
    expect(s.board.every(c => !c)).toBe(true); expect(s.level !== "endless" && s.level.target).toBe(4);
    expect(cargoGravity(s)).toBe(.8); expect(cargoLevel("w3-8").fall).toBeCloseTo(.3); expect(cargoLevel("w6-8").fall).toBeCloseTo(.101);
    expect(cargoGravity({ ...s, canoes: 4 })).toBeCloseTo(.68); expect(cargoGravity({ ...s, helper: true })).toBe(1);
  });
  it("gives contact 500ms, ignores failed down input, then locks and spawns atomically", () => {
    let s = createCargo("endless", 42, false); s = { ...s, row: landingRow(s) };
    const board = s.board, queue = s.next[0];
    for (let n = 0; n < 29; n++) { s = cargoTransition(s, { type: "down" }); s = cargoStep(s, idle, 1 / 60); }
    expect(s.loads).toBe(0); expect(s.grounded).toBeCloseTo(LOCK_DELAY - 1 / 60);
    s = cargoStep(s, idle, 1 / 60);
    expect(s.loads).toBe(1); expect(s.event).toBe(1); expect(s.board).not.toBe(board); expect(s.board.filter(Boolean)).toHaveLength(4); expect(s.piece).toEqual(queue); expect(s.row).toBe(0); expect(validCargo(s)).toBe(true);
  });
  it("resets on successful grounded moves/rotation, capped at fifteen; walls never reset", () => {
    let s = createCargo("endless", 42, false); s = { ...s, piece: { shape: 1, turn: 0, kind: "fish", value: 1 }, row: 12, grounded: .4 };
    for (let n = 0; n < MAX_LOCK_RESETS; n++) { s = cargoTransition({ ...s, grounded: .4 }, { type: n % 2 ? "right" : "left" }); expect(s.grounded).toBe(0); }
    s = cargoTransition({ ...s, grounded: .4 }, { type: "rotate" }); expect(s.resets).toBe(15); expect(s.grounded).toBe(.4);
    const wall = cargoTransition({ ...s, col: 0 }, { type: "left" }); expect(wall.grounded).toBe(.4); expect(wall.resets).toBe(15);
    expect(cargoStep(s, idle, .1).loads).toBe(1);
  });
  it("held soft drop is twenty times gravity, stops on release, and hard drop locks with a trail", () => {
    let a = createCargo(cargoLevel("w1-1"), 42, false), b = cargoTransition(a, { type: "soft", value: true });
    for (let n = 0; n < 12; n++) { a = cargoStep(a, idle, 1 / 60); b = cargoStep(b, idle, 1 / 60); }
    expect(a.row).toBe(0); expect(b.row).toBe(5);
    b = cargoTransition(b, { type: "soft", value: false }); const row = b.row; b = cargoStep(b, idle, .1); expect(b.row).toBe(row);
    const next = cargoTransition(a, { type: "drop" }); expect(next.loads).toBe(1); expect(next.lastDrop?.distance).toBeGreaterThan(10); expect(next.lastDrop?.cells).toHaveLength(4);
  });
  it("clears four rows in the same lock and counts exact score, crates, and ghost landing", () => {
    let s = createCargo("endless", 42, false);
    s = { ...s, piece: { shape: 0, turn: 1, kind: "fish", value: 1 }, col: 4, board: s.board.map((_, i) => Math.floor(i / COLS) >= ROWS - 4 && i % COLS !== 4 ? { kind: "crate", value: 1, stuck: true } : null) };
    expect(landingRow(s)).toBe(10);
    const next = cargoTransition(s, { type: "drop" }); expect(next.lines).toBe(4); expect(next.freed).toBe(32); expect(next.score).toBe(565); expect(next.board.every(c => !c)).toBe(true); expect(validCargo(next)).toBe(true);
  });
  it("uses honest sum bonuses and keeps all number voyages untimed with Helper off or on", () => {
    for (const helper of [false, true]) {
      let s = createCargo(cargoLevel("learn-1"), 42, helper), copy = structuredClone(s);
      for (let n = 0; n < 10000; n++) s = cargoStep(s, idle, 1 / 60); expect(s).toEqual(copy);
      s = { ...s, piece: { shape: 0, turn: 0, kind: "fish", value: 1 }, col: 5, board: Array.from({ length: COLS * ROWS }, (_, i) => i >= 117 && i % COLS < 5 ? { kind: "crate", value: 1, stuck: true } : null) };
      const next = cargoTransition(s, { type: "drop" }); expect(next.lastBonus).toBe(1); expect(next.canoes).toBe(2); expect(next.helped).toBeFalsy();
      const missed = cargoTransition({ ...s, piece: { ...s.piece, value: 2 } }, { type: "drop" }); expect(missed.lastBonus).toBe(0); expect(missed.helped).toBe(true);
    }
  });
  it.each([false, true])("allows one Hold swap per piece with Helper=%s, preserving the bag and reserved orientation", helper => {
    const start = createCargo("endless", 42, helper), s = cargoTransition(start, { type: "hold" });
    expect(s.held).toEqual(start.piece); expect(s.piece).toEqual(start.next[0]); expect(cargoTransition(s, { type: "hold" })).toBe(s);
    const next = cargoTransition(s, { type: "drop" }); expect(next.piece).toEqual(s.next[0]); expect(next.held).toEqual(start.piece); expect(next.holdUsed).toBe(false); expect(validCargo(next)).toBe(true);
    const swapped = cargoTransition({ ...next, piece: { ...next.piece, turn: 1 } }, { type: "hold" });
    expect(swapped.piece).toEqual(start.piece); expect(swapped.held?.turn).toBe(0); expect(swapped.next).toEqual(next.next); expect(swapped.bag).toEqual(next.bag); expect(swapped.seed).toBe(next.seed); expect(validCargo(swapped)).toBe(true);
    expect(cargoTransition(swapped, { type: "hold" })).toBe(swapped);
  });
  it.each([false, true])("tops out with Helper=%s, freezes terminal state, and retries freshly", helper => {
    let s = createCargo("endless", 42, helper);
    for (let n = 0; n < 100 && s.status === "playing"; n++) s = cargoTransition(s, { type: "drop" });
    expect(s.status).toBe("over"); expect(cargoResult(s)).toMatchObject({ outcome: "game-over", stars: 0 }); expect(cargoStep(s, idle, 1 / 60)).toBe(s); expect(cargoTransition(s, { type: "drop" })).toBe(s);
    expect(createCargo("endless", 42, helper).loads).toBe(0);
    expect(cargoResult(cargoTransition(createCargo("endless", 42, helper), { type: "finish" }))).toMatchObject({ outcome: "stopped", stars: 0 });
  });
  it("guards malformed input, counterfeit levels and runtime data", () => {
    const s = createCargo(cargoLevel("w1-1"), 42, false);
    for (const dt of [NaN, Infinity, -1, 0, 1]) expect(cargoStep(s, idle, dt)).toBe(s);
    for (const input of [null, { type: "invalid" }, { type: "helper", value: 1 }]) expect(cargoTransition(s, input as never)).toBe(s);
    for (const value of [null, {}, { ...s, extra: 1 }, { ...s, board: [] }, { ...s, bag: [1, 1] }, { ...s, resets: 16 }, { ...s, grounded: NaN }, { ...s, soft: 1 }, { ...s, elapsed: Infinity }, { ...s, level: { ...cargoLevel("w1-1"), target: 0 } }, { ...s, next: [s.piece] }, { ...s, lastDrop: { cells: [1, 1, 1, 1], distance: 3 } }]) expect(validCargo(value)).toBe(false);
    expect(() => cargoLevel("w1-9" as never)).toThrow();
    expect(fits(s, s.piece, s.row, s.col)).toBe(true); expect(pieceCells(s.piece)).toHaveLength(4); expect(cargoEngine.validate!(s)).toBe(true);
  });
  it("awards stars only at fixture load tiers and keeps earned progress on loss", () => {
    const s = createCargo(cargoLevel("w1-1"), 42, false), par = cargoLevel("w1-1").par;
    for (const [loads, stars] of [[par, 3], [par + 1, 2], [par + 4, 2], [par + 5, 1]]) expect(cargoResult({ ...s, loads, status: "cleared" })?.stars).toBe(stars);
    const action = { type: "finish", game: "canoe-cargo", level: "w1-1", stars: 3, score: 500, round: "cargo-fixture", name: "QA" } as const;
    const saved = arcadeTransition(emptyArcade(), "family", action), lost = arcadeTransition(saved, "family", { ...action, round: "cargo-loss", stars: 0, score: 600 });
    expect(validArcade(lost)).toBe(true); expect(lost.people.family.games["canoe-cargo"]?.stars["w1-1"]).toBe(3); expect(lost.people.family.games["canoe-cargo"]?.best).toBe(600); expect(arcadeTransition(saved, "family", action)).toBe(saved);
  });
});

describe("soft drop timing", () => {
  it("pressing soft drop mid-interval never spends banked normal-gravity time at soft-drop speed", () => {
    let s = cargoTransition(createCargo(cargoLevel("w1-1"), 7, false), { type: "idle" } as never);
    s = { ...s, status: "playing" };
    for (let i = 0; i < 42; i++) s = cargoStep(s, { type: "idle" } as never, 1 / 60); // ~700 ms at normal gravity
    const before = s.row;
    const soft = cargoTransition(s, { type: "soft", value: true });
    expect(soft.clock).toBe(0);
    const after = cargoStep(soft, { type: "idle" } as never, 1 / 60);
    expect(after.row - before).toBeLessThanOrEqual(1);
    const released = cargoTransition(after, { type: "soft", value: false });
    expect(released.clock).toBe(0);
    expect(cargoTransition(released, { type: "soft", value: false })).toBe(released);
  });
});

describe("Cargo result stats match the voyage", () => {
  it("omits crate stats when the level has no trapped crates or tide", () => {
    const s = createCargo(cargoLevel("w1-1"), 42, false);
    expect(cargoResult({ ...s, status: "cleared" })?.detail).not.toContain("crates freed");
  });
  it("keeps crate stats for crate voyages and whenever a crate was freed", () => {
    const s = createCargo(cargoLevel("w2-1"), 42, false);
    expect(cargoResult({ ...s, status: "over" })?.detail).toContain("0 crates freed");
    expect(cargoResult({ ...createCargo("endless", 42, false), status: "finished", freed: 2 })?.detail).toContain("2 crates freed");
  });
});
