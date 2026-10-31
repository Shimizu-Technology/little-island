import { describe, expect, it } from "vitest";
import { learnIds, type LearnOptions } from "../src/learn/types";
import { engines as sharedLevelEngines } from "../src/learn/engines";
/** Games that use the shared Level 4–5 growth board (new 2.3 games own all five levels). */
const sharedLevelGames = learnIds.filter(id => !sharedLevelEngines[id].ownLevels);
import { engines } from "../src/learn/engines";
import { levelInfo, levelNumbers, levelOf, optionsAtLevel } from "../src/learn/levels";
import { startSession, validLearnOptions, validLearnSession, replaySession } from "../src/learn/session";
import { emptySave, parseSave } from "../src/state/validation";
import { addLearner, activeLearner, levelRoundSkill, readyForNext, recordLearning, rememberLearningChoice, selectLearner } from "../src/learn/learners";
import { shelfLevel } from "../src/learn/home";
import { recordLevelRound } from "../src/learn/levelEvidence";
import { mathAnswer, mathResult } from "../src/math/questions";
import { mathMove, questionOf, type MathRound } from "../src/learn/games/shell-math/round";
import { growthMove, growthQuestions } from "../src/learn/growth/engine";
import type { GrowthState } from "../src/learn/growth/types";
import { SENTENCES } from "../src/learn/content/reading/sentences";
import { objects } from "../src/learn/games/float-sink/engine";
import { random } from "../src/games/types";

