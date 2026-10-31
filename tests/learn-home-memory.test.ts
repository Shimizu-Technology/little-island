import { describe, expect, it } from "vitest";
import { chamoruCard, closeMismatch, createMemory, flipCard, memoryDone, memoryKey, memoryUndo, replayMemory } from "../src/games/memory";
import { defaultOptions } from "../src/games/types";
import { newMatch } from "../src/games/match";
import { emptySave, parseSave, validSession } from "../src/state/validation";

describe("CHamoru Memory pack", () => {
  for (const difficulty of ["easy", "medium", "hard"] as const) for (const mode of ["solo", "together"] as const) {
    it(`${difficulty} ${mode}: matches pictures to words with legacy scoring and replay`, () => {
      let s = { ...createMemory({ ...defaultOptions, difficulty, mode }, mode === "together" ? 1 : 0, "chamoru"), match: newMatch(["Mia", "Dad"]) };
      expect(validSession(s)).toBe(true);
      const a = 0, b = s.cards.findIndex(c => memoryKey(c) !== memoryKey(s.cards[a]));
      const mismatch = flipCard(flipCard(s, a), b);
      expect(validSession(mismatch)).toBe(true);
      expect(parseSave(JSON.stringify({ ...emptySave(), sessions: { memory: mismatch }, recent: "memory" })).sessions.memory).toEqual(mismatch);
      s = closeMismatch(mismatch) as typeof s;
      expect(s.player).toBe(0);
      expect(memoryUndo(s).turns).toBe(0);
      for (const key of new Set(s.cards.map(memoryKey))) {
        const indices = s.cards.flatMap((c, i) => memoryKey(c) === key ? [i] : []);
        expect(indices).toHaveLength(2);
        const faces = indices.map(i => chamoruCard(s.cards[i])!.face).sort();
        expect(faces).toEqual(["picture", "word"]);
        s = flipCard(flipCard(s, indices[0]), indices[1]) as typeof s;
        expect(validSession(s)).toBe(true);
      }
      expect(memoryDone(s)).toBe(true);
      const next = replayMemory(s);
      expect(next.pack).toBe("chamoru");
      expect(next.match?.names).toEqual(["Mia", "Dad"]);
      expect(next.match?.wins[0]).toBe(1);
      expect(validSession(next)).toBe(true);
      const old = createMemory({ ...defaultOptions, difficulty, mode });
      expect(old.pack).toBeUndefined();
      expect(validSession(old)).toBe(true);
      expect(validSession({ ...old, pack: "pictures" })).toBe(true);
    });
  }
  it("strictly rejects mixed packs, duplicate faces, missing partners and invalid content", () => {
    const s = createMemory(defaultOptions, 0, "chamoru"), cards = [...s.cards];
    const partner = cards.findIndex((c,i) => i > 0 && memoryKey(c) === memoryKey(cards[0]));
    cards[partner] = cards[0];
    for (const bad of [{ ...s, pack: "other" }, { ...s, pack: undefined }, { ...s, pack: "pictures" }, { ...s, cards }, { ...s, cards: s.cards.map((c,i) => i ? c : "ch:colors.not-reviewed:word") }, { ...s, cards: s.cards.map((c,i) => i ? c : "shell") }]) expect(validSession(bad)).toBe(false);
  });
});
