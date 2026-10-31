import { describe, expect, it } from "vitest";
import { createGame, gameIds } from "../src/games";
import { defaultOptions, random } from "../src/games/types";
import { createCardSession } from "../src/cards/engine";
import { applyActivitySave } from "../src/state/activityAction";
import { applyLearnSave } from "../src/state/learnAction";
import { applySessionAction } from "../src/state/sessionAction";
import { emptySave, parseSave } from "../src/state/validation";
import { activityIds } from "../src/state/activities";
import { learnIds } from "../src/learn/types";
import { engines } from "../src/learn/engines";
import { startSession, validLearnSession } from "../src/learn/session";
import { dailySuggestions, homeContinue, shelfGames, toggleShelfFavorite } from "../src/learn/home";
import { engine, chooseActivity, islandProgress, tapItem } from "../src/learn/games/hafa-adai/engine";
import { recordPractice } from "../src/learn/skills";

const create = (seed = 41, pace = "easy" as "easy" | "medium" | "hard", mode = "solo" as "solo" | "versus") => engine.create({ pace, mode }, { skills: {}, rng: random(seed), starter: 1, today: 20_000 });
describe("Home and island shelf", () => {
  it("keeps eleven classic games and adds the learning engines to their declared islands", () => {
    expect(shelfGames.filter(g => g.island === "classic")).toHaveLength(16);
    for (const id of learnIds) expect(shelfGames.find(g => g.id === id)?.island).toBe(engines[id].island);
  });
  it("round-trips every classic and learning favorite and toggles without duplicates", () => {
    let save = emptySave();
    for (const id of [...gameIds, ...activityIds, ...learnIds]) save = toggleShelfFavorite(save, id);
    save = parseSave(JSON.stringify(save));
    expect(save.favoriteGames).toHaveLength(gameIds.length + activityIds.length + learnIds.length);
    expect(toggleShelfFavorite(save, "hafa-adai").favoriteGames).not.toContain("hafa-adai");
    expect(toggleShelfFavorite(save, "unknown" as never)).toBe(save);
    expect(() => parseSave(JSON.stringify({ ...save, favoriteGames: ["hafa-adai", "hafa-adai"] }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, favoriteGames: ["learning-not-real"] }))).toThrow();
    for (const id of gameIds) {
      const legacy = createGame(id, defaultOptions);
      expect(parseSave(JSON.stringify({ ...emptySave(), sessions: { [id]: legacy }, recent: id })).sessions[id]).toEqual(legacy);
    }
  });
  it("Continue follows the most recent accepted save across all three kinds", () => {
    const classic = createGame("memory", defaultOptions);
    let save = { ...emptySave(), recent: "memory" as const, sessions: { memory: classic } };
    expect(homeContinue(save)).toBe("memory");
    const card = createCardSession("go-fish", defaultOptions);
    let next = applyActivitySave(save, "go-fish", card, { id: null, epoch: 0 }, 0);
    expect(homeContinue(next)).toBe("go-fish");
    const learn = startSession("hafa-adai", { options: { mode: "solo", pace: "easy" } }, {}, 42);
    next = applyLearnSave(next, "hafa-adai", learn, { id: null, epoch: 0 }, 0);
    expect(homeContinue(next)).toBe("hafa-adai");
    next = parseSave(JSON.stringify(next));
    expect(homeContinue(next)).toBe("hafa-adai");
    next = applySessionAction(next, "memory", classic.id, s => ({ ...s }));
    expect(homeContinue(next)).toBe("memory");
    next = applyActivitySave(next, "go-fish", { ...card, revision: 1 }, { id: card.id, epoch: 0 }, 0);
    expect(homeContinue(next)).toBe("go-fish");
    // A finished new learning round must not bring back an older classic marker.
    const s = create();
    let finished = s;
    for (const id of s.items) finished = tapItem(finished, id);
    next = { ...next, recentLearn: "hafa-adai", learn: { "hafa-adai": { ...learn, state: finished } } };
    expect(homeContinue(next)).toBeNull();
  });
  it("Try today is varied, deterministic, shuffleable and favors games with less recent practice", () => {
    const save = emptySave(), day = 20_000;
    const picks = dailySuggestions(save, day);
    expect(dailySuggestions(save, day)).toEqual(picks);
    expect(engines[picks[0]].island).toBe("reading");
    expect(engines[picks[1]].island).toBe("numbers");
    expect(["science", "thinking"]).toContain(engines[picks[2]].island);
    expect(new Set(picks).size).toBe(3);
    expect(dailySuggestions(save, day, 1).every((id, i) => id !== picks[i])).toBe(true);
    const practiced = { ...save, recentLearn: picks[0], learn: { [picks[0]]: startSession(picks[0], { options: { mode: engines[picks[0]].modes[0], pace: "easy" } }, {}, 5) } };
    expect(dailySuggestions(practiced, day)[0]).not.toBe(picks[0]);
  });
});

