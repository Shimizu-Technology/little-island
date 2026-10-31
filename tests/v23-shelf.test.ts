import { describe, expect, it } from "vitest";
import { shelfGames } from "../src/learn/home";
import { learnIds } from "../src/learn/types";

describe("learning shelves read as an age ladder", () => {
  const learning = shelfGames.filter(g => (learnIds as readonly string[]).includes(g.id));

  it("labels every learning game with its age span", () => {
    expect(learning).toHaveLength(learnIds.length);
    for (const g of learning) expect(g.ages, g.id).toMatch(/^Ages \d+–\d+$/);
  });

  it("orders each island youngest first", () => {
    const start = (ages?: string) => Number(ages?.match(/\d+/)?.[0]);
    for (const island of ["reading", "numbers", "science", "thinking", "coding"]) {
      const starts = learning.filter(g => g.island === island).map(g => start(g.ages));
      expect(starts.length, island).toBeGreaterThanOrEqual(3);
      expect(starts, island).toEqual([...starts].sort((a, b) => a - b));
    }
  });
});
