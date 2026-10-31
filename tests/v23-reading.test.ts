import { describe, it, expect } from "vitest";
import * as letters from "../src/learn/games/letter-lagoon/engine";
import * as words from "../src/learn/games/word-workshop/engine";
import * as stories from "../src/learn/games/story-studio/engine";
import { current, choices, move, complete, traces, type State } from "../src/learn/games/letter-lagoon/puzzle";
import { optionsAtLevel, type LearningLevel } from "../src/learn/levels";
import { random } from "../src/games/types";
import { emptySave, parseSave } from "../src/state/validation";
import { applyPractice } from "../src/state/learnAction";
import { startSession, validLearnSession } from "../src/learn/session";
const games = [letters, words, stories];
describe("2.3 Reading engines", () => {
  for (const game of games)
    for (const level of [1, 2, 3, 4, 5] as LearningLevel[]) {
      const o = optionsAtLevel({ mode: "solo", pace: "easy" }, level),
        bank = game.bank;
      it(`${game.engine.id} level ${level}: every authored task is solvable, strict and untimed`, () => {
        expect(bank[level - 1].length).toBeGreaterThanOrEqual(10);
        for (let id = 0; id < bank[level - 1].length; id++) {
          let s: State = {
            version: 1,
            level,
            starter: 0,
            ids: [
              id,
              ...bank[level - 1]
                .map((_, i) => i)
                .filter((i) => i !== id)
                .slice(0, 3),
            ],
            index: 0,
            placed: [],
            helped: false,
            hint: false,
            miss: false,
            clean: [],
          };
          expect(game.engine.validate(s, o)).toBe(true);
          expect(move(s, { type: "next" }, bank)).toBe(s);
          const t = current(s, bank);
          const wrong = t.trace
            ? move(
                s,
                {
                  type: "trace",
                  points: [
                    [0, 0],
                    [100, 100],
                  ],
                },
                bank
              )
            : move(s, { type: "tile", value: choices(s, bank).find((v) => v !== t.answer[0])! }, bank);
          expect(wrong.miss).toBe(true);
          expect(wrong.placed).toEqual([]);
          expect(game.engine.validate(wrong, o)).toBe(true);
          s = move(wrong, { type: "help" }, bank);
          expect(s.helped).toBe(true);
          expect(s.hint).toBe(true);
          expect(game.engine.validate(s, o)).toBe(true);
          for (let round = 0; round < 4; round++) {
            const task = current(s, bank);
            if (task.trace) s = move(s, { type: "trace", points: task.trace }, bank);
            else
              for (const value of task.answer) {
                expect(choices(s, bank)).toContain(value);
                s = move(s, { type: "tile", value }, bank);
                expect(game.engine.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
              }
            expect(complete(s, bank)).toBe(true);
            s = move(s, { type: "next" }, bank);
            expect(game.engine.validate(s, o)).toBe(true);
          }
          expect(game.engine.outcome(s, o)).toBe("done");
          expect(s.clean[0]).toBe(false);
          expect(move(s, { type: "help" }, bank)).toBe(s);
        }
      });
      it(`${game.engine.id} level ${level}: seeded variety and malformed saves`, () => {
        const create = (seed: number) => game.engine.create(o, { skills: {}, rng: random(seed), today: 0, starter: 0 });
        const s = create(43);
        expect(s).toEqual(create(43));
        expect(s.ids).not.toEqual(create(88).ids);
        const replay = game.engine.create(o, {skills:{}, rng:random(88), today:0, starter:0, previous:s});
        expect(replay.ids.some(i => s.ids.includes(i))).toBe(false);
        expect(game.engine.validate({ ...s, extra: 1 }, o)).toBe(false);
        for (const bad of [
          { version: 2 },
          { level: 0 },
          { ids: [0, 0, 1, 2] },
          { index: NaN },
          { index: 4 },
          { placed: ["bogus"] },
          { clean: [true] },
          { hint: true },
          { miss: true },
          { helped: 1 },
          { ids: [999, 1, 2, 3] },
        ])
          expect(game.engine.validate({ ...s, ...bad }, o)).toBe(false);
        expect(game.engine.validate(null, o)).toBe(false);
      });
    }
  it("stores every level with practice records and honors together-mode turns", () => {
    for (const game of games)
      for (const level of [1, 2, 3, 4, 5] as LearningLevel[]) {
        const options = optionsAtLevel({ mode: "together", pace: "easy" }, level);
        const session = startSession(game.engine.id, { options, names: ["Child", "Grown-up"], starter: 1 }, {}, 12);
        expect(validLearnSession(session)).toBe(true);
        const skill = `read.${game.engine.id}-level-${level}`;
        expect(game.engine.skills[skill]).toBeTruthy();
        const save = applyPractice({ ...emptySave(), learn: { [game.engine.id]: session } }, skill, true);
        expect(parseSave(JSON.stringify(save)).skills?.[skill]?.tries).toBe(1);
        const state = session.state as State;
        expect(game.engine.turn!(state, options)).toBe(1);
        expect(game.engine.turn!({ ...state, index: 1 }, options)).toBe(0);
      }
  });
  it("five levels have distinct cognitive and construction demands", () => {
    expect(letters.bank.map((b) => (b[0].trace ? "trace" : (b[0].slots?.join() ?? b[0].prompt)))).toHaveLength(5);
    expect(letters.bank[4][0].answer).toHaveLength(3);
    expect(letters.bank[0][0].answer).toHaveLength(1);
    expect(words.bank.map((b) => b[0].slots?.join())).toEqual([
      "First word,Second word",
      "Base,Ending",
      "First part,Second part",
      "First part,Second part,Root meaning,Opposite or contrast",
      "Word to investigate,Meaning in context",
    ]);
    expect(stories.bank.map((b) => b[0].answer.length)).toEqual([3, 3, 7, 4, 4]);
    expect(stories.bank[4].some((t) => t.slots?.includes("Inference from evidence"))).toBe(true);
  });
  it("trace rejects reversed paths, shortcuts, off-path scribbles and invalid coordinates", () => {
    for (const t of letters.bank[3]) {
      expect(traces(t.trace!, t.trace!)).toBe(true);
      expect(traces(t.trace!.slice().reverse(), t.trace!)).toBe(false);
      expect(traces([t.trace![0], t.trace!.at(-1)!], t.trace!)).toBe(false);
      expect(traces([...t.trace!, [1000, 1000]], t.trace!)).toBe(false);
      expect(traces([[NaN, 0]], t.trace!)).toBe(false);
    }
  });
});
