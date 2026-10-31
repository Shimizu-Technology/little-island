import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import { createMathQuestions, mathAnswer, mathEquation, mathResult, validMathQuestion } from "../src/math/questions";

describe("bounded shared arithmetic", () => {
  it("generates correct, varied choices for every range, operation and blank without impossible subtraction", () => {
    for (const limit of [10, 20] as const) for (const operation of ["add", "subtract", "mixed"] as const) {
      for (let seed = 0; seed < 150; seed++) for (const q of createMathQuestions({ limit, operation, missing: true }, 9, random(seed))) {
        expect(validMathQuestion(q, limit)).toBe(true);
        expect(q.choices).toContain(mathAnswer(q));
        expect(mathResult(q)).toBeGreaterThanOrEqual(0);
        expect(mathResult(q)).toBeLessThanOrEqual(limit);
        expect(mathEquation(q)).toContain("?");
        expect(mathEquation(q, true)).not.toContain("?");
      }
    }
  });
  it("stays finite for a constant RNG and rejects forged questions", () => {
    const questions = createMathQuestions({ limit: 10, operation: "subtract", missing: true }, 10000, () => 0);
    expect(questions).toHaveLength(12);
    expect(questions.every(q => validMathQuestion(q, 10))).toBe(true);
    const q = questions[0];
    expect(validMathQuestion({ ...q, b: q.a + 1 }, 10)).toBe(false);
    expect(validMathQuestion({ ...q, choices: [1, 1, 1] }, 10)).toBe(false);
    expect(validMathQuestion({ ...q, extra: true }, 10)).toBe(false);
    expect(validMathQuestion({ ...q, a: 30 }, 20)).toBe(false);
    expect(validMathQuestion({ ...q, version: 2 }, 10)).toBe(false);
  });
});
