import "../../src/learn/engines";
import { describe, expect, it } from "vitest";
import { advance, complete, correct, engine, route, taskAt } from "../../src/learn/games/tide-logic/engine";
import type { LearnOptions } from "../../src/learn/types";
const options = (level: number): LearnOptions => ({ mode: "solo", pace: level === 1 ? "easy" : level === 2 ? "medium" : "hard", ...(level === 4 ? { stage: "stretch" } : level === 5 ? { stage: "deep" } : {}) });
describe("Tide Logic", () => {
  for (let level = 1; level <= 5; level++) it(`plays and validates level ${level}`, () => {
    const o = options(level), s = engine.create(o, { skills: {}, rng: () => .42, starter: 0, today: 0 });
    expect(s.level).toBe(level); expect(engine.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
    let state = s;
    for (let task = 0; task < 4; task++) {
      const t = taskAt(level, state.seed, task);
      expect(t.items.length).toBeGreaterThanOrEqual(4);
      state = { ...state, rule: t.target };
      expect(correct(state)).toBe(true);
      expect(t.items.every((item) => route(item, state.rule) === route(item, t.target))).toBe(true);
      state = { ...state, running: 0 };
      expect(engine.validate(state, o)).toBe(true);
      for (let i = 0; i <= t.items.length; i++) state = advance(state);
      expect(engine.validate(state, o)).toBe(true);
    }
    expect(complete(state)).toBe(true); expect(engine.outcome(state, o)).toBe("done");
    expect(engine.validate({ ...state, seed: -1 }, o)).toBe(false);
    expect(engine.validate({ ...state, rule: { ...state.rule, extra: 1 } }, o)).toBe(false);
  });
  it("grows from one clue to two and introduces events", () => {
    expect(taskAt(1, 2, 0).slots.length).toBe(2);
    expect(taskAt(3, 2, 0).slots.length).toBe(4);
    expect(taskAt(4, 2, 0).target.first).toBe("bell");
    expect(taskAt(4, 2, 0).target.join).toBe("then");
    expect(taskAt(4, 2, 0).slots.length).toBe(4);
    expect(taskAt(5, 2, 0).slots.length).toBe(4);
  });
});
