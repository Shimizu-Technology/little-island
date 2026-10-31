import { describe, expect, it } from "vitest";
import { FOOD_CHAIN, HABITATS, WATER_ACTIONS, labAction, newLab } from "../src/explore/activities";
import { newExploreProgress, validExploreProgress, restoreExploreProgress } from "../src/explore/progress";
import { labAudioKey } from "../src/explore/labAudio";
describe("Explore feedback continuity", () => {
  it("keeps the matched case and narration through reload until Next animal, then clears both", () => {
    const p = newExploreProgress();
    let s = newLab();
    for (const animal of HABITATS) {
      s = labAction(s, { type: "habitat", choice: animal.home });
      expect(s.habitatFeedback).toBe(true);
      expect(HABITATS[s.habitat - 1]).toBe(animal);
      expect(s.message).toBe(animal.why);
      p.labs.animals = s;
      expect(validExploreProgress(p)).toBe(true);
      s = restoreExploreProgress(JSON.parse(JSON.stringify(p))).labs.animals;
      expect(labAudioKey(s.message)).toBeDefined();
      s = labAction(s, { type: "next-animal" });
      expect(s.message).toBe("");
    }
    expect(s.matched).toHaveLength(6);
    expect(validExploreProgress({ ...p, labs: { ...p.labs, animals: { ...newLab(), habitatFeedback: true } } })).toBe(false);
    expect(validExploreProgress(newExploreProgress())).toBe(true);
  });
  it("has exact offline speech for every habitat/water explanation and food-chain correction", () => {
    for (const animal of HABITATS) {
      expect(labAudioKey(animal.why)).toBeDefined();
      expect(labAudioKey(labAction({ ...newLab(), habitat: HABITATS.indexOf(animal), matched: HABITATS.slice(0, HABITATS.indexOf(animal)).map((_, i) => i) }, { type: "habitat", choice: "wrong" }).message)).toBeDefined();
    }
    for (const actions of Object.values(WATER_ACTIONS)) for (const action of actions) expect(labAudioKey(action.explain)).toBeDefined();
    let s = newLab();
    for (const item of FOOD_CHAIN) {
      expect(labAudioKey(labAction(s, { type: "chain", item: "wrong" }).message)).toBeDefined();
      s = labAction(s, { type: "chain", item });
      expect(labAudioKey(s.message)).toBeDefined();
    }
  });
});