const base: LearnOptions = { mode: "solo", pace: "easy" };
function mathFinish(state: MathRound) {
  while (state.index < state.questions.length) {
    while (state.steps < questionOf(state).b) state = mathMove(state, "shell-math", { type: "step" });
    state = mathMove(state, "shell-math", { type: "answer", answer: mathAnswer(questionOf(state)) });
    state = mathMove(state, "shell-math", { type: "next" });
  }
  return state;
}
describe("five learning levels", () => {
  for (const game of sharedLevelGames) it(`${game}: all five choices validate and legacy saves retain their level`, () => {
    for (const level of levelNumbers) {
      const options = optionsAtLevel(base, level);
      expect(levelOf(options)).toBe(level);
      expect(validLearnOptions(game, options)).toBe(true);
      expect(levelInfo(game, level).name.length).toBeGreaterThan(4);
      expect(levelInfo(game, level).description.length).toBeGreaterThan(20);
      for (const seed of [1, 42, 999]) {
        const session = startSession(game, { options }, {}, seed);
        expect(validLearnSession(session)).toBe(true);
        const { levelHelped: _evidence, ...legacy } = session;
        expect(validLearnSession(legacy)).toBe(true);
        const restored = parseSave(JSON.stringify({ ...emptySave(), learn: { [game]: legacy } }));
        expect(restored.learn?.[game]).toEqual(legacy);
        expect(levelOf(restored.learn?.[game]?.options)).toBe(level);
        expect(validLearnSession({ ...session, levelHelped: "no" })).toBe(false);
      }
    }
  });
  it("preserves other choices and maps back from growth to every foundation pace", () => {
    const o: LearnOptions = { mode: "together", pace: "medium", stage: "deep", mathOperation: "subtract" };
    for (const level of levelNumbers) {
      expect(optionsAtLevel(o, level)).toMatchObject({ mode: "together", mathOperation: "subtract" });
      expect(levelOf(optionsAtLevel(o, level))).toBe(level);
    }
    expect(optionsAtLevel(o, 1).stage).toBeUndefined();
  });
  it("remembers each learner's choice; family legacy belongs to family, never a new child", () => {
    let learning = addLearner(undefined, "A", "a");
    learning = rememberLearningChoice(learning, "a", "which-one", optionsAtLevel(base, 4));
    learning = addLearner(learning, "B", "b");
    const legacy = startSession("which-one", { options: optionsAtLevel(base, 3) }, {}, 1);
    let save = { ...emptySave(), learning, learn: { "which-one": legacy } };
    expect(shelfLevel(save, "which-one")).toBe(1);
    save = { ...save, learning: selectLearner(learning, "a") };
    expect(shelfLevel(save, "which-one")).toBe(4);
    save = { ...save, learning: selectLearner(learning, "family") };
    expect(shelfLevel(save, "which-one")).toBe(3);
    expect(shelfLevel(emptySave(), "which-one")).toBe(1);
  });
  it("requires two round summaries on different days, never warmups, helped work, or speed", () => {
    let learning = addLearner(undefined, "A", "a");
    for (let i = 0; i < 9; i++) learning = recordLearning(learning, "a", "shell-math", "easy", "num.add-within-10", `q${i}`, `r${i}`, false, 1 + i);
    expect(readyForNext(activeLearner(learning), "shell-math", "easy")).toBe(false);
    learning = recordLearning(learning, "a", "shell-math", "easy", levelRoundSkill, "completed-round", "r1", false, 20);
    learning = recordLearning(learning, "a", "shell-math", "easy", levelRoundSkill, "completed-round", "r2", false, 20);
    expect(readyForNext(activeLearner(learning), "shell-math", "easy")).toBe(false);
    learning = recordLearning(learning, "a", "shell-math", "easy", levelRoundSkill, "completed-round", "r3", true, 21);
    expect(readyForNext(activeLearner(learning), "shell-math", "easy")).toBe(false);
    learning = recordLearning(learning, "a", "shell-math", "easy", levelRoundSkill, "completed-round", "r4", false, 21);
    expect(readyForNext(activeLearner(learning), "shell-math", "easy")).toBe(true);
    expect(readyForNext(activeLearner(learning), "shell-math", "medium")).toBe(false);
    expect(readyForNext({ ...activeLearner(learning), id: "family" }, "shell-math", "easy")).toBe(false);
    expect(parseSave(JSON.stringify({ ...emptySave(), learning })).learning).toEqual(learning);
  });
  it("records a completed solo round once and rejects helped, shared, stale and legacy evidence", () => {
    const learning = addLearner(undefined, "A", "a");
    const round = { ...startSession("shell-math", { options: base }, {}, 42), learner: "a" };
    const done = { ...round, revision: 1, state: mathFinish(round.state as MathRound) };
    const before = { ...emptySave(), learning, learn: { "shell-math": round } };
    const after = { ...before, learn: { "shell-math": done } };
    const recorded = recordLevelRound(before, after, "shell-math", 10);
    expect(activeLearner(recorded.learning).notes[`shell-math:easy:${levelRoundSkill}`].independent).toBe(1);
    expect(recordLevelRound(recorded, recorded, "shell-math", 11)).toBe(recorded);
    for (const patch of [{ levelHelped: true }, { levelHelped: undefined }, { learner: "family" }, { id: "new-round" }, { options: { ...base, mode: "together" as const } }]) {
      const trial = { ...after, learn: { "shell-math": { ...done, ...patch } } };
      expect(readyForNext(activeLearner(recordLevelRound(before, trial, "shell-math").learning), "shell-math", "easy")).toBe(false);
      expect(activeLearner(recordLevelRound(before, trial, "shell-math").learning).notes[`shell-math:easy:${levelRoundSkill}`]?.independent ?? 0).toBe(0);
    }
    expect(replaySession({ ...done, levelHelped: true }, {}, 53).levelHelped).toBe(false);
  });
  it("uses the growth engine's independent history even if a UI flag was absent or false", () => {
    const learning = addLearner(undefined, "A", "a");
    for (const game of sharedLevelGames) {
      const round = { ...startSession(game, { options: optionsAtLevel(base, 4) }, {}, 42), learner: "a" };
      const qs = growthQuestions(game, round.options, round.state as GrowthState);
      let state = growthMove(round.state as GrowthState, { type: "help" }, qs);
      for (const q of qs) {
        state = growthMove(state, { type: "answer", value: q.answer }, qs);
        state = growthMove(state, { type: "next" }, qs);
      }
      const before = { ...emptySave(), learning, learn: { [game]: round } };
      const after = { ...before, learn: { [game]: { ...round, revision: 1, state } } };
      expect(activeLearner(recordLevelRound(before, after, game).learning).notes[`${game}:stretch:${levelRoundSkill}`]).toMatchObject({ independent: 0, helped: 1, days: [], rounds: [] });
    }
  });
  it("math Level 3 has a full-range first question and preserves chosen operation", () => {
    for (const game of ["shell-math", "number-hop", "quick-practice"] as const) for (const operation of ["add", "subtract", "mixed"] as const) {
      const options = { ...optionsAtLevel(base, 3), mathOperation: operation };
      const round = startSession(game, { options }, {}, 42), s = round.state as MathRound;
      expect(validLearnSession(round)).toBe(true);
      expect(s.questions[0].blank).toBe(game === "quick-practice" ? "second" : "result");
      expect(s.questions.every(q => Math.max(q.a, q.b, mathResult(q)) <= 20)).toBe(true);
    }
  });
  it("orders selected sentences by word count and dock objects by their authored pace", () => {
    for (let seed = 0; seed < 20; seed++) {
      const words = (startSession("which-one", { options: base }, {}, seed).state as { ids: string[] }).ids.map(id => SENTENCES.find(q => q.id === id)!.text.split(/\s+/).length);
      expect(words).toEqual([...words].sort((a, b) => a - b));
      const s = engines["float-sink"].create(optionsAtLevel(base, 3), { skills: {}, rng: random(seed), starter: 0, today: 1 }) as { items: string[] };
      const ranks = s.items.map(id => objects.find(o => o.id === id)!.pace);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});
