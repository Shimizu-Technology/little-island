import "../../src/learn/engines";
import { describe, expect, it } from "vitest";
import { complete, correct, engine, executionPlan, rendered, taskAt } from "../../src/learn/games/code-lab/engine";
import type { LearnOptions } from "../../src/learn/types";
const options = (level: number): LearnOptions => ({ mode: "solo", pace: level === 1 ? "easy" : level === 2 ? "medium" : "hard", ...(level === 4 ? { stage: "stretch" } : level === 5 ? { stage: "deep" } : {}) });
describe("Code Lab", () => {
  it("keeps every solved program syntactically structured", () => {
    for (let level = 1; level <= 5; level++) for (let index = 0; index < 4; index++) {
      const t = taskAt(level, 0, index);
      const lines = t.lines.map((line) => line.replace("□", t.answer));
      const defs = new Map<string, number>();
      lines.forEach((line, i) => {
        expect(line).not.toContain("□");
        expect(line).not.toContain("'");
        const stack: string[] = [];
        let quoted = false;
        for (const char of line) {
          if (char === '"') quoted = !quoted;
          else if (!quoted && "([".includes(char)) stack.push(char);
          else if (!quoted && ")]".includes(char)) expect(stack.pop()).toBe(char === ")" ? "(" : "[");
        }
        expect(quoted).toBe(false);
        expect(stack).toEqual([]);
        const indent = line.match(/^ */)?.[0].length ?? 0;
        expect(indent === 0 || indent === 4).toBe(true);
        if (i > 0) expect(indent === 4).toBe(lines[i - 1].endsWith(":"));
        if (line.trimStart().startsWith("def ")) {
          expect(indent).toBe(0);
          expect(line).toMatch(/^def \w+\(\w+\):$/);
          defs.set(line.match(/^def (\w+)/)![1], i);
        }
        if (/^(for |if |else:)/.test(line)) expect(line).toMatch(/:$/);
      });
      for (const [name, definition] of defs) {
        const calls = lines.flatMap((line, i) => line.startsWith(`${name}(`) ? [i] : []);
        expect(calls.length).toBeGreaterThan(0);
        expect(calls.every((i) => i > definition + 1)).toBe(true);
      }
      if (lines.some((line) => line.startsWith("for "))) expect(lines.find((line) => line.startsWith("for "))).toMatch(/^for i in range\(\d+\):$/);
    }
  });
  for (let level = 1; level <= 5; level++) it(`plays and validates level ${level}`, () => {
    const o = options(level), s = engine.create(o, { skills: {}, rng: () => .3, starter: 0, today: 0 });
    expect(engine.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
    let state = s;
    for (let task = 0; task < 4; task++) {
      const t = taskAt(level, state.seed, task);
      // Duplicate lines can use either identical bank block.
      const used = new Set<number>();
      const distinctOrder = t.lines.map((line) => { const i = t.bank.findIndex((candidate, index) => candidate === line && !used.has(index)); used.add(i); return i; });
      expect(distinctOrder.length).toBeGreaterThanOrEqual(2);
      state = { ...state, order: distinctOrder, token: t.answer };
      expect(correct(state)).toBe(true);
      expect(rendered(state).join("\n")).toContain(t.lines[0].replace("□", t.answer));
      state = { ...state, ran: true };
      expect(engine.validate(state, o)).toBe(true);
      state = { ...state, index: task + 1, order: [], token: "", ran: false };
    }
    expect(complete(state)).toBe(true); expect(engine.outcome(state, o)).toBe("done");
    expect(engine.validate({ ...state, index: 5 }, o)).toBe(false);
    expect(engine.validate({ ...state, order: [0, 0] }, o)).toBe(false);
  });
  it("introduces loops, functions, debugging and short programs", () => {
    expect(taskAt(2, 0, 2).lines.join(" ")).toContain("range");
    expect(taskAt(3, 0, 0).lines.join(" ")).toContain("def ");
    expect(taskAt(4, 0, 0).lines.join(" ")).toContain("if ");
    expect(taskAt(5, 0, 0).lines.join(" ")).toContain("% 3");
    expect(executionPlan(taskAt(2, 0, 2), "")).toEqual([0, 1, 1, 1, 2]);
    expect(executionPlan(taskAt(3, 0, 0), "")).toEqual([0, 2, 1]);
  });
});
