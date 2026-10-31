import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import type { LearnOptions, Pace } from "../src/learn/types";
import { exact, same } from "../src/learn/kit/science";
import {
  answer,
  coralStart,
  current,
  engine as tide,
  happy,
  makeChange,
  missionById,
  missions,
  nextMission,
  toggle,
  upgrade,
  type TideState,
} from "../src/learn/games/tide-pool/engine";
import {
  act,
  capacity,
  counts,
  dock,
  engine as floats,
  objects,
  shapes,
  shapesFor,
  truth,
} from "../src/learn/games/float-sink/engine";
import {
  commands,
  currentLevel,
  engine as crab,
  levels,
  run,
  solve,
  solved,
  start,
  step,
  tick,
  trail,
} from "../src/learn/games/crab-commands/engine";
const ctx = (seed = 1) => ({ skills: {}, rng: random(seed), starter: 1 as const, today: 20000 });
const paces: Pace[] = ["easy", "medium", "hard"];
describe("science kit", () => {
  it("compares save trees without relying on property order", () => {
    expect(same({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true);
    expect(exact({ a: 1, extra: 2 }, ["a"])).toBe(false);
  });
});
/** Plays the current tide-pool mission: every person picks `choice` (or the right answer), then the change. */
function playMission(s: TideState, o: LearnOptions, choice?: number): TideState {
  const m = current(s)!;
  if (m.kind === "fix") {
    for (const c of ["sun", "cool", "high"] as const) if (!s.pool[c]) s = toggle(s, c);
  } else {
    for (let i = 0; i < (o.mode === "together" ? 2 : 1); i++) s = answer(s, choice ?? m.right, o);
    s = makeChange(s, o);
  }
  return s;
}
describe("tide pool", () => {
  it("every mission is one concrete question with two or three picture answers", () => {
    for (const m of missions) {
      expect(m.question.split(" ").length, m.id).toBeLessThanOrEqual(8);
      if (m.kind === "guess") {
        expect(m.answers.length).toBeGreaterThanOrEqual(2);
        expect(m.answers.length).toBeLessThanOrEqual(3);
        expect(m.right).toBeLessThan(m.answers.length);
        expect(new Set(m.answers.map((a) => a.picture)).size).toBe(m.answers.length);
      }
    }
  });
  for (const mode of tide.modes)
    for (const pace of paces)
      it(`plays every mission to the end with strict saves: ${mode}/${pace}`, () => {
        const o = { mode, pace };
        for (let seed = 1; seed <= 15; seed++) {
          let s = tide.create(o, ctx(seed)) as TideState;
          expect(missionById(s.missions[0])!.kind).toBe("guess");
          let turns = 0;
          while (!tide.outcome(s, o) && turns++ < 20) {
            const m = current(s)!;
            // Nothing happens before the answers are in.
            expect(makeChange(s, o)).toBe(s);
            expect(nextMission(s, o)).toBe(s);
            // A wrong answer is still a discovery; alternate right and wrong.
            s = playMission(
              s,
              o,
              m.kind === "guess" ? (turns % 2 ? m.right : (m.right + 1) % m.answers.length) : undefined
            );
            expect(s.watched).toBe(true);
            expect(tide.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
            expect(answer(s, 0, o)).toBe(s);
            s = nextMission(s, o);
            expect(tide.validate(s, o)).toBe(true);
          }
          expect(tide.outcome(s, o)).toBe("done");
          expect(s.index).toBe(3 + paces.indexOf(pace));
        }
      });
  it("the coral smiles only with sun, cool water and the tide in; it starts sadder at harder paces", () => {
    expect(
      [coralStart("easy"), coralStart("medium"), coralStart("hard")].map(
        (c) => [c.sun, c.cool, c.high].filter((v) => !v).length
      )
    ).toEqual([1, 2, 3]);
    const o: LearnOptions = { mode: "solo", pace: "hard" };
    let s: TideState = {
      ...(tide.create(o, ctx()) as TideState),
      missions: ["coral", "snail", "crab", "fish", "heat"],
      index: 0,
      pool: { ...coralStart("hard"), creatures: ["coral", "seaweed", "fish"] },
    };
    expect(tide.validate(s, o)).toBe(true);
    s = toggle(s, "sun");
    s = toggle(s, "sun");
    expect(s.pool.sun).toBe(false);
    s = toggle(toggle(s, "sun"), "cool");
    expect(happy(s.pool)).toBe(false);
    expect(tide.validate(s, o)).toBe(true);
    s = toggle(s, "high");
    expect(s.watched).toBe(true);
    expect(toggle(s, "sun")).toBe(s);
    expect(tide.validate(s, o)).toBe(true);
  });
  it("loads 1.4.0 rounds, keeping mission progress", () => {
    const o: LearnOptions = { mode: "together", pace: "medium" };
    const legacy = {
      missions: ["snail", "light", "coral", "rain"],
      index: 2,
      pool: {
        light: true,
        warm: false,
        high: true,
        salt: 2,
        heat: 0,
        algae: 2,
        grazed: false,
        creatures: ["coral", "fish", "seaweed"],
      },
      action: "sun",
      guesses: [0],
      result: false,
      last: null,
      rained: false,
      starter: 1,
    };
    expect(tide.validate(legacy, o)).toBe(true);
    const s = upgrade(legacy as never, o);
    expect(s.missions).toEqual(["snail", "seaweed", "coral", "tide"]);
    expect(s.index).toBe(2);
    expect(happy(s.pool)).toBe(false);
    expect(tide.validate(s, o)).toBe(true);
    expect(tide.outcome(legacy as never, o)).toBeNull();
    expect(tide.outcome({ ...legacy, index: 4, action: null } as never, o)).toBe("done");
    for (const bad of [
      { ...legacy, missions: ["snail", "light", "coral", "nope"] },
      { ...legacy, pool: { ...legacy.pool, salt: 9 } },
      { ...legacy, action: "laser" },
      { ...legacy, extra: 1 },
    ])
      expect(tide.validate(bad, o)).toBe(false);
  });
  it("rejects malformed, oversized, inconsistent and unknown-key saves", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" },
      s = tide.create(o, ctx()) as TideState;
    const bad: unknown[] = [
      null,
      [],
      {},
      { ...s, extra: true },
      { ...s, index: 99 },
      { ...s, guesses: [0, 1] },
      { ...s, guesses: [7] },
      { ...s, watched: true },
      { ...s, pool: { ...s.pool, sun: false } },
      { ...s, pool: { ...s.pool, creatures: ["fish", "snail"] } },
      { ...s, pool: { ...s.pool, creatures: null } },
      { ...s, missions: ["fish", "snail", "crab"] },
      { ...s, missions: Array(500).fill("crab") },
      { ...s, starter: 2 },
    ];
    for (const b of bad) expect(tide.validate(b, o)).toBe(false);
  });
});
describe("float dock", () => {
  for (const mode of floats.modes)
    for (const pace of paces)
      it(`guessing drops and shelves each object, then a boat sinks: ${mode}/${pace}`, () => {
        const o = { mode, pace };
        let s = floats.create(o, ctx());
        expect(s.items).toHaveLength(counts[pace]);
        // Obvious first: a rock and a leaf.
        expect([...s.items.slice(0, 2)].sort()).toEqual(["leaf", "rock"]);
        expect(act(s, { kind: "drop" }, o)).toBe(s);
        s.items.forEach((id, i) => {
          s = act(s, { kind: "predict", value: i % 2 ? truth(id) : ((1 - truth(id)) as 0 | 1) }, o);
          const d = dock(s, o)!;
          expect(d.shelf).toEqual(s.items.slice(0, i + 1));
          expect(floats.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
        });
        expect(dock(s, o)?.phase).toBe("shape");
        for (let boat = 0; boat < (mode === "versus" ? 2 : 1); boat++) {
          const shape = boat === 0 ? "bowl" : "wide";
          expect(shapesFor(pace)).toContain(shape);
          s = act(s, { kind: "shape", value: shape }, o);
          for (let n = 0; n <= capacity(shape, pace === "hard"); n++) {
            s = act(s, { kind: "load" }, o);
            expect(floats.validate(s, o)).toBe(true);
          }
          if (mode === "versus" && boat === 0) s = act(s, { kind: "pass" }, o);
        }
        expect(floats.outcome(s, o)).toBe(mode === "solo" ? "done" : 0);
      });
  it("still loads 1.4.0 rounds with a separate drop and sort", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    const items = ["leaf", "rock", "shell"];
    const events = [
      { kind: "predict", value: 1 },
      { kind: "drop" },
      { kind: "sort", value: 0 },
      { kind: "predict", value: 1 },
      { kind: "drop" },
    ];
    const s = { items, starter: 0, events };
    expect(floats.validate(s, o)).toBe(true);
    expect(dock(s as never, o)?.shelf).toEqual(["leaf", "rock"]);
    expect(dock(s as never, o)?.index).toBe(2);
    expect(floats.validate({ ...s, events: [...events, { kind: "sort", value: 0 }] }, o)).toBe(false);
    expect(floats.validate({ ...s, events: [{ kind: "drop" }] }, o)).toBe(false);
  });
  it("strictly replays events and rejects forged phase skips or unexpected keys", () => {
    const o: LearnOptions = { mode: "solo", pace: "hard" },
      s = floats.create(o, ctx());
    for (const events of [
      [{ kind: "load" }],
      [{ kind: "predict", value: 3 }],
      [{ kind: "predict", value: 0, extra: 1 }],
      [null],
      Array(100).fill({ kind: "predict", value: 0 }),
    ])
      expect(floats.validate({ ...s, events }, o)).toBe(false);
    expect(floats.validate({ ...s, items: ["no"] }, o)).toBe(false);
  });
  it("a solid clay ball sinks before any pebble is added", () => {
    for (const mode of floats.modes) {
      const o: LearnOptions = { mode, pace: "medium" };
      let s = floats.create(o, ctx());
      for (const id of s.items) s = act(s, { kind: "predict", value: truth(id) }, o);
      s = act(s, { kind: "shape", value: "ball" }, o);
      expect(dock(s, o)?.phase).toBe(mode === "solo" ? "done" : "pass");
      expect(dock(s, o)?.pebbles).toBe(0);
      expect(act(s, { kind: "load" }, o)).toBe(s);
      expect(floats.validate(s, o)).toBe(true);
    }
    expect(shapesFor("easy")).not.toContain("ball");
  });
  it("covers 16 varied objects and every boat shape", () => {
    expect(objects).toHaveLength(16);
    expect(objects.filter((x) => x.pace === 0)).toHaveLength(counts.easy);
    for (const s of shapes) expect(capacity(s, false)).toBeGreaterThanOrEqual(0);
    expect(objects.find((x) => x.id === "clay")?.floats).toBe(false);
    expect(objects.find((x) => x.id === "clay-boat")?.floats).toBe(true);
  });
});
describe("crab beach solver", () => {
  for (const l of levels)
    it(`${l.id} has a legal shortest hint and every execution prefix saves`, () => {
      const path = solve(l);
      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThan(80);
      expect(solved(l, run(l, path))).toBe(true);
      expect(solved(l, run(l, path.slice(0, -1)))).toBe(false);
      const o: LearnOptions = { mode: "together", pace: l.pace };
      let s = crab.create(o, ctx());
      s = {
        ...s,
        levels: [
          l.id,
          ...levels
            .filter((v) => v.pace === l.pace && v.id !== l.id)
            .slice(0, 2)
            .map((v) => v.id),
        ],
        program: path,
        cards: path.length,
        running: true,
      };
      while (s.running) {
        expect(crab.validate(s, o)).toBe(true);
        s = tick(s);
      }
      expect(crab.validate(s, o)).toBe(true);
      expect(solved(currentLevel(s), run(l, s.program.slice(0, s.cursor)))).toBe(true);
    });
  it("each pace ramps: first beach two or three cards, then four to six, then longer", () => {
    for (const l of levels) {
      const n = solve(l).length;
      if (l.tier === 0) expect(n, l.id).toBeGreaterThanOrEqual(2);
      if (l.tier === 0) expect(n, l.id).toBeLessThanOrEqual(3);
      if (l.tier === 1) expect([4, 5, 6], l.id).toContain(n);
      if (l.tier === 2 && !l.retired) expect(n, l.id).toBeLessThanOrEqual(13);
    }
    for (const pace of paces)
      for (let seed = 0; seed < 20; seed++) {
        const s = crab.create({ mode: "solo", pace }, ctx(seed));
        expect(s.levels.map((id) => levels.find((l) => l.id === id)!.tier)).toEqual([0, 1, 2]);
        expect(s.levels.every((id) => !levels.find((l) => l.id === id)!.retired)).toBe(true);
      }
  });
  it("footprints follow the plan square by square and stop where it would bump", () => {
    const l = levels.find((l) => l.id === "ea1")!;
    expect(trail(l, ["right", "right"]).steps.map((s) => s.pos)).toEqual([1, 2]);
    expect(trail(l, ["right", "right"]).bumpCard).toBeNull();
    const t = trail(l, ["right", "up", "right"]);
    expect(t.steps.map((s) => s.pos)).toEqual([1]);
    expect(t.bumpCard).toBe(1);
    const h = levels.find((l) => l.id === "ha1")!;
    // Again ×2 walks two more squares, each one shown.
    expect(trail(h, ["forward", "repeat"]).steps.map((s) => [s.pos, s.card])).toEqual([
      [1, 0],
      [2, 1],
      [3, 1],
    ]);
    expect(solved(h, run(h, ["forward", "repeat"]))).toBe(true);
    expect(trail(h, ["repeat"]).bumpCard).toBe(0);
    for (const lv of levels) {
      const path = solve(lv);
      const tr = trail(lv, path);
      expect(tr.bumpCard).toBeNull();
      expect(tr.steps.at(-1)?.pos).toBe(run(lv, path).pos);
    }
  });
  it("old saved rounds with retired beaches still load", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    const s = { ...crab.create(o, ctx()), levels: ["e8", "e7", "e1"] };
    expect(crab.validate(s, o)).toBe(true);
  });
  it("repeat is exactly two extra executions of the previous command", () => {
    const l = levels.find((l) => l.id === "h1")!,
      w = step(l, start(l), "forward");
    expect(step(l, w, "repeat")).toEqual(step(l, step(l, w, "forward"), "forward"));
    expect(step(l, start(l), "repeat").bump).toBe(true);
    expect(solve(l).length).toBeLessThan(11);
  });
  it("bump stops the crab on the failing card and changing the program is safe", () => {
    const l = levels.find((l) => l.id === "e2")!;
    expect(run(l, ["right", "down"]).pos).toBe(start(l).pos);
    expect(run(l, ["right", "down"]).bump).toBe(true);
  });
  for (const pace of paces)
    it(`completes a three-beach round at ${pace}`, () => {
      const o: LearnOptions = { mode: "solo", pace },
        s = crab.create(o, ctx());
      const completed = s.levels.map((id) => solve(levels.find((l) => l.id === id)!));
      expect(crab.validate({ ...s, completed, cards: completed.reduce((n, p) => n + p.length, 0) }, o)).toBe(true);
      expect(crab.outcome({ ...s, completed }, o)).toBe("done");
    });
  it("rejects invalid level, command, cursor, running and completion combinations", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" },
      s = crab.create(o, ctx());
    for (const bad of [
      { ...s, extra: 1 },
      { ...s, levels: ["h1", "h2", "h3"] },
      { ...s, program: ["repeat"] },
      { ...s, cursor: 3 },
      { ...s, running: true },
      { ...s, completed: [["right"]] },
      { ...s, program: Array(10000).fill("up") },
    ])
      expect(crab.validate(bad, o)).toBe(false);
    expect(commands("hard")).toContain("repeat");
  });
});
