import { describe, expect, it } from "vitest";
import { learningCardArt } from "../src/components/learningCardArt";
import { safeLaneScenery } from "../src/arcade/games/crab-crossing/scenery";
import { createCrab, crabLanes, crabLevel } from "../src/arcade/games/crab-crossing/engine";

describe("2.2 visual polish", () => {
  it("keeps the entire learning icon inside its header with padding", () => {
    const margin = (learningCardArt.height - learningCardArt.size) / 2;
    expect(margin).toBeGreaterThanOrEqual(20);
    expect(learningCardArt.height - margin).toBeLessThan(learningCardArt.height);
    expect(learningCardArt.landHeight + learningCardArt.landBottom).toBeLessThan(learningCardArt.height);
  });

  it("adds scenery only to safe lanes, independent of traffic and crossing rules", () => {
    const lanes = crabLanes(createCrab(crabLevel("w1-1"), 120));
    expect(safeLaneScenery(8, lanes.find(lane => lane.row === 8))).toEqual([]);
    for (const row of [0, 5, 10]) {
      expect(safeLaneScenery(row).length).toBeGreaterThanOrEqual(4);
      expect(new Set(safeLaneScenery(row).map(prop => prop[0])).size).toBeGreaterThanOrEqual(3);
    }
    for (const kind of ["palm", "rock", "flowers", "umbrella", "hut"]) {
      expect(safeLaneScenery(10).some(([prop, x]) => prop === kind && x >= 320 && x <= 600)).toBe(true);
    }
    expect(safeLaneScenery(11)).not.toEqual(safeLaneScenery(12));
    expect(safeLaneScenery(6).length).toBeGreaterThan(0);
    expect(safeLaneScenery(6, { ...lanes[0], row: 6 })).toEqual([]);
  });
});
