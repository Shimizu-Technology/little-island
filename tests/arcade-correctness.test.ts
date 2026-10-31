import { bestLabel, currentLevel, freePlayBest, returnLabel, stickerSections } from "../src/arcade/presentation";
import { describe, expect, it } from "vitest";
import { arcadeLearner, arcadeTransition, emptyArcade, validArcade, type ArcadeAction } from "../src/arcade/progress";
import { applyArcadeAction } from "../src/arcade/saveAction";
import { emptySave, parseSave } from "../src/state/validation";
import { addLearner } from "../src/learn/learners";
import { createReef, legalReefMoves, reefLevel, reefLevels, reefTransition } from "../src/arcade/games/reef-builder/engine";
import { createPalm, palmLevel, palmResult, palmMarchSpeed, palmStep, palmTransition, validPalm } from "../src/arcade/games/palm-patrol/engine";
import { palmFrameStep } from "../src/arcade/action/controls";
const finish = (round: string, stars = 3, game = "reef-builder"): ArcadeAction => ({ type: "finish", game, level: "w1-1", stars, round, score: 100, name: "Family" } as ArcadeAction);
const expected = { epoch: 3, learner: "family" };
describe("pending chest durability", () => {
  it("keeps the oldest offer through leaving, other-game loss, newer wins, trimming and reload", () => {
    let a = arcadeTransition(emptyArcade(), "family", finish("first"));
    const chest = arcadeLearner(a).chest;
    a = arcadeTransition(a, "family", { type: "visit", game: "palm-patrol" });
    a = arcadeTransition(a, "family", finish("loss", 0, "palm-patrol"));
    for (let n = 0; n < 50; n++) a = arcadeTransition(a, "family", finish(`later-${n}`));
    expect(validArcade(a)).toBe(true);
    const loaded = parseSave(JSON.stringify({ ...emptySave(), arcade: a }));
    expect(arcadeLearner(loaded.arcade).chest).toEqual(chest);
    expect(arcadeLearner(loaded.arcade).rounds).toHaveLength(40);
    a = arcadeTransition(a, "family", { type: "skip-chest", round: "first" });
    expect(arcadeLearner(a).chest).toBeNull();
    expect(arcadeLearner(arcadeTransition(a, "family", finish("new-offer"))).chest?.round).toBe("new-offer");
  });
});
describe("learner-owned versioned Reef sessions", () => {
  const initial = createReef(reefLevel("w1-1"), 42);
  const move = legalReefMoves(initial)[0];
  const state = reefTransition(initial, { type: "place", ...move });
  const action: ArcadeAction = { type: "save-round", session: { version: 1, game: "reef-builder", round: "reef-save", state } };
  it("round-trips exact board, appearance, pieces, PRNG and moves without touching legacy saves", () => {
    expect(state.moves).toBe(1);
    expect(parseSave(JSON.stringify(emptySave()))).toEqual(emptySave());
    const before = emptySave(), save = applyArcadeAction(before, action, expected, 3);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(arcadeLearner(save.arcade).session?.state).toEqual(state);
    expect(before.arcade).toBeUndefined();
    const restored = arcadeLearner(parseSave(JSON.stringify(save)).arcade).session!.state;
    const nextMove = legalReefMoves(state)[0];
    expect(reefTransition(restored, { type: "place", ...nextMove })).toEqual(reefTransition(state, { type: "place", ...nextMove }));
  });
  it("rejects stale learner and restore writes; isolates sibling data", () => {
    const save = applyArcadeAction(emptySave(), action, expected, 3);
    expect(applyArcadeAction(save, action, expected, 4)).toBe(save);
    const sibling = { ...save, learning: addLearner(undefined, "Sibling", "sibling") };
    expect(applyArcadeAction(sibling, action, expected, 3)).toBe(sibling);
    expect(arcadeLearner(sibling.arcade, "sibling").session).toBeUndefined();
  });
  it("rejects malformed sessions through the original-preserving recovery boundary", () => {
    const save = applyArcadeAction(emptySave(), action, expected, 3);
    for (const bad of [{ ...action.session, version: 2 }, { ...action.session, extra: true }, { ...action.session, state: { ...state, seed: -1 } }, { ...action.session, state: { ...state, board: [] } }]) {
      const raw = JSON.stringify({ ...save, arcade: { ...save.arcade, people: { family: { ...arcadeLearner(save.arcade), session: bad } } } });
      expect(() => parseSave(raw)).toThrow(/original has been kept/);
    }
  });
  it("clears only the finished round and rejects a delayed autosave after finish", () => {
    const save = applyArcadeAction(emptySave(), action, expected, 3);
    const done = applyArcadeAction(save, finish("reef-save"), expected, 3);
    expect(arcadeLearner(done.arcade).session).toBeUndefined();
    expect(applyArcadeAction(done, action, expected, 3)).toBe(done);
  });
});
describe("Palm fresh fact input and opener", () => {
  it("does not reuse a held press on the next fact, or add misses; a new press fires", () => {
    let s = createPalm(palmLevel("learn-1"), 42);
    const target = s.beetles.find(b => b.value === s.answer)!;
    s = palmTransition(s, { type: "move", x: target.x });
    const input = { x: target.x, down: true, taps: 1, helper: false, finish: false };
    s = palmFrameStep(s, input, 1 / 60);
    for (let n = 0; n < 120 && s.fact === 0; n++) s = palmFrameStep(s, input, 1 / 60);
    expect(s.fact).toBe(1); expect(s.shots).toBe(1);
    for (let n = 0; n < 180; n++) s = palmFrameStep(s, input, 1 / 60);
    expect(s.fact).toBe(1); expect(s.shots).toBe(1); expect(s.misses).toBe(0);
    s = palmFrameStep(s, { ...input, down: false }, 1 / 60);
    s = palmFrameStep(s, { ...input, taps: 2 }, 1 / 60);
    expect(s.shots).toBe(2); expect(validPalm(s)).toBe(true);
  });
  it("keeps normal hold-to-fire", () => {
    let s = createPalm(palmLevel("w1-1"), 42);
    for (let n = 0; n < 60; n++) s = palmFrameStep(s, { x: 180, down: true, taps: 1, helper: false, finish: false }, 1 / 60);
    expect(s.shots).toBeGreaterThan(3);
  });
  it("uses five beetles for the first three openers and preserves W6 challenge and saved stars", () => {
    for (let index = 1; index <= 8; index++) {
      const l = palmLevel(`w1-${index}` as Parameters<typeof palmLevel>[0]);
      if (index <= 3) expect(l.count * l.waves * l.relays).toBe(5);
      let s = createPalm(l, 1);
      for (let n = 0; n < 10000 && s.phase === "play"; n++) {
        const b = s.beetles.filter(b => !b.caught).sort((a,b) => b.y-a.y)[0];
        if (b && !s.husks.length) {
          const dx = s.direction * palmMarchSpeed(s) * (532 - b.y) / 560;
          const x = b.x + dx > 335 || b.x + dx < 25 ? b.x - dx : b.x + dx;
          s = palmTransition(s, { type: "move", x }); s = palmTransition(s, { type: "toss" });
        }
        s = palmStep(s, { type: "tick" }, 1 / 60);
      }
      expect(palmResult(s)?.cleared).toBe(true);
      expect(s.time).toBeLessThan(l.par);
      expect(palmResult(s)?.stars).toBe(3);
    }
    const hard = palmLevel("w6-8"); expect(hard.count * hard.waves * hard.relays).toBe(180);
    const a = arcadeTransition(emptyArcade(), "family", finish("old-stars", 3, "palm-patrol"));
    expect(parseSave(JSON.stringify({ ...emptySave(), arcade: a }))?.arcade?.people.family.games["palm-patrol"]?.stars["w1-1"]).toBe(3);
  });
});

