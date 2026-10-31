import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import { mathAnswer, mathEquation, mathResult, mathSkill, mathSpeechKey } from "../src/math/questions";
import { engines } from "../src/learn/engines";
import { replaySession, startSession, validLearnSession } from "../src/learn/session";
import { learnIds, type LearnOptions } from "../src/learn/types";
import { createRound, mathConfig, mathMove, questionOf, type MathGame, type MathRound, validRound } from "../src/learn/games/shell-math/round";
import { emptySave, parseSave } from "../src/state/validation";

const games: MathGame[] = ["shell-math", "number-hop", "quick-practice"];
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function ready(s: MathRound, game: MathGame) {
  if (game !== "quick-practice") for (let n = 0; n < questionOf(s).b; n++) s = mathMove(s, game, { type: "step" });
  return s;
}
describe("math activity rounds", () => {
  for (const game of games) for (const pace of ["easy", "medium"] as const) for (const operation of ["add", "subtract", "mixed"] as const) {
    const options: LearnOptions = { mode: "solo", pace, mathOperation: operation };
    it(`${game} ${pace}/${operation}: complete, resume every transition, replay`, () => {
      let session = startSession(game, { options }, {}, 123);
      const initial = clone(session);
      const assertSaved = (s: MathRound) => {
        session = { ...session, revision: session.revision + 1, state: s };
        expect(validLearnSession(clone(session))).toBe(true);
        const restored = parseSave(JSON.stringify({ ...emptySave(), learn: { [game]: session }, recentLearn: game }));
        expect(restored.learn?.[game]).toEqual(session);
      };
      let s = session.state as MathRound;
      expect(s.questions).toHaveLength(game === "quick-practice" ? 3 : 5);
      expect(mathConfig(options, game).limit).toBe(pace === "easy" ? 10 : 20);
      for (let i = 0; i < s.questions.length; i++) {
        const q = questionOf(s);
        if (operation !== "mixed") expect(q.operation).toBe(operation);
        else expect(q.operation).toBe(i % 2 ? "subtract" : "add");
        if (i < 2) expect(Math.max(q.a, q.b, mathResult(q))).toBeLessThanOrEqual(6);
        expect(q.blank).toBe(game === "quick-practice" && i === 2 ? "second" : "result");
        expect(mathMove(s, game, { type: "next" })).toBe(s);
        if (game !== "quick-practice") {
          expect(mathMove(s, game, { type: "answer", answer: mathAnswer(q) })).toBe(s);
          for (let j = 0; j < q.b; j++) { s = mathMove(s, game, { type: "step" }); assertSaved(s); }
          expect(mathMove(s, game, { type: "step" })).toBe(s);
        }
        if (i === 0) {
          s = mathMove(s, game, { type: "answer", answer: q.choices.find(n => n !== mathAnswer(q))! });
          expect(s.helped).toBe(true); assertSaved(s);
        } else if (i === 1) {
          s = mathMove(s, game, { type: "show" });
          expect(s).toMatchObject({ helped: true, shown: true }); assertSaved(s);
          expect(mathMove(s, game, { type: "show" })).toBe(s);
        }
        s = mathMove(s, game, { type: "answer", answer: mathAnswer(q) });
        expect(s.completed[i]).toBe(i < 2); // assisted answers stay assisted; later ones are independent
        expect(s.solved).toBe(true); assertSaved(s);
        expect(mathMove(s, game, { type: "answer", answer: mathAnswer(q) })).toBe(s);
        expect(mathMove(s, game, { type: "show" })).toBe(s);
        expect(mathEquation(q, true)).not.toContain("?");
        expect(mathSpeechKey(q)).toMatch(/^math-(add|subtract)-\d+-\d+-(result|second)$/);
        expect(mathSkill(q, mathConfig(options, game).limit)).toMatch(/^num\.(add|subtract|missing)-within-(10|20)$/);
        s = mathMove(s, game, { type: "next" }); assertSaved(s);
      }
      expect(engines[game].outcome(s, options)).toBe("done");
      for (const action of [{ type: "next" }, { type: "show" }, { type: "step" }, { type: "answer", answer: 1 }] as const) expect(mathMove(s, game, action)).toBe(s);
      expect(initial.state).not.toEqual(s);
      const replay = replaySession(session, {}, 456);
      expect(validLearnSession(replay)).toBe(true);
      expect(replay.options).toEqual(options);
      expect(replay.state).toMatchObject({ index: 0, completed: [], helped: false, shown: false, solved: false });
    });
  }
  it("bounds creation with constant RNGs, keeps helpers on pure shared rules and never mutates input", () => {
    for (const game of games) for (const value of [0, 0.999999, NaN]) {
      const options: LearnOptions = { mode: "together", pace: "medium", mathOperation: "mixed" };
      const s = createRound(options, game, () => value), before = clone(s);
      expect(validRound(s, options, game)).toBe(true);
      const shown = mathMove(s, game, { type: "show" });
      expect(s).toEqual(before);
      expect(shown).toMatchObject({ helped: true, shown: true, steps: game === "quick-practice" ? 0 : questionOf(s).b });
      const solved = mathMove(shown, game, { type: "answer", answer: mathAnswer(questionOf(s)) });
      expect(solved.completed).toEqual([true]);
      expect(validRound(solved, options, game)).toBe(true);
    }
  });
  it("rejects forged arithmetic, progress, oversized saves and unsupported options without throwing", () => {
    for (const game of games) {
      const options: LearnOptions = { mode: "solo", pace: "easy" };
      const session = startSession(game, { options }, {}, 8), s = session.state as MathRound;
      const q = questionOf(s), prepared = ready(s, game);
      expect(mathMove(prepared, game, { type: "skip", answer: mathAnswer(q) } as never)).toBe(prepared);
      expect(mathMove(prepared, game, null as never)).toBe(prepared);
      const solved = mathMove(prepared, game, { type: "answer", answer: mathAnswer(q) });
      const bad: unknown[] = [null, [], {}, { ...s, version: 2 }, { ...s, extra: 1 }, { ...s, index: 1 },
        { ...s, steps: -1 }, { ...s, steps: 100 }, { ...s, steps: 0.5 }, { ...s, solved: true },
        { ...s, shown: true }, { ...s, completed: [false] }, { ...s, wrong: mathAnswer(q) },
        { ...s, helped: true, wrong: 999 }, { ...s, questions: Array(1000).fill(q) },
        { ...s, questions: [null, ...s.questions.slice(1)] },
        { ...s, questions: [{ ...q, a: -1 }, ...s.questions.slice(1)] },
        { ...s, questions: [{ ...q, choices: [0, 0, mathAnswer(q)] }, ...s.questions.slice(1)] },
        { ...s, questions: [{ ...q, blank: game === "quick-practice" ? "second" : "other" }, ...s.questions.slice(1)] },
        { ...solved, completed: [true] }, { ...solved, wrong: q.choices.find(n => n !== mathAnswer(q)) },
        { ...s, questions: [{ ...q, a: 20, b: 1 }, ...s.questions.slice(1)] }];
      for (const state of bad) {
        expect(() => validRound(state, options, game)).not.toThrow();
        expect(validRound(state, options, game), JSON.stringify(state)).toBe(false);
      }
      for (const extra of [{ mathOperation: "multiply" }, { mathOperation: null }, { pace: "within100" }, { mathLimit: 100 }, { language: "en" }, { mode: "versus" }]) {
        expect(validLearnSession({ ...session, options: { ...options, ...extra } })).toBe(false);
      }
      expect(mathMove(s, game, { type: "answer", answer: 999 })).toBe(s);
      expect(createRound(options, game, random(8))).toEqual(createRound(options, game, random(8)));
    }
  });
  it("leaves all nine old learning saves and their option contract unchanged", () => {
    const oldIds = learnIds.slice(0, 12).filter(id => !games.includes(id as MathGame));
    expect(oldIds).toHaveLength(9);
    for (const game of oldIds) for (const pace of ["easy", "medium", "hard"] as const) {
      const options: LearnOptions = { mode: engines[game].modes[0], pace };
      const session = startSession(game, { options }, {}, 42);
      expect(validLearnSession(clone(session))).toBe(true);
      expect(parseSave(JSON.stringify({ ...emptySave(), learn: { [game]: session } })).learn?.[game]).toEqual(session);
      expect(validLearnSession({ ...session, options: { ...options, mathOperation: "add" } })).toBe(false);
      expect(validLearnSession({ ...session, options: { ...options, mathOperation: undefined } })).toBe(false);
    }
  });
});
