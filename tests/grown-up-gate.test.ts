import { describe, expect, it } from "vitest";
import { gateAccepts, makeGate } from "../src/state/grownUpGate";
import { random } from "../src/games/types";

describe("grown-up gate", () => {
  it("asks a varied times-table question with a typed answer", () => {
    const rng = random(7);
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const g = makeGate(rng);
      expect(g.a).toBeGreaterThanOrEqual(6);
      expect(g.b).toBeLessThanOrEqual(9);
      expect(g.answer).toBe(g.a * g.b);
      seen.add(g.answer);
    }
    expect(seen.size).toBeGreaterThan(4);
  });
  it("accepts only the exact number", () => {
    const g = { a: 7, b: 8, answer: 56 };
    expect(gateAccepts(g, " 56 ")).toBe(true);
    expect(gateAccepts(g, "57")).toBe(false);
    expect(gateAccepts(g, "56.0")).toBe(false);
    expect(gateAccepts(g, "")).toBe(false);
  });
});
