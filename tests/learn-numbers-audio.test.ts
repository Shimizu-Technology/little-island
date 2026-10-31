import { describe, it, expect } from "vitest";
import { ORDERS } from "../src/learn/games/island-market/engine";

describe("bundled number speech", () => {
  it("has spoken numbers, every order and every possible shell comparison", async () => {
    const { readFileSync, statSync } = await import("node:fs");
    const speech: Record<string, string> = JSON.parse(readFileSync("scripts/learn/numbers.json", "utf8"));
    const map = readFileSync("src/content/learnAudio/numbers.ts", "utf8");
    for (let n = 0; n <= 100; n++) expect(speech[`reef-race-number-${n}`]).toBe(String(n));
    for (const q of ORDERS) expect(speech[`island-market-${q.id}`]).toBe(q.prompt);
    for (const [key, text] of Object.entries(speech)) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(statSync(`assets/audio/${key}.m4a`).size).toBeGreaterThan(1000);
      expect(map).toContain(`'${key}': require(`);
    }
  });
});
