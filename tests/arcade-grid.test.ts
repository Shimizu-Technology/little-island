import { describe, expect, it } from "vitest";
import { arcadeTransition, emptyArcade, validArcade } from "../src/arcade/progress";
import { allLevelIds } from "../src/arcade/types";
import {
  createRail,
  railBodyPose,
  railHedges,
  railLevel,
  railLevels,
  railMove,
  railResult,
  railSafeStart,
  railSnake,
  railStep,
  railTick,
  railTransition,
  validRail,
} from "../src/arcade/games/rail-parade/engine";
import {
  CRAB_HOP,
  CRAB_RX,
  crabConfig,
  crabLanes,
  crabLevel,
  crabLevels,
  crabPace,
  crabPosition,
  crabResult,
  crabStep,
  crabTransition,
  createCrab,
  laneObjects,
  supported,
  validCrab,
} from "../src/arcade/games/crab-crossing/engine";
import { type Direction, same } from "../src/arcade/games/grid/rules";
import { crabAdvance, crossingPath, railPath, railUpcoming } from "./grid-fixtures";
const tick = { type: "tick" } as const;
describe("feel grid content", () => {
  it("validates all 112 levels, ramps, clear respawn zones and distinct world twists", () => {
    for (const levels of [railLevels, crabLevels]) {
      expect(levels.map((l) => l.id)).toEqual(allLevelIds);
      expect(levels.every((l) => l.goals.length === 3 && l.goals.every(Boolean))).toBe(true);
    }
    for (const id of allLevelIds) {
      const r = createRail(railLevel(id), 120),
        c = createCrab(crabLevel(id), 120);
      expect(validRail(r), id).toBe(true);
      expect(validCrab(c), id).toBe(true);
      const safe = railSafeStart(r);
      expect(
        safe.body.every((p) => !railHedges(r).some((h) => same(p, h)) && !railSnake(r).some((h) => same(p, h)))
      ).toBe(true);
      expect(railTick({ ...r, collected: r.level !== "endless" ? r.level.target : 10 })).toBeLessThan(railTick(r));
      expect(crabPace({ ...c, furthest: 0, crossed: 1 })).toBeGreaterThan(crabPace(c));
    }
    expect(railLevel("w1-1").target).toBe(6);
    expect(railTick(createRail(railLevel("w1-1"), 1))).toBe(0.24);
    expect(railLevel("w3-8").tick).toBeCloseTo(0.124);
    expect(crabLevel("w1-1").speed).toBe(1);
    expect(
      new Set(
        railLevels
          .filter((l) => l.index === 1 && l.world !== "learn")
          .map((l) => JSON.stringify([l.hedges, l.snakeSpan]))
      ).size
    ).toBe(6);
    const laneTwists = crabLevels
      .filter((l) => l.index === 1 && l.world !== "learn")
      .map((l) => JSON.stringify(crabLanes(createCrab(l, 1)).map((x) => [x.row, x.kind, Math.sign(x.speed)])));
    expect(new Set(laneTwists).size).toBe(6);
  });
});
describe("Rail movement, damage and interpolation", () => {
  it("buffers exactly two non-reversing turns and consumes them at cell boundaries", () => {
    const s = createRail(railLevel("w1-1"), 1),
      a = railTransition(s, { type: "turn", direction: "up" }),
      b = railTransition(a, { type: "turn", direction: "left" });
    expect(b.queue).toEqual(["up", "left"]);
    expect(railTransition(a, { type: "turn", direction: "down" })).toBe(a);
    expect(railTransition(b, { type: "turn", direction: "down" })).toBe(b);
    let n = b;
    for (let i = 0; i < 15; i++) n = railStep(n, tick, 1 / 60);
    expect(n.body[0]).toEqual({ x: 2, y: 6 });
    expect(n.direction).toBe("up");
    expect(n.queue).toEqual(["left"]);
    const p = railBodyPose({ ...n, elapsed: railTick(n) / 2 });
    expect(p[0]).toEqual({ x: 2, y: 5.5 });
    expect(p[1]).toEqual({ x: 2, y: 6.5 });
    expect(s.body[0]).toEqual({ x: 2, y: 7 });
  });
  it("finishes the last untimed learning step at the collected tile, with an independent 120 ms visual age", () => {
    const s = createRail(railLevel("learn-1"), 120),
      l = railLevel("learn-1");
    const win = railMove(
      { ...s, collected: l.target - 1, score: (l.target - 1) * 40, moves: l.par - 1, food: { x: 3, y: 7 } },
      "right"
    );
    expect(win.phase).toBe("cleared");
    expect(railBodyPose(win, 0)[0]).toEqual({ x: 2, y: 7 });
    expect(railBodyPose(win, 0.06)[0]).toEqual({ x: 2.5, y: 7 });
    expect(railBodyPose(win, 0.12)[0]).toEqual(win.body[0]);
    expect(railBodyPose(win)[0]).toEqual(win.body[0]);
    expect(railStep(win, tick, 1 / 60)).toBe(win);
  });
  it("allows a vacated tail and spends hearts for walls/body/hedges/patrol in either mode", () => {
    for (const helper of [false, true]) {
      const s = createRail(railLevel("w2-1"), 2, helper),
        square = {
          ...s,
          body: [
            { x: 3, y: 3 },
            { x: 3, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 3 },
          ],
          food: { x: 8, y: 8 },
        };
      expect(railMove(square, "left").bumps).toBe(0);
      for (const hit of [
        railMove(square, "down"),
        railMove({ ...s, body: [{ x: 9, y: 7 }] }, "right"),
        railMove({ ...s, body: [{ x: 3, y: 4 }] }, "right"),
        railMove({ ...s, body: [{ x: railSnake(s)[0].x, y: 2 }] }, "up"),
      ]) {
        expect(hit.lives.hearts).toBe(s.lives.hearts - 1);
        expect(hit.phase).toBe("play");
        expect(hit.queue).toEqual([]);
        expect(hit.respawn).toBe(0.3);
        expect(hit.lives.invulnerable).toBe(1.2);
        expect(hit.body).toHaveLength(3);
      }
    }
  });
  it("reaches finite game over, protects respawn, preserves terminal identity and cannot refill by toggling", () => {
    let s = createRail(railLevel("w1-1"), 2);
    for (let hit = 0; hit < 3; hit++) {
      s = railMove({ ...s, body: [{ x: 9, y: 7 }], respawn: 0, lives: { ...s.lives, invulnerable: 0 } }, "right");
      expect(s.lives.hearts).toBe(2 - hit);
      if (hit === 0) {
        expect(railMove(s, "up")).toBe(s);
        const on = railTransition(s, { type: "helper", value: true });
        expect(on.lives.hearts).toBe(4);
        expect(railTransition(on, { type: "helper", value: false }).lives.hearts).toBe(2);
      }
    }
    expect(railResult(s)).toMatchObject({ outcome: "game-over", stars: 0 });
    expect(railStep(s, tick, 1 / 60)).toBe(s);
    expect(railTransition(s, { type: "helper", value: true })).toBe(s);
  });
  it("has real move pars, not automatic three stars for every no-hit finish", () => {
    const s = createRail(railLevel("w1-1"), 1),
      l = railLevel("w1-1"),
      win = { ...s, phase: "cleared" as const, collected: l.target, score: l.target * 40, moves: l.par };
    expect(railResult(win)?.stars).toBe(3);
    expect(railResult({ ...win, moves: l.par + 1 })?.stars).toBe(2);
    expect(railResult({ ...win, bumps: 2 })?.stars).toBe(1);
  });
  it("is deterministic, native-free, strict and rejects malformed motion/lives", () => {
    const s = createRail(railLevel("w3-8"), 12);
    expect(s).toEqual(createRail(railLevel("w3-8"), 12));
    for (const dt of [NaN, Infinity, -1, 0]) expect(railStep(s, tick, dt)).toBe(s);
    for (const bad of [
      null,
      {},
      { ...s, body: null },
      { ...s, previous: [null] },
      { ...s, body: [s.body[0], s.body[0]] },
      { ...s, queue: ["up", "left", "down"] },
      { ...s, lives: { ...s.lives, hearts: Infinity } },
      { ...s, phase: "rest" },
      { ...s, food: { x: 10, y: 1 } },
      { ...s, score: 99 },
      { ...s, level: { ...railLevel("w3-8"), tick: -1 } },
      { ...s, extra: true },
    ])
      expect(validRail(bad)).toBe(false);
    expect(railTransition(s, { type: "turn", direction: "diagonal" as Direction })).toBe(s);
  });
});
describe("Rail deterministic completion fixtures", () => {
  it.each(railLevels)("clears $id with a bounded route and a skill par", (level) => {
    let s = createRail(level, 120);
    for (let move = 0; move < 700 && s.phase === "play"; move++) {
      const path = railPath(s);
      expect(path.length, `${level.id} ${s.moves}`).toBeGreaterThan(0);
      // Real input queue and fixed ticks, with one-cell lookahead for an in-flight turn.
      if (level.world === "learn") s = railMove(s, path[0]);
      else {
        const turn = railUpcoming(s);
        if (turn) s = railTransition(s, { type: "turn", direction: turn });
        const before = s.moves;
        for (let frame = 0; frame < 30 && s.moves === before && s.phase === "play" && s.respawn === 0; frame++)
          s = railStep(s, tick, 1 / 60);
      }
      expect(validRail(s), `${level.id} ${s.moves}`).toBe(true);
    }
    expect(railResult(s)).toMatchObject({ cleared: true, stars: 3 });
  });
});
describe("Crab hops, visible geometry and lives", () => {
  it("starts on down, moves between cells for 120ms, buffers two hops and preserves fractional x", () => {
    const s = { ...createCrab(crabLevel("w1-1"), 42), x: 4.49, y: 5 },
      a = crabTransition(s, { type: "hop", direction: "up" });
    expect(a.x).toBe(4.49);
    expect(a.hop?.toX).toBe(4.49);
    const half = crabStep(a, tick, CRAB_HOP / 2);
    expect(crabPosition(half)).toMatchObject({ x: 4.49, y: 4.5 });
    expect(crabPosition(half).arc).toBeCloseTo(0.18);
    const b = crabTransition(crabTransition(a, { type: "hop", direction: "left" }), { type: "hop", direction: "up" });
    expect(b.queue).toEqual(["left", "up"]);
    expect(crabTransition(b, { type: "hop", direction: "right" })).toBe(b);
    expect(crabTransition(s, { type: "hop", direction: "right" }).hop?.toX).toBe(5.49);
  });
  it("integrates ramps without teleporting objects, carries riders, and uses exact deck margins", () => {
    const s = createCrab(crabLevel("w3-1"), 7),
      log = crabLanes(s).find((l) => l.row === 4)!,
      x = laneObjects(log, 0).find((x) => x >= 1 && x <= 7)!;
    const rider = crabStep({ ...s, x, y: 4 }, tick, 1 / 60);
    expect(rider.x).toBeCloseTo(x + (log.speed * crabPace(s)) / 60);
    expect(rider.bumps).toBe(0);
    expect(supported(log, x + log.span / 2 - CRAB_RX - 0.001, 0)).toBe(true);
    expect(supported(log, x + log.span / 2 - CRAB_RX + 0.001, 0)).toBe(false);
    expect(laneObjects(log, s.travel)).toEqual(laneObjects(crabLanes({ ...s, furthest: 0, crossed: 2 })[3], s.travel));
    const helper = crabTransition(s, { type: "helper", value: true });
    expect(laneObjects(crabLanes(helper)[0], helper.travel)).toEqual(laneObjects(crabLanes(s)[0], s.travel));
    expect(crabPace(helper)).toBeLessThan(crabPace(s));
  });
  it("splat/splash originate at impact, cost a heart and return to the current zone", () => {
    for (const helper of [false, true]) {
      const s = createCrab(crabLevel("w3-1"), 7, helper),
        bus = crabLanes(s).find((l) => l.kind === "bus")!,
        x = laneObjects(bus, 0).find((x) => x > 1 && x < 7)!;
      const hit = crabStep({ ...s, x, y: 7 }, tick, 1 / 60);
      expect(hit.lives.hearts).toBe(s.lives.hearts - 1);
      expect(hit.impact.kind).toBe("splat");
      expect(hit.impact.x).toBeCloseTo(x);
      expect(hit.y).toBe(10);
      const log = crabLanes(s).find((l) => l.row === 4)!,
        gap = Array.from({ length: 81 }, (_, i) => i / 10).find((x) => !supported(log, x, 0))!;
      const splash = crabStep({ ...s, x: gap, y: 4 }, tick, 1 / 60);
      expect(splash.impact.kind).toBe("splash");
      expect(splash.y).toBe(5);
      expect(splash.shield).toBe(1.2);
      expect(splash.respawn).toBe(0.3);
    }
  });
  it("reaches game over in 3/5 hits and keeps the terminal state stable", () => {
    for (const helper of [false, true]) {
      let s = createCrab(crabLevel("w1-1"), 7, helper);
      for (let i = 0; i < (helper ? 5 : 3); i++) {
        const l = crabLanes(s)[0],
          x = laneObjects(l, s.travel).find((x) => x > 1 && x < 7)!;
        s = crabStep({ ...s, x, y: 8, respawn: 0, shield: 0, lives: { ...s.lives, invulnerable: 0 } }, tick, 1 / 60);
      }
      expect(crabResult(s)).toMatchObject({ outcome: "game-over", stars: 0 });
      expect(crabStep(s, tick, 1 / 60)).toBe(s);
    }
  });
  it("animates learning while traffic stays still; wrong stones never spend lives", () => {
    const s = createCrab(crabLevel("learn-1"), 2),
      a = crabTransition(s, { type: "hop", direction: "up" }),
      b = crabStep(a, tick, 0.06);
    expect(crabPosition(b).y).toBe(9.5);
    expect(b.travel).toBe(0);
    const wrong = crabTransition({ ...s, x: 3 }, { type: "hop", direction: "up" });
    expect(wrong.bumps).toBe(1);
    expect(wrong.lives).toBe(s.lives);
    expect(wrong.hop).toBeNull();
    expect(crabLevel("learn-6").numbers).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45]);
  });
  it("rejects malformed states and has finite skill-based hop pars", () => {
    const s = createCrab(crabLevel("w1-1"), 1),
      l = crabConfig(s),
      win = { ...s, phase: "cleared" as const, crossed: l.target, y: 0, score: l.target * 100, hops: l.par };
    expect(crabResult(win)?.stars).toBe(3);
    expect(crabResult({ ...win, hops: l.par + 1 })?.stars).toBe(2);
    expect(crabResult({ ...win, bumps: 2 })?.stars).toBe(1);
    for (const bad of [
      null,
      {},
      { ...s, x: Infinity },
      { ...s, hop: { fromX: 1 } },
      { ...s, lives: { ...s.lives, hearts: -1 } },
      { ...s, shield: 0.5 },
      { ...s, phase: "rest" },
      { ...s, impact: null },
      { ...s, score: 99 },
      { ...s, cursor: 1 },
      { ...s, level: { ...l, speed: -1 } },
      { ...s, extra: true },
    ])
      expect(validCrab(bad)).toBe(false);
    for (const dt of [NaN, Infinity, -1, 0]) expect(crabStep(s, tick, dt)).toBe(s);
    expect(s).toEqual(createCrab(l, 1));
  });
});
describe("Crab deterministic completion fixtures", () => {
  it.each(crabLevels)(
    "clears $id through actual hops and moving lanes",
    (level) => {
      let s = createCrab(level, 120);
      if (level.world === "learn") {
        for (const target of level.stones) {
          while (Math.abs(s.x - target) > 0.01)
            s = crabAdvance(crabTransition(s, { type: "hop", direction: s.x < target ? "right" : "left" }));
          s = crabAdvance(crabTransition(s, { type: "hop", direction: "up" }));
          expect(validCrab(s)).toBe(true);
        }
        s = crabAdvance(crabTransition(s, { type: "hop", direction: "up" }));
      } else
        for (let crossing = 0; crossing < level.target; crossing++) {
          const path = crossingPath(s);
          for (const d of path) {
            s = crabAdvance(d === "wait" ? s : crabTransition(s, { type: "hop", direction: d }));
            expect(validCrab(s), `${level.id} ${JSON.stringify(s)}`).toBe(true);
          }
          if (s.phase === "play") s = crabAdvance(s, 12);
        }
      expect(crabResult(s)).toMatchObject({ cleared: true, stars: 3 });
    },
    30000
  );
});
describe("grid progress remains validated and monotone", () => {
  it.each(["rail-parade", "crab-crossing"] as const)(
    "keeps %s stars after a loss and round-trips extended IDs",
    (game) => {
      let s = arcadeTransition({ ...emptyArcade(), unlockAll: true }, "family", {
        type: "finish",
        game,
        level: "w6-8",
        score: 200,
        stars: 3,
        round: "grid-feel-win",
        name: "Family",
      });
      expect(validArcade(s)).toBe(true);
      expect(validArcade(JSON.parse(JSON.stringify(s)))).toBe(true);
      s = arcadeTransition(s, "family", {
        type: "finish",
        game,
        level: "w6-8",
        score: 0,
        stars: 0,
        round: "grid-feel-loss",
        name: "Family",
      });
      expect(s.people.family.games[game]?.stars["w6-8"]).toBe(3);
    }
  );
});
