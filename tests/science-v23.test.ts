import { describe, it, expect } from "vitest";
import { engine as weather } from "../src/learn/games/weather-watch/engine";
import { engine as food } from "../src/learn/games/food-web/engine";
import { engine as space } from "../src/learn/games/space-station/engine";
import {
  move,
  tasks,
  correct,
  initialValues,
  type Game,
  type ScienceState,
} from "../src/learn/games/weather-watch/model";
import { optionsAtLevel, levelNumbers } from "../src/learn/levels";
import { random } from "../src/games/types";
import { validLearnSession, startSession } from "../src/learn/session";
const engines = [weather, food, space];
function build(game: Game, s: ScienceState, target: number[]) {
  const q = tasks(game, s.level, s.seed)[s.index];
  s = move(game, s, { type: "reset" });
  const multi = ["cycle", "chain", "web", "planets", "kit"].includes(q.kind);
  target.forEach((value, slot) => {
    s = move(game, s, { type: "set", slot: multi ? 0 : slot, value });
  });
  return s;
}
describe("Science hands-on levels", () => {
  for (const engine of engines)
    for (const level of levelNumbers)
      it(`${engine.id} level ${level}: solvable, validated and completed through model actions`, () => {
        const options = optionsAtLevel({ mode: "solo", pace: "easy" }, level);
        for (let seed = 1; seed <= 30; seed++) {
          const game = engine.id as Game;
          let s = engine.create(options, { skills: {}, rng: random(seed), starter: 0, today: 0 });
          expect(engine.validate(s, options)).toBe(true);
          expect(engine.outcome(s, options)).toBe(null);
          expect(move(game, s, { type: "test" })).toBe(s);
          expect(move(game, s, { type: "next" })).toBe(s);
          const qs = tasks(game, level, s.seed);
          expect(qs.length).toBeGreaterThanOrEqual(3);
          expect(qs.length).toBeLessThanOrEqual(8);
          for (const q of qs) {
            expect(correct(q, initialValues(q))).toBe(false);
            expect(engine.validate(JSON.parse(JSON.stringify(s)), options)).toBe(true);
            s = build(game, s, q.target);
            expect(correct(q, s.values)).toBe(true);
            expect(move(game, s, { type: "next" })).toBe(s);
            s = move(game, s, { type: "test" });
            expect(s.tested).toBe(true);
            expect(engine.validate(s, options)).toBe(true);
            s = move(game, s, { type: "next" });
            expect(engine.validate(s, options)).toBe(true);
          }
          expect(engine.outcome(s, options)).toBe("done");
          expect(move(game, s, { type: "set", slot: 0, value: 0 })).toBe(s);
          expect(engine.validate({ ...s, records: [] }, options)).toBe(false);
        }
      });
  for (const engine of engines)
    it(`${engine.id}: strict versioned saves, option binding and genuine model differences`, () => {
      const o = { mode: "solo", pace: "easy" } as const;
      const s = engine.create(o, { skills: {}, rng: random(123), starter: 0, today: 0 });
      for (const bad of [
        null,
        {},
        { ...s, version: 2 },
        { ...s, seed: -1 },
        { ...s, index: 100 },
        { ...s, extra: 1 },
        { ...s, values: [NaN] },
        { ...s, values: [500] },
        { ...s, values: new Array(1) },
        { ...s, actions: -1 },
        { ...s, tested: true },
        { ...s, items: [1] },
      ])
        expect(engine.validate(bad, o)).toBe(false);
      expect(engine.validate(s, optionsAtLevel(o, 2))).toBe(false);
      const kinds = levelNumbers.map((l) =>
        tasks(engine.id as Game, l, 1)
          .map((q) => q.kind)
          .join(",")
      );
      expect(new Set(kinds).size).toBe(5);
      expect(engine.levelNames).toHaveLength(5);
      for (const level of levelNumbers)
        expect(validLearnSession(startSession(engine.id, { options: optionsAtLevel(o, level) }, {}, 123))).toBe(true);
    });
  it("wrong work can be reset and tried again; no progress for an incorrect test", () => {
    let s = food.create({ mode: "solo", pace: "easy" }, { skills: {}, rng: random(1), starter: 0, today: 0 });
    s = move("food-web", s, { type: "set", slot: 0, value: 2 });
    s = move("food-web", s, { type: "test" });
    expect(s.tested).toBe(true);
    expect(move("food-web", s, { type: "next" })).toBe(s);
    s = move("food-web", s, { type: "reset" });
    expect(s.values).toEqual(initialValues(tasks("food-web", 1, s.seed)[0]));
  });
});

it("physical and ecological model outputs preserve the intended relationships", async () => {
  const { weightNewtons, lightMinutes, visibleMoonPercent, reefModel } = await import(
    "../src/learn/games/weather-watch/model"
  );
  expect(weightNewtons(12, 1)).toBeCloseTo(19.44);
  expect(weightNewtons(12, 3)).toBeGreaterThan(weightNewtons(12, 0));
  expect(lightMinutes(2)).toBeCloseTo(16.6);
  expect([0, 2, 4, 6].map(visibleMoonPercent)).toEqual([0, 50, 100, 50]);
  expect(reefModel("population", 0).algae).toBeGreaterThan(reefModel("population", 8).algae);
  expect(reefModel("pollution", 0).health).toBeGreaterThan(reefModel("pollution", 5).health);
  for (const game of ["weather-watch", "food-web"] as const) {
    const q = tasks(game, game === "food-web" ? 3 : 5, 1).find((q) => q.kind === "web" || q.kind === "kit")!;
    expect(correct(q, [...q.target].reverse())).toBe(true);
  }
});

it("owned upper levels record learner completion without reading a shared-quiz history", async () => {
  const { recordLevelRound } = await import("../src/learn/levelEvidence");
  const { emptySave } = await import("../src/state/validation");
  const { addLearner } = await import("../src/learn/learners");
  for (const engine of engines)
    for (const level of [4, 5] as const) {
      const options = optionsAtLevel({ mode: "solo", pace: "easy" }, level);
      const game = engine.id as Game;
      const session = { ...startSession(game, { options }, {}, 123), learner: "a" };
      let state = session.state as ScienceState,
        beforeLast = state;
      for (const q of tasks(game, level, state.seed)) {
        state = build(game, state, q.target);
        state = move(game, state, { type: "test" });
        beforeLast = state;
        state = move(game, state, { type: "next" });
      }
      const base = { ...emptySave(), learning: addLearner(undefined, "A", "a") };
      const before = { ...base, learn: { [game]: { ...session, state: beforeLast } } };
      const after = { ...base, learn: { [game]: { ...session, state } } };
      const result = recordLevelRound(before, after, game, 1);
      expect(result.learning).not.toEqual(base.learning);
    }
});

it("seeded building palettes vary while preserving scientific order and kit contents", () => {
  for (const [game, level] of [
    ["weather-watch", 3],
    ["food-web", 2],
    ["food-web", 3],
    ["space-station", 3],
  ] as const) {
    const rounds = Array.from({ length: 20 }, (_, seed) => tasks(game, level, seed)[0]);
    expect(new Set(rounds.map((q) => q.labels.join("|"))).size).toBeGreaterThan(5);
    expect(new Set(rounds.map((q) => q.target.map((i) => q.labels[i]).join("|"))).size).toBe(1);
  }
});

it("weekly weather charts include distinct rain depths to compare", () => {
  for (let seed = 0; seed < 30; seed++) {
    const week = tasks("weather-watch", 4, seed);
    expect(week).toHaveLength(7);
    expect(new Set(week.map(day => day.target[1])).size).toBe(7);
  }
});
