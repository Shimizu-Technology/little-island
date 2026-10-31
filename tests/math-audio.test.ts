import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mathSpeechKey, type MathQuestion } from "../src/math/questions";

const speech = JSON.parse(readFileSync(new URL("../scripts/learn/math.json", import.meta.url), "utf8")) as Record<string, string>;
const mapping = readFileSync(new URL("../src/content/learnAudio/math.ts", import.meta.url), "utf8");

describe("bundled offline math speech", () => {
  it("covers every supported arithmetic question without speaking the missing operand", () => {
    let count = 0;
    for (const operation of ["add", "subtract"] as const) for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
      const result = operation === "add" ? a + b : a - b;
      if (result < 0 || result > 20) continue;
      for (const blank of ["result", "second"] as const) {
        const q: MathQuestion = { version: 1, a, b, operation, blank, choices: [] };
        const key = mathSpeechKey(q);
        expect(speech[key]).toBe(blank === "second"
          ? operation === "add" ? `${a} plus what number makes ${result}?` : `${a} take away what number leaves ${result}?`
          : operation === "add" ? `${a} plus ${b}. How many altogether?` : `${a} take away ${b}. How many are left?`);
        count++;
      }
    }
    expect(count).toBe(800);
  });
  it("maps every new instruction/question to a complete bundled AAC container", () => {
    expect(Object.keys(speech)).toHaveLength(832);
    for (const key of Object.keys(speech)) {
      expect(mapping).toContain(`'${key}': require('../../../assets/audio/${key}.m4a')`);
      const clip = readFileSync(new URL(`../assets/audio/${key}.m4a`, import.meta.url));
      expect(clip.length, key).toBeGreaterThan(1000);
      for (const box of ["ftyp", "mdat", "moov"]) expect(clip.includes(Buffer.from(box)), `${key}: ${box}`).toBe(true);
    }
  });
});
