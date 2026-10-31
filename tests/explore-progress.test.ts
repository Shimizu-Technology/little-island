import { describe, expect, it } from "vitest";
import { newExploreProgress, restoreExploreProgress, validExploreProgress } from "../src/explore/progress";
import { labAction, newLab } from "../src/explore/activities";
import { QUALITY_GUIDANCE } from "../src/explore/guidance";
describe("durable Explore continuity", () => {
  it("restores exact location/search/back stack/scroll and all five interrupted labs", () => {
    const p = newExploreProgress();
    p.location = { kind: "activity", world: "weather" };
    p.history = [{ kind: "map" }, { kind: "world", world: "weather" }, { kind: "topic", id: "water-cycle" }];
    p.query = "cloud";
    p.onlyFavorites = true;
    p.positions = { map: 800, "world:weather": 144, "topic:water-cycle": 300, "activity:weather": 200 };
    p.labs.space = labAction(newLab(), { type: "turn", by: 1 });
    p.labs.oceans = labAction(newLab(), { type: "chain", item: "Sunlight" });
    p.labs.animals = labAction(newLab(), { type: "habitat", choice: "Seagrass meadow" });
    p.labs.weather = labAction(newLab(), { type: "water", action: "heat" });
    p.labs.world = labAction(newLab(), { type: "place", id: "guam" });
    expect(validExploreProgress(p)).toBe(true);
    const r = restoreExploreProgress(JSON.parse(JSON.stringify(p)));
    expect(r).toEqual(p);
    expect(labAction(r.labs.weather, { type: "water", action: "cool" }).water).toBe("cloud");
    r.labs.oceans.chain.pop();
    expect(p.labs.oceans.chain).toEqual(["Sunlight"]);
  });
  it("uses safe defaults for absent/unsupported/corrupt progress without mutating its input", () => {
    for (const bad of [undefined, null, {}, [], { ...newExploreProgress(), version: 2 }]) {
      expect(validExploreProgress(bad)).toBe(false);
      expect(restoreExploreProgress(bad)).toEqual(newExploreProgress());
    }
    const p = newExploreProgress();
    expect(validExploreProgress({ ...p, location: { kind: "topic", id: "outside" } })).toBe(false);
    expect(validExploreProgress({ ...p, history: new Array(25).fill({ kind: "map" }) })).toBe(false);
    expect(validExploreProgress({ ...p, query: "x".repeat(101) })).toBe(false);
    expect(validExploreProgress({ ...p, positions: { "topic:moon": -1 } })).toBe(false);
    expect(validExploreProgress({ ...p, positions: { "https://outside": 1 } })).toBe(false);
    expect(validExploreProgress({ ...p, positions: { "topic:moon": Infinity } })).toBe(false);
  });
  it("rejects incoherent imported lab answers, unreachable water steps and unbounded messages", () => {
    const p = newExploreProgress();
    for (const patch of [
      { chain: ["Larger fish"] },
      { matched: [0], habitat: 0 },
      { visited: ["japan"], expedition: 1 },
      { water: "cloud", journey: ["ocean", "cloud"] },
      { turn: 8 },
      { message: "a".repeat(601) },
    ])
      expect(validExploreProgress({ ...p, labs: { ...p.labs, oceans: { ...p.labs.oceans, ...patch } } })).toBe(false);
  });
  it("supplies original exact bundled narration transcripts for every interactive and difficult term", () => {
    for (const id of ["space", "oceans", "animals", "weather", "world"])
      expect(QUALITY_GUIDANCE[`lab-${id}` as keyof typeof QUALITY_GUIDANCE].length).toBeGreaterThan(150);
    expect(QUALITY_GUIDANCE["term-phytoplankton"]).toContain("sunlight");
    expect(QUALITY_GUIDANCE["term-water-vapor"]).toContain("invisible");
    expect(QUALITY_GUIDANCE["cards-go-fish"]).toContain("Four");
    expect(QUALITY_GUIDANCE["cards-crazy-eights"]).toContain("eight");
  });
});
