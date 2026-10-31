import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import { optionsAtLevel } from "../src/learn/levels";
import type { LearnEngine, LearnOptions } from "../src/learn/types";
import { engine as tide, solved as tideSolved, } from "../src/learn/games/times-tide/engine";
import { engine as feast, } from "../src/learn/games/fraction-feast/engine";
import { engine as algebra, solved as algebraSolved, } from "../src/learn/games/treasure-algebra/engine";
const ctx = (seed: number) => ({ rng: random(seed), skills: {}, starter: 0 as const, today: 21000 });
const option = (level: 1|2|3|4|5): LearnOptions => optionsAtLevel({ mode: "solo", pace: "easy" }, level);
const cases = [tide, feast, algebra] as LearnEngine<unknown>[];
describe("2.3 Numbers generated rounds", () => {
  for (const engine of cases) for (const level of [1,2,3,4,5] as const) it(`${engine.id} level ${level} is deterministic, distinct and recoverable`, () => {
    const o = option(level);
    const first = engine.create(o, ctx(17));
    expect(first).toEqual(engine.create(o, ctx(17)));
    expect(engine.validate(first, o)).toBe(true);
    expect(engine.validate(JSON.parse(JSON.stringify(first)), o)).toBe(true);
    expect(engine.outcome(first, o)).toBeNull();
    expect((first as {tasks: unknown[]}).tasks).toHaveLength(5);
    expect(new Set((first as {tasks: unknown[]}).tasks.map(x => JSON.stringify(x))).size).toBe(5);
    expect(engine.validate(first, option(level === 5 ? 4 : level+1 as 1|2|3|4|5))).toBe(false);
    expect(engine.validate({ ...(first as object), version: 3 }, o)).toBe(false);
    expect(engine.validate({ ...(first as object), extra: true }, o)).toBe(false);
    expect(engine.validate({ ...(first as object), tasks: [{ kind: "bad" }] }, o)).toBe(false);
    const tasks = (first as { tasks: object[] }).tasks;
    expect(engine.validate({ ...(first as object), tasks: [{ ...tasks[0], tampered: true }, ...tasks.slice(1)] }, o)).toBe(false);
    expect(engine.validate({ ...(first as object), index: 99 }, o)).toBe(false);
    const finished = { ...(first as object), index: 5, ...(engine === tide ? { marks: [], answer: "" } : engine === feast ? { pieces: 0 } : { value: 0, offset: 0, divided: false }) };
    expect(engine.validate(finished, o)).toBe(true);
    expect(engine.outcome(finished, o)).toBe("done");
  });
  it("accepts earlier generated tasks while new rounds use narrower visuals", () => {
    const oldTide = tide.create(option(5), ctx(1));
    expect(tide.validate({ ...oldTide, tasks: [{ kind: "area", a: 20, b: 5, total: 100, remainder: 0 }, ...oldTide.tasks.slice(1)] }, option(5))).toBe(true);
    const oldLine = feast.create(option(2), ctx(1));
    expect(feast.validate({ ...oldLine, tasks: [{ kind: "line", n: 5, d: 8, extra: 0, answer: 5 }, ...oldLine.tasks.slice(1)] }, option(2))).toBe(true);
    const oldFold = feast.create(option(3), ctx(1));
    expect(feast.validate({ ...oldFold, tasks: [{ kind: "equivalent", n: 4, d: 5, extra: 3, answer: 12 }, ...oldFold.tasks.slice(1)] }, option(3))).toBe(true);
    const oldAlgebra = algebra.create(option(5), ctx(1));
    expect(algebra.validate({ ...oldAlgebra, version: 1, tasks: [2,3,4,5,6].map(answer => ({ kind: "inequality", a: 3, b: answer * 2 + 3, extra: 2, answer })) }, option(5))).toBe(true);
  });
  it("level mechanics increase in scope", () => {
    const seed = 21;
    const tideKinds = [1,2,3,4,5].map(level => tide.create(option(level as 1|2|3|4|5), ctx(seed)).tasks[0].kind);
    const feastKinds = [1,2,3,4,5].map(level => feast.create(option(level as 1|2|3|4|5), ctx(seed)).tasks[0].kind);
    const algebraKinds = [1,2,3,4,5].map(level => algebra.create(option(level as 1|2|3|4|5), ctx(seed)).tasks[0].kind);
    expect(new Set(tideKinds).size).toBe(5);
    expect(new Set(feastKinds).size).toBe(5);
    expect(new Set(algebraKinds).size).toBe(5);
    const t1 = tide.create(option(1),ctx(seed)).tasks[0], t4 = tide.create(option(4),ctx(seed)).tasks[0], t5 = tide.create(option(5),ctx(seed)).tasks[0];
    expect(t1.a).toBeLessThanOrEqual(4); expect(t4.a).toBeGreaterThanOrEqual(11); expect(t5.kind).toBe("share");
    const f1 = feast.create(option(1),ctx(seed)).tasks[0], f5 = feast.create(option(5),ctx(seed)).tasks[0];
    expect(f1.d).toBeLessThanOrEqual(4); expect(f5.d).toBe(100);
    const a4 = algebra.create(option(4),ctx(seed)).tasks[0], a5 = algebra.create(option(5),ctx(seed)).tasks[0];
    expect(a4.extra).toBe(1); expect(a5.extra).toBeGreaterThan(1);
    expect(feast.create(option(4),ctx(seed)).tasks.map(t => t.kind)).toContain("subtract");
    expect(algebra.create(option(5),ctx(seed)).tasks.map(t => t.kind)).toContain("substitution");
    expect(new Set(feast.create(option(5),ctx(seed)).tasks.map(t => t.extra))).toEqual(new Set([0,1,2]));
  });
  it("each generator produces solvable arithmetic over many seeds", () => {
    for (let seed = 1; seed <= 100; seed++) for (const level of [1,2,3,4,5] as const) {
      const o = option(level), a = tide.create(o, ctx(seed)), f = feast.create(o, ctx(seed)), g = algebra.create(o, ctx(seed));
      expect(a.tasks).toHaveLength(5); expect(f.tasks).toHaveLength(5); expect(g.tasks).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        const t = a.tasks[i]; const marks = t.kind === "share" ? [...Array(t.b).fill(t.a), t.remainder] : t.kind === "area" ? [Math.floor(t.a/10)*10*t.b,(t.a%10)*t.b] : Array(t.a).fill(t.b);
        expect(tideSolved({ ...a, index: i, marks, answer: String(t.total) })).toBe(true);
        expect(feast.validate({ ...f, index: i, pieces: f.tasks[i].answer }, o)).toBe(true);
        const at = g.tasks[i]; expect(algebraSolved({ ...g, index: i, value: at.answer, offset: ["balance","two-step","inequality"].includes(at.kind) ? -at.a : 0, divided: at.extra > 1 && ["two-step","inequality"].includes(at.kind) })).toBe(true);
      }
    }
  });
});
