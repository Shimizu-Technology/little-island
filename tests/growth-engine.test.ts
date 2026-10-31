import { describe, expect, it } from "vitest";
import { learnIds, type LearnOptions } from "../src/learn/types";
import { engines as sharedLevelEngines } from "../src/learn/engines";
/** Games that use the shared Level 4–5 growth board (new 2.3 games own all five levels). */
const sharedLevelGames = learnIds.filter(id => !sharedLevelEngines[id].ownLevels);
import { startSession, validLearnSession, outcomeOf, replaySession } from "../src/learn/session";
import { growthMove, growthProgress, growthQuestions } from "../src/learn/growth/engine";
import { growthTrack } from "../src/learn/growth/content";
import type { GrowthState } from "../src/learn/growth/types";
import { applyLearnSave, applyOwnedPractice } from "../src/state/learnAction";
import { emptySave, parseSave, type Save } from "../src/state/validation";
import { addLearner, activeLearner, recordLearning, readyForNext, validLearners, learnerPractice } from "../src/learn/learners";
import { createPracticeSession, practiceAnswer, practiceConfigKey } from "../src/practice/engine";
import { defaultPracticeSettings } from "../src/practice/types";
import { runArrowProgram } from "../src/learn/growth/discovery";

describe("growth progression and preserved saves", () => {
  for (const game of sharedLevelGames) for (const stage of ["stretch", "deep"] as const) it(`${game} ${stage}: wrong, help, solve, next, resume and replay`, () => {
    expect(growthTrack(game, stage)!.questions.length).toBeGreaterThanOrEqual(12);
    const options: LearnOptions = { mode: "solo", pace: "easy", stage };
    let s = startSession(game, { options }, {}, 300);
    expect(validLearnSession(s)).toBe(true);
    expect(outcomeOf(s)).toBe(null);
    const qs = growthQuestions(game, options, s.state as GrowthState);
    for (let i = 0; i < qs.length; i++) {
      let state = s.state as GrowthState;
      const q = qs[i];
      expect(growthMove(state, { type: "next" }, qs)).toBe(state);
      if (!q.tiles) {
        const wrong = q.choices.find(c => c.value !== q.answer)!;
        state = growthMove(state, { type: "answer", value: wrong.value }, qs);
      }
      state = growthMove(state, { type: "help" }, qs);
      state = growthMove(state, { type: "answer", value: q.answer }, qs);
      expect(growthProgress(state, qs).clean.at(-1)).toBe(false);
      expect(growthMove(state, { type: "answer", value: q.answer }, qs)).toBe(state);
      s = { ...s, state: growthMove(state, { type: "next" }, qs), revision: s.revision + 1 };
      expect(validLearnSession(s)).toBe(true);
      const save: Save = { ...emptySave(), learn: { [game]: s } };
      expect(parseSave(JSON.stringify(save))).toEqual(save);
    }
    expect(outcomeOf(s)).toBe("done");
    expect(validLearnSession(replaySession(s, {}, 301))).toBe(true);
    expect(validLearnSession({ ...s, options: { ...options, stage: "unknown" } })).toBe(false);
    expect(validLearnSession({ ...s, state: { ...(s.state as GrowthState), ids: ["unknown", "unknown", "unknown"] } })).toBe(false);
  });
  it("keeps equal turns and respects the starter", () => {
    let s = startSession("which-one", { options: { mode: "versus", pace: "easy", stage: "deep" }, starter: 1 }, {}, 5);
    const qs = growthQuestions(s.game, s.options, s.state as GrowthState);
    expect(qs).toHaveLength(4);
    for (const q of qs) {
      let state = growthMove(s.state as GrowthState, { type: "answer", value: q.answer }, qs);
      state = growthMove(state, { type: "next" }, qs);
      s = { ...s, state };
    }
    expect(outcomeOf(s)).toBe("draw");
    expect(validLearnSession(s)).toBe(true);
  });
  it("credits accepted answers once and isolates owners/epochs", () => {
    const learning = addLearner(undefined, "Test learner", "test");
    let save: Save = { ...emptySave(), learning };
    let s = { ...startSession("shell-math", { options: { mode: "solo", pace: "easy", stage: "stretch" } }, {}, 10), learner: "test" };
    save = applyLearnSave(save, s.game, s, { id: null, epoch: 1 }, 1);
    const qs = growthQuestions(s.game, s.options, s.state as GrowthState), q = qs[0];
    const answered = { ...s, revision: 1, state: growthMove(s.state as GrowthState, { type: "answer", value: q.answer }, qs) };
    const stale = applyLearnSave(save, s.game, answered, { id: s.id, revision: 0, epoch: 0 }, 1);
    expect(stale).toBe(save);
    save = applyLearnSave(save, s.game, answered, { id: s.id, revision: 0, epoch: 1 }, 1);
    const count = Object.values(activeLearner(save.learning).notes).reduce((n, r) => n + r.independent, 0);
    expect(count).toBe(1);
    expect(applyLearnSave(save, s.game, answered, { id: s.id, revision: 0, epoch: 1 }, 1)).toBe(save);
    expect(activeLearner(save.learning).skills[q.skill].right).toBe(1);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(learning.people[0].notes).toEqual({});
  });
  it("does not turn helped/shared history into readiness", () => {
    let learning = addLearner(undefined, "A", "a");
    for (let day = 1; day <= 4; day++) learning = recordLearning(learning, "a", "which-one", "stretch", "read.test", `q${day}`, `r${day}`, true, day);
    expect(readyForNext(activeLearner(learning), "which-one", "stretch", ["read.test"])).toBe(false);
    for (let day = 1; day <= 3; day++) learning = recordLearning(learning, "a", "which-one", "stretch", "think.level-round", `q${day}`, `ind${day}`, false, day);
    expect(readyForNext(activeLearner(learning), "which-one", "stretch", ["read.test"])).toBe(true);
    expect(readyForNext(activeLearner(learning), "which-one", "easy")).toBe(false);
    expect(validLearners(learning)).toBe(true);
    expect(recordLearning(learning, "family", "which-one", "stretch", "read.test", "q", "r", false)).toBe(learning);
    expect(validLearners({ ...learning, active: "missing" })).toBe(false);
    expect(validLearners({ ...learning, people: [...learning.people, learning.people[0]] })).toBe(false);
  });
  it("completes aligned advanced warmups with help and exactly-once delivery", () => {
    for (const subject of ["math", "reading", "mixed"] as const) for (const stage of ["stretch", "deep"] as const) {
      const settings = { ...defaultPracticeSettings, enabled: true, subject, mathStage: stage, readingStage: stage };
      const session = createPracticeSession(settings, 7);
      expect(session.initial.questions.every(q => q.kind === "growth" && q.id.includes(stage))).toBe(true);
      let s = session.initial;
      for (let i = 0; i < 3; i++) {
        session.dispatch({ type: "show", question: i });
        const next = session.dispatch({ type: "choose", question: i, choice: practiceAnswer(s.questions[i]) });
        expect(next.state.results[i].helped).toBe(true);
        const finish = session.dispatch({ type: "next", question: i });
        s = finish.state;
        if (i === 2) expect(finish.summary?.results).toHaveLength(3);
      }
      expect(s.status).toBe("complete");
      expect(session.dispatch({ type: "next", question: 2 }).changed).toBe(false);
      expect(practiceConfigKey(settings)).not.toBe(practiceConfigKey({ ...settings, mathStage: undefined }));
    }
  });
  it("runs program blocks without crossing bounds or accepting unknown arrows", () => {
    expect(runArrowProgram([0, 0], ["→", "↓", "→", "↓"])).toEqual([2, 2]);
    expect(runArrowProgram([0, 0], ["←"])).toBeNull();
    expect(runArrowProgram([0, 0], ["jump"])).toBeNull();
  });
});

