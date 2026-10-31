import { describe, expect, it } from "vitest";
import { engine, solved, workedHint, seaLineRange, type AlgebraState, type AlgebraTask } from "../src/learn/games/treasure-algebra/engine";
import { fractionModel, fractionClue, mixedNumber, type FeastTask } from "../src/learn/games/fraction-feast/engine";
import { changePool, type TideState } from "../src/learn/games/times-tide/engine";
const inequality: AlgebraTask = { kind: "inequality", a: 3, b: 15, extra: 2, answer: 6 };
const algebra = (value: number): AlgebraState => ({ version: 1, level: 5, tasks: Array(5).fill(inequality), index: 0, value, offset: -3, divided: true, helped: false });
describe("numbers 2.5 regressions", () => {
  it("keeps legacy saves and accepts the entire supported inequality solution set", () => {
    for (let value = -20; value <= 100; value++) {
      const s = algebra(value);
      expect(engine.validate(s, { mode: "solo", pace: "hard", stage: "deep" })).toBe(true);
      expect(solved(s)).toBe(2 * value + 3 <= 15);
    }
    expect(solved({ ...algebra(5), divided: false })).toBe(false);
    expect(solved({ ...algebra(5), offset: 0 })).toBe(false);
    expect(workedHint(inequality)).toContain("x ≤ 6");
  });
  it("explains legacy order of operations and the next pattern term", () => {
    expect(workedHint({ kind: "expression", a: 2, b: 3, extra: 4, answer: 14 })).toContain("3 × 4 = 12");
    expect(workedHint({ kind: "expression", a: 2, b: 3, extra: 4, answer: 14 })).toContain("2 + 12 = 14");
    expect(workedHint({ kind: "pattern", a: 2, b: 3, extra: 3, answer: 11 })).toContain("8 + 3 = 11");
  });
  it("keeps the diver and start inside the number line even after overshooting", () => {
    for (const value of [-20, -15, 0, 15, 31, 100]) {
      const range = seaLineRange(value, 11);
      expect(range.min).toBeLessThanOrEqual(Math.min(value, 11));
      expect(range.max).toBeGreaterThanOrEqual(Math.max(value, 11));
    }
  });
  it("uses exactly a denominator of pieces per whole", () => {
    for (let d = 4; d <= 8; d++) {
      const t: FeastTask = { kind: "combine", n: 3, d, extra: d - 1, answer: d + 2 };
      expect(fractionModel(t)).toEqual({ denominator: d, wholes: 2, total: d * 2 });
    }
    expect(fractionModel({ kind: "equivalent", n: 2, d: 3, extra: 3, answer: 6 })).toEqual({ denominator: 9, wholes: 1, total: 9 });
    expect(mixedNumber(8, 7)).toBe("1 1/7");
    expect(fractionClue({ kind: "decimal", n: 80, d: 100, extra: 2, answer: 80 }, 0)).toContain("0/100");
    expect(fractionClue({ kind: "decimal", n: 80, d: 100, extra: 2, answer: 80 }, 0)).toContain("80/100");
  });
  it("fills an older group in one action and visibly reverses an overfilled share", () => {
    const state: TideState = { version: 1, level: 3, tasks: Array(5).fill({ kind: "table", a: 10, b: 10, total: 100, remainder: 0 }), index: 0, marks: [], answer: "", helped: false };
    expect(changePool(state, 0, "fill").marks).toEqual([10,0,0,0,0,0,0,0,0,0]);
    const share = { ...state, level: 5, tasks: Array(5).fill({ kind: "share", a: 5, b: 7, total: 36, remainder: 1 }), marks: [6,5,5,5,5,5,5,0] };
    expect(changePool(share, 0, "remove").marks[0]).toBe(5);
    expect(changePool({ ...share, marks: [] }, 0, "remove").marks[0]).toBe(0);
  });
});
