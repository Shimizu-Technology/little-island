import { describe, it, expect } from "vitest";
import { applyActivitySave } from "../src/state/activityAction";
import { emptySave, parseSave } from "../src/state/validation";
import { createCardSession } from "../src/cards/engine";
import { createMysterySession } from "../src/mystery/engine";
import { createRaceSession } from "../src/racer/engine";
import { createPartySession } from "../src/party/engine";
import { TOPICS, topicNarration, topicSpeechKey } from "../src/explore/content";
import { readFileSync, existsSync } from "node:fs";
describe("shared activity persistence", () => {
  it("preserves old saves and round-trips every new envelope", () => {
    const legacy = emptySave();
    expect(parseSave(JSON.stringify(legacy))).toEqual(legacy);
    const card = createCardSession("go-fish", { difficulty: "easy", mode: "solo", computerFirst: false });
    const race = createRaceSession();
    const party = createPartySession({ players: ["Mia", "Mom", "Dad"] });
    const save = {
      ...legacy,
      activities: { "go-fish": card, racer: race, "word-imposter": party, "island-mystery": createMysterySession() },
      explore: { favorites: [TOPICS[0].id] },
    };
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(() => parseSave(JSON.stringify({ ...save, activities: { racer: card } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, explore: { favorites: ["missing"] } }))).toThrow();
    expect(() =>
      parseSave(JSON.stringify({ ...save, explore: { favorites: [TOPICS[0].id, TOPICS[0].id] } }))
    ).toThrow();
  });
  it("rejects callbacks after restore or round replacement and stale card revisions", () => {
    const card = createCardSession("go-fish", { difficulty: "easy", mode: "solo", computerFirst: false });
    const old = emptySave();
    const saved = applyActivitySave(old, "go-fish", card, { id: null, epoch: 2 }, 2);
    expect(saved).not.toBe(old);
    expect(applyActivitySave(saved, "go-fish", card, { id: card.id, epoch: 1 }, 2)).toBe(saved);
    expect(applyActivitySave(saved, "go-fish", card, { id: "old", epoch: 2 }, 2)).toBe(saved);
    expect(applyActivitySave(saved, "go-fish", card, { id: card.id, revision: card.revision + 1, epoch: 2 }, 2)).toBe(
      saved
    );
    expect(applyActivitySave(saved, "racer", card, { id: null, epoch: 2 }, 2)).toBe(saved);
  });
  it("has an exact offline audio transcript and bundled file for each topic", () => {
    const manifest = { ...JSON.parse(readFileSync("scripts/explore-audio.json", "utf8")), ...JSON.parse(readFileSync("scripts/learn/science-v25.json", "utf8")) };
    for (const topic of TOPICS) {
      expect(manifest[topicSpeechKey(topic.id)]).toBe(topicNarration(topic));
      expect(existsSync(`assets/audio/${topicSpeechKey(topic.id)}.m4a`)).toBe(true);
    }
  });
});