describe("learner review regressions", () => {
  it("assigns replays to the current learner and rejects absent restore owners", () => {
    const original = startSession("quick-practice", { options: { mode: "solo", pace: "easy", stage: "stretch" } }, {}, 1);
    const learning = addLearner(undefined, "Kai", "kai");
    const next = replaySession(original, {}, 2, "kai");
    expect(next.learner).toBe("kai");
    const save = { ...emptySave(), learning, learn: { "quick-practice": next } };
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(() => parseSave(JSON.stringify({ ...save, learn: { "quick-practice": { ...next, learner: "absent" } } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, learning: undefined }))).toThrow();
    expect(parseSave(JSON.stringify({ ...emptySave(), learn: { "quick-practice": original } }))).toBeTruthy();
  });
  it("adapts original activities from the owned learner, guarding stale and shared turns", () => {
    const round = { ...startSession("sound-boat", { options: { mode: "solo", pace: "easy" } }, {}, 1), learner: "kai" };
    const save = { ...emptySave(), learning: addLearner(undefined, "Kai", "kai"), learn: { "sound-boat": round } };
    const expected = { id: round.id, revision: 0, epoch: 3 };
    const next = applyOwnedPractice(save, "sound-boat", expected, 3, "read.short-a", true);
    expect(activeLearner(next.learning).skills["read.short-a"].right).toBe(1);
    expect(activeLearner(next.learning).notes).toEqual({});
    expect(save.learning.people[0].skills).toEqual({});
    expect(applyOwnedPractice(save, "sound-boat", { ...expected, epoch: 2 }, 3, "read.short-a", true)).toBe(save);
    expect(applyOwnedPractice(save, "sound-boat", { ...expected, id: "old" }, 3, "read.short-a", true)).toBe(save);
    const shared = { ...save, learn: { "sound-boat": { ...round, options: { ...round.options, mode: "versus" as const } } } };
    expect(activeLearner(applyOwnedPractice(shared, "sound-boat", expected, 3, "read.short-a", true).learning).skills).toEqual({});
  });
});

it("keeps child warmups separate from legacy family settings and validates choices", () => {
  const legacy = { ...defaultPracticeSettings, enabled: true, limit: 20 as const };
  const learning = addLearner(undefined, "Kai", "kai");
  expect(learnerPractice(learning, legacy).enabled).toBe(false);
  expect(learnerPractice({ ...learning, active: "family" }, legacy)).toBe(legacy);
  const chosen = { ...learning, people: learning.people.map(p => p.id === "kai" ? { ...p, warmup: { ...legacy, readingStage: "deep" as const } } : p) };
  expect(learnerPractice(chosen, legacy).readingStage).toBe("deep");
  expect(validLearners(chosen)).toBe(true);
  expect(validLearners({ ...learning, people: learning.people.map(p => p.id === "kai" ? { ...p, choices: { "shell-math": { mode: "versus", pace: "hard" } } } : p) })).toBe(false);
});