it("labels map returns honestly and keeps historical mixed best separate from free-play records", () => {
  expect(returnLabel("reef-builder")).toBe("Back to"); expect(returnLabel("palm-patrol")).toBe("Back to"); expect(returnLabel("memory")).toBe("Continue");
  const a = arcadeTransition(emptyArcade(), "family", finish("level-best"));
  a.scores = [{ game: "reef-builder", name: "Ada", score: 2 }, { game: "palm-patrol", name: "Ada", score: 500 }];
  expect(arcadeLearner(a).games["reef-builder"]?.best).toBe(100);
  expect(freePlayBest(a, "reef-builder")).toBe(2); expect(bestLabel).toBe("Best across all modes");
});
it("puts collected stickers first, newest first, without changing ownership order", () => {
  const person = arcadeLearner(undefined); person.stickers = ["reef-fish", "star-shell"];
  expect(stickerSections(person)[0].stickers).toEqual(["star-shell", "reef-fish"]);
  expect(stickerSections(person)[1].stickers).not.toContain("star-shell");
  expect(person.stickers).toEqual(["reef-fish", "star-shell"]);
});
it("targets the first unlocked uncleared level for the direct current-level shortcut", () => {
  const a = arcadeTransition(emptyArcade(), "family", finish("clear-first"));
  expect(currentLevel(arcadeLearner(a), "reef-builder", reefLevels, false)?.id).toBe("w1-2");
});
