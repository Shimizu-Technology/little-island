import { describe, expect, it } from "vitest";
import { arcadeLearner, arcadeTransition, emptyArcade, emptyGameProgress, endlessOpen, levelOpen, openedOutfits, openedWorlds, validArcade, type ArcadeAction } from "../src/arcade";
import { emptySave, parseSave } from "../src/state/validation";
import { applyArcadeAction } from "../src/arcade/saveAction";
import { addLearner } from "../src/learn/learners";
import { createPracticeRound, practiceAnswer, practiceTransition } from "../src/practice/engine";
import { defaultPracticeSettings } from "../src/practice/types";
const owner = { epoch: 2, learner: "family" };
const finish = (round = "test-1"): ArcadeAction => ({ type: "finish", game: "reef-builder", level: "w1-1", stars: 3, score: 150, round, name: "Family" });
describe("arcade progress and recovery", () => {
  it("loads old saves unchanged and round-trips earned progress without in-flight state", () => {
    expect(parseSave(JSON.stringify(emptySave()))).toEqual(emptySave());
    const save = applyArcadeAction(emptySave(), finish(), owner, 2), raw = JSON.stringify(save);
    expect(validArcade(save.arcade)).toBe(true); expect(parseSave(raw)).toEqual(save); expect(raw).not.toContain('"board"'); expect(raw).not.toContain('"pattern"');
  });
  it("keeps stars monotone, prevents duplicate credit and binds callbacks to learner/restore epoch", () => {
    const save = applyArcadeAction(emptySave(), finish(), owner, 2);
    expect(applyArcadeAction(save, finish(), owner, 2)).toBe(save);
    expect(applyArcadeAction(save, finish("test-2"), owner, 3)).toBe(save);
    expect(applyArcadeAction(save, finish("test-2"), { ...owner, learner: "other" }, 2)).toBe(save);
    const again = applyArcadeAction(save, { ...finish("test-2"), stars: 1 } as ArcadeAction, owner, 2);
    expect(arcadeLearner(again.arcade).games["reef-builder"]!.stars["w1-1"]).toBe(3);
  });
  it("shows the offered sticker, skips freely and atomically credits one helped answer", () => {
    const save = applyArcadeAction(emptySave(), finish(), owner, 2), chest = arcadeLearner(save.arcade).chest!;
    expect(chest.sticker).toBeDefined(); expect(arcadeLearner(save.arcade).stickers).toEqual([]);
    let q = createPracticeRound(defaultPracticeSettings, 8); q = practiceTransition(q, { type: "choose", question: 0, choice: (practiceAnswer(q.questions[0]) + 1) % 3 }); q = practiceTransition(q, { type: "show", question: 0 }); q = practiceTransition(q, { type: "choose", question: 0, choice: practiceAnswer(q.questions[0]) });
    expect(q.results[0].helped).toBe(true);
    const action: ArcadeAction = { type: "claim-chest", round: chest.round, result: q.results[0], config: defaultPracticeSettings };
    const next = applyArcadeAction(save, action, owner, 2);
    expect(arcadeLearner(next.arcade).stickers).toEqual([chest.sticker]); expect(next.practiceNotes![q.results[0].skill].helped).toBe(1); expect(Object.values(next.learning!.people[0].notes)[0].helped).toBe(1);
    expect(applyArcadeAction(next, action, owner, 2)).toBe(next);
    const skipped = applyArcadeAction(save, { type: "skip-chest", round: chest.round }, owner, 2); expect(arcadeLearner(skipped.arcade).chest).toBeNull(); expect(arcadeLearner(skipped.arcade).games).toEqual(arcadeLearner(save.arcade).games); expect(skipped.practiceNotes).toBeUndefined();
    expect(applyArcadeAction(emptySave(), action, owner, 2)).toEqual(emptySave());
  });
  it("records independent chest notes separately and isolates two learners' stickers", () => {
    const learning = addLearner(undefined, "Test child", "learner-test"); let save = { ...emptySave(), learning };
    save = applyArcadeAction(save, finish(), { epoch: 2, learner: learning.active }, 2) as typeof save;
    const chest = arcadeLearner(save.arcade, learning.active).chest!;
    const next = applyArcadeAction(save, { type: "claim-chest", round: chest.round, result: { skill: "num.add-10", helped: false }, config: defaultPracticeSettings }, { epoch: 2, learner: learning.active }, 2);
    expect(arcadeLearner(next.arcade, "family").stickers).toEqual([]); expect(arcadeLearner(next.arcade, learning.active).stickers).toEqual([chest.sticker]); expect(next.practiceNotes!["num.add-10"].independent).toBe(1); expect(parseSave(JSON.stringify(next))).toEqual(next);
  });
  it("opens worlds/outfits from stars, keeps Helper stars, and opens endless only after world one", () => {
    let a = emptyArcade(); for (let n = 1; n <= 8; n++) a = arcadeTransition(a, "family", { ...finish(`round-${n}`), level: `w1-${n}` } as ArcadeAction);
    const p = arcadeLearner(a).games["reef-builder"]!; expect(p.openWorlds).toEqual(["w1", "w2", "learn"]); expect(p.unlockedOutfits).toEqual(["island", "sunhat"]); expect(endlessOpen(p)).toBe(true); expect(levelOpen(p, "w2-1")).toBe(true); expect(levelOpen(p, "w2-2")).toBe(false); expect(levelOpen(p, "w3-8", true)).toBe(true);
    expect(openedWorlds({ "w1-1": 3 })).toEqual(["w1", "learn"]); expect(openedOutfits({})).toEqual(["island"]); expect(endlessOpen(emptyGameProgress())).toBe(false);
    const scores = arcadeTransition(a, "family", { type: "finish", game: "reef-builder", level: "endless", stars: 0, score: 200, round: "free-1", name: "Alex" }); expect(scores.scores[0]).toEqual({ game: "reef-builder", name: "Alex", score: 200 });
  });
  it("rejects malformed arcade saves and preserves the existing parse/recovery boundary", () => {
    const a = applyArcadeAction(emptySave(), finish(), owner, 2).arcade!;
    const variants = [null, [], { ...a, version: 2 }, { ...a, music: 1 }, { ...a, breakMinutes: 10 }, { ...a, currency: 10 }, { ...a, recent: "unknown" }, { ...a, people: { ...a.people, intruder: { ...a.people.family, rounds: ["bad:token"] } } }, { ...a, people: { family: { ...a.people.family, games: { "reef-builder": { ...a.people.family.games["reef-builder"], best: Infinity } } } } }, { ...a, people: { family: { ...a.people.family, games: { "reef-builder": { ...a.people.family.games["reef-builder"], stars: { "w1-9": 3 } } } } } }, { ...a, people: { family: { ...a.people.family, games: { "reef-builder": { ...a.people.family.games["reef-builder"], unlockedOutfits: ["island", "starlight"] } } } } }];
    for (const arcade of variants) { expect(validArcade(arcade)).toBe(false); expect(() => parseSave(JSON.stringify({ ...emptySave(), arcade }))).toThrow(/original has been kept/); }
    expect(() => parseSave(JSON.stringify({ ...emptySave(), arcade: { ...a, people: { "unknown-person": a.people.family } } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...emptySave(), learning: null, arcade: a }))).toThrow();
  });
});