describe("Håfa Adai Island", () => {
  for (const pace of ["easy", "medium", "hard"] as const) for (const mode of ["solo", "versus"] as const) {
    it(`${pace} ${mode}: explores, spies, retries and completes save-safe rounds`, () => {
      const o = { pace, mode };
      for (let seed = 0; seed < 30; seed++) {
        let s = create(seed, pace, mode);
        expect(engine.validate(s, o)).toBe(true);
        if (mode === "solo") {
          for (const id of s.items) s = tapItem(s, id);
          expect(engine.outcome(s, o)).toBe("done");
          s = chooseActivity(s, "spy", o);
        }
        for (let i = 0; i < s.items.length; i++) {
          if (i === 0) {
            s = tapItem(s, s.items[1]);
            expect(islandProgress(s).player).toBe(mode === "versus" ? 1 : 0);
            // Repeated misses replace one bounded miss record rather than filling the save.
            for (let j = 0; j < 300; j++) s = tapItem(s, s.items[j % (s.items.length - 1) + 1]);
            expect(s.taps).toHaveLength(1);
          }
          s = tapItem(s, s.items[i]);
          expect(engine.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
        }
        expect(islandProgress(s).done).toBe(true);
        expect(engine.outcome(s, o)).not.toBeNull();
        expect(islandProgress(s).scores.reduce((a,b) => a+b,0)).toBe(s.items.length-1);
        expect(tapItem(s, s.items[0])).toBe(s);
      }
    });
  }
  it("rejects malformed, excessive, inconsistent and impossible stored moves", () => {
    const s = create(), o = { mode: "solo" as const, pace: "easy" as const };
    for (const bad of [null, {}, { ...s, extra: true }, { ...s, items: [...s.items, s.items[0]] }, { ...s, taps: ["not.reviewed"] }, { ...s, starter: 1 }, { ...s, taps: Array(241).fill(s.items[0]) }, { ...s, items: s.items.map((id,i) => i === 0 ? "numbers.ten" : id) }, { ...s, taps: [s.items[0], s.items[0]] }]) expect(engine.validate(bad, o)).toBe(false);
    expect(engine.validate(s, { ...o, mode: "versus" })).toBe(false);
  });
  it("selects mixed categories and brings recently missed skills into the next scene", () => {
    const missed = recordPractice({}, "ch.greetings", false, 20_000);
    const selected = engine.create({ mode: "solo", pace: "easy" }, { skills: missed, rng: random(4), starter: 0, today: 20_000 });
    expect(new Set(selected.items.map(id => id.split(".")[0])).size).toBe(6);
    expect(selected.items.some(id => id.startsWith("greetings."))).toBe(true);
  });
});

describe("Håfa Adai Island 1.4.0 rounds", () => {
  it("an I spy round saved by 1.4.0 still passes validLearnSession and parseSave", () => {
    const o = {"mode": "solo", "pace": "easy"} as const;
    const state = {"items": ["numbers.two", "greetings.goodbye", "food.egg", "colors.pink", "family.child", "body_parts.mouth"], "activity": "spy", "taps": ["numbers.two", "colors.pink", "greetings.goodbye", "colors.pink", "food.egg", "colors.pink", "greetings.goodbye", "family.child", "numbers.two", "body_parts.mouth"], "starter": 0};
    const session = { game: "hafa-adai" as const, version: 1 as const, id: "hafa-adai-legacy-1", revision: 11, options: o, state };
    expect(validLearnSession(session, "hafa-adai")).toBe(true);
    expect(() => parseSave(JSON.stringify({ ...emptySave(), learn: { "hafa-adai": session } }))).not.toThrow();
    expect(engine.outcome(state as never, o)).toBe("done");
  });
});
