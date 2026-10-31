import { describe, expect, it } from "vitest";
import {
  TOPICS,
  WORLDS,
  normalizeExploreFavorites,
  searchTopics,
  topicById,
  topicNarration,
} from "../src/explore/content";
import {
  dayNightDot,
  FOOD_CHAIN,
  HABITATS,
  PLACES,
  WATER_ACTIONS,
  LabAction,
  isDay,
  labAction,
  newLab,
} from "../src/explore/activities";
describe("bundled Explore collection", () => {
  it("contains fifty distinct discoveries, ten per world, with reachable internal destinations", () => {
    expect(TOPICS).toHaveLength(50);
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(50);
    expect(new Set(TOPICS.map((t) => t.title)).size).toBe(50);
    for (const world of WORLDS) expect(TOPICS.filter((t) => t.world === world.id)).toHaveLength(10);
    for (const topic of TOPICS) {
      expect(topic.short.length).toBeGreaterThan(100);
      expect(topic.deeper.length).toBeGreaterThan(100);
      expect(topic.question.length).toBeGreaterThan(35);
      expect(topic.related.length).toBeGreaterThanOrEqual(3);
      expect(topic.related).not.toContain(topic.id);
      for (const destination of topic.related)
        expect(topicById(destination), `${topic.id} → ${destination}`).toBeDefined();
      expect(topic.sources.length).toBeGreaterThan(0);
      for (const source of topic.sources) expect(new URL(source.url).protocol).toBe("https:");
      expect(topic.review.checkedOn).toBe("2026-10-19");
      expect(topic.illustration).toBeTruthy();
      expect(topicNarration(topic)).toContain(topic.short);
      expect(topicNarration(topic)).toContain(topic.deeper);
      expect(topicNarration(topic)).toContain(topic.question);
    }
  });
  it("finds substantive words across explanations, filters worlds and favorites, and handles empty searches", () => {
    expect(searchTopics("  sea  TURTLE ").some((t) => t.id === "turtles")).toBe(true);
    expect(searchTopics("", "space")).toHaveLength(10);
    expect(searchTopics("", undefined, [])).toEqual([]);
    expect(searchTopics("", undefined, ["moon", "turtles"]).map((t) => t.id)).toEqual(["moon", "turtles"]);
    expect(searchTopics("nonsensewithoutmatch")).toEqual([]);
    expect(searchTopics("", "animals").every((t) => t.world === "animals")).toBe(true);
  });
  it("bounds favorites to unique known destinations and never accepts unknown import data", () => {
    expect(normalizeExploreFavorites(["moon", "missing", "moon", 5, null, "guam"])).toEqual(["guam", "moon"]);
    expect(normalizeExploreFavorites({ favorites: ["moon"] })).toEqual([]);
  });
});
describe("five offline discovery activities", () => {
  it("turns a marked place through day and night and returns after one complete turn", () => {
    let state = newLab();
    const start = state.turn;
    expect(dayNightDot(1).y).toBeLessThan(0); // Counterclockwise from above the North Pole.
    expect(dayNightDot(4).x).toBeLessThan(0); // Sunlight enters from the left.
    expect(isDay(state.turn)).toBe(false);
    for (let i = 0; i < 4; i++) state = labAction(state, { type: "turn", by: 1 });
    expect(isDay(state.turn)).toBe(true);
    for (let i = 0; i < 4; i++) state = labAction(state, { type: "turn", by: 1 });
    expect(state.turn).toBe(start);
    expect(labAction(state, { type: "turn", by: -1 }).turn).toBe(7);
  });
  it("requires real food-chain order, allows correction, and freezes a complete chain", () => {
    let state = labAction(newLab(), { type: "chain", item: "Larger fish" });
    expect(state.chain).toEqual([]);
    expect(state.message).toContain("energy source");
    for (const item of FOOD_CHAIN) state = labAction(state, { type: "chain", item });
    expect(state.chain).toEqual(FOOD_CHAIN);
    expect(labAction(state, { type: "chain", item: "Sunlight" })).toBe(state);
    state = labAction(state, { type: "unchain" });
    expect(state.chain).toHaveLength(4);
    state = labAction(state, { type: "chain", item: "Larger fish" });
    expect(state.chain).toHaveLength(5);
  });
  it("preserves the current habitat on a wrong answer and completes all six matches exactly once", () => {
    let state = labAction(newLab(), { type: "habitat", choice: "Freshwater pond" });
    expect(state.habitat).toBe(0);
    for (const habitat of HABITATS) {
      state = labAction(state, { type: "habitat", choice: habitat.home });
      expect(state.message).toBe(habitat.why);
      expect(state.habitatFeedback).toBe(true);
      expect(labAction(state, { type: "habitat", choice: habitat.home })).toBe(state);
      state = labAction(state, { type: "next-animal" });
      expect(state.message).toBe("");
    }
    expect(state.matched).toEqual([0, 1, 2, 3, 4, 5]);
    expect(labAction(state, { type: "habitat", choice: "Coral reef" })).toBe(state);
  });
  it("models two complete water routes, rejects unavailable steps, and caps its notebook", () => {
    let state = newLab();
    state = labAction(state, { type: "water", action: "grow" });
    expect(state.water).toBe("ocean");
    for (const action of ["heat", "cool", "grow", "soak", "flow"]) state = labAction(state, { type: "water", action });
    expect(state.journey).toEqual(["ocean", "vapor", "cloud", "rain", "ground", "ocean"]);
    state = labAction(labAction(state, { type: "water", action: "freeze" }), { type: "water", action: "melt" });
    expect(state.water).toBe("ocean");
    for (let i = 0; i < 30; i++) state = labAction(state, { type: "water", action: i % 2 ? "melt" : "freeze" });
    expect(state.journey).toHaveLength(14);
    for (const [place, choices] of Object.entries(WATER_ACTIONS))
      for (const choice of choices) {
        expect(Object.keys(WATER_ACTIONS)).toContain(choice.next);
        expect(choice.explain.length, place).toBeGreaterThan(50);
      }
  });
  it("requires each geographical clue, handles wrong/unknown selections, and completes the map expedition", () => {
    let state = newLab();
    expect(labAction(state, { type: "place", id: "not-a-place" })).toBe(state);
    state = labAction(state, { type: "place", id: "japan" });
    expect(state.expedition).toBe(0);
    for (const place of PLACES) state = labAction(state, { type: "place", id: place.id });
    expect(state.visited).toEqual(PLACES.map((p) => p.id));
    expect(state.expedition).toBe(5);
    expect(labAction(state, { type: "place", id: "guam" })).toBe(state);
  });
  it("can reset every activity and restore an interrupted serializable lab without losing its progress", () => {
    const actions: LabAction[] = [
      { type: "turn", by: 1 },
      { type: "chain", item: "Sunlight" },
      { type: "habitat", choice: HABITATS[0].home },
      { type: "water", action: "heat" },
      { type: "place", id: "guam" },
    ];
    let state = newLab();
    for (const action of actions) state = labAction(state, action);
    const resumed = JSON.parse(JSON.stringify(state));
    expect(labAction(resumed, { type: "water", action: "cool" }).water).toBe("cloud");
    expect(labAction(labAction(resumed, { type: "next-animal" }), { type: "habitat", choice: HABITATS[1].home }).matched).toEqual([0, 1]);
    expect(labAction(state, { type: "reset" })).toEqual(newLab());
    expect(state.chain).toEqual(["Sunlight"]);
  });
});