it("Arcade Continue/favorites preserve normal game precedence and revisit the same arcade map", async () => {
  const { homeContinue, toggleShelfFavorite } = await import("../src/learn/home");
  let save = applyArcadeAction(emptySave(), { type: "visit", game: "reef-builder" }, owner, 2);
  expect(homeContinue(save)).toBe("reef-builder");
  save = { ...save, recent: "memory" };
  expect(homeContinue(save)).toBeNull(); // a finished/missing recent normal round never revives an older arcade marker
  save = applyArcadeAction(save, { type: "visit", game: "reef-builder" }, owner, 2);
  expect(save.recent).toBeNull(); expect(homeContinue(save)).toBe("reef-builder");
  save = toggleShelfFavorite(save, "reef-builder"); expect(parseSave(JSON.stringify(save)).favoriteGames).toEqual(["reef-builder"]);
});

it("visiting an arcade map after a board game makes Continue point at the arcade game", async () => {
  const { homeContinue } = await import("../src/learn/home");
  const board = { ...emptySave(), recentBoard: "coconut-drop" as const };
  const save = applyArcadeAction(board, { type: "visit", game: "shell-song" }, owner, 2);
  expect(save.recentBoard).toBeNull();
  expect(homeContinue(save)).toBe("shell-song");
});

it("validators do not coerce hostile score objects or inherit a learner from Object.prototype", () => {
  expect(validArcade({ ...emptyArcade(), scores: [{ game: { toString: {} }, name: { toString: {} }, score: 1 }] })).toBe(false);
  const before = emptyArcade(), next = arcadeTransition(before, "constructor", finish());
  expect(validArcade(next)).toBe(true); expect(arcadeLearner(next, "constructor").games["reef-builder"]?.stars["w1-1"]).toBe(3);
});
