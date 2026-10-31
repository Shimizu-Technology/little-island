import { describe, expect, it } from "vitest";
import { allLevelIds } from "../src/arcade/types";
import {
  createPalm,
  palmLevel,
  palmLevels,
  palmMarchSpeed,
  palmResult,
  palmStep,
  palmTransition,
  validPalm,
  FIRE_SECONDS,
  HUSK_SPEED,
  type PalmState,
} from "../src/arcade/games/palm-patrol/engine";
import {
  beachConfig,
  beachLevel,
  beachLevels,
  beachResult,
  beachStep,
  beachTransition,
  createBeach,
  paddleWidth,
  reflectedX,
  validBeach,
  BEACH_CAP,
  type BeachState,
  type Ball,
} from "../src/arcade/games/beach-ball/engine";
import { arenaTransform, arenaPoint, arenaTouch, PADDLE_CONTACT } from "../src/arcade/action/arena";
import { mapSeatPointers, palmFrameStep, beachFrameStep } from "../src/arcade/action/controls";
import { arcadeLearner, arcadeTransition, emptyArcade, validArcade } from "../src/arcade/progress";
import { emptySave, parseSave } from "../src/state/validation";
const tick = { type: "tick" } as const;
function palmPilot(initial: PalmState, lead = true) {
  let s = initial;
  for (let i = 0; i < 40000 && s.phase === "play"; i++) {
    const learning = s.level !== "endless" && s.level.world === "learn";
    const b = s.beetles.filter((b) => !b.caught && (!learning || b.value === s.answer)).sort((a, b) => b.y - a.y)[0];
    if (b) {
      const dx = lead && !learning && !b.diving ? (s.direction * palmMarchSpeed(s) * (532 - b.y)) / HUSK_SPEED : 0;
      let x = b.x + dx;
      if (x > 335 || x < 25) x = b.x - dx;
      s = palmTransition(palmTransition(s, { type: "move", x }), { type: "toss" });
    }
    s = palmStep(s, tick, 1 / 60);
  }
  return s;
}
function beachPilot(initial: BeachState) {
  let s = initial;
  for (let i = 0; i < 40000 && s.phase === "play"; i++) {
    const b = s.balls.filter((b) => b.vy > 0).sort((a, b) => (513 - a.y) / a.vy - (513 - b.y) / b.vy)[0] ?? s.balls[0];
    const aim = reflectedX(b.x + b.vx * Math.max(0, (513 - b.y) / Math.max(1, b.vy)));
    s = beachTransition(s, { type: "paddle", seat: 0, x: aim + (aim > 180 ? -29 : 29) });
    s = beachStep(s, tick, 1 / 60);
    if (i % 500 === 0) expect(validBeach(s), `${s.level === "endless" ? "free" : s.level.id} @${i}`).toBe(true);
  }
  return s;
}
const ball = (v: Partial<Ball> = {}): Ball => ({ x: 180, y: 300, vx: 0, vy: 250, wait: 0, spin: 0, squash: 0, ...v });
describe("uniform action camera and pointer ownership", () => {
  for (const [w, h] of [
    [390, 782],
    [1024, 706],
    [768, 962],
    [844, 328],
  ])
    it(`shares one scale at ${w}×${h}`, () => {
      const a = arenaTransform(w, h);
      expect(a.width).toBeCloseTo(360 * a.scale);
      expect(a.height).toBeCloseTo(600 * a.scale);
      const p = arenaPoint(a, 123, 535);
      expect(arenaTouch(a, p.x, p.y).x).toBeCloseTo(123);
      expect(arenaTouch(a, p.x, p.y).y).toBeCloseTo(535);
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(arenaPoint(a, 0, PADDLE_CONTACT[0]).y - arenaPoint(a, 0, 525).y).toBeCloseTo(-12 * a.scale);
    });
  it("keeps independent seats across centre, ignores an extra finger and releases one owner at a time", () => {
    const a = arenaTransform(360, 600);
    let m = mapSeatPointers(
      { owners: [null, null], seats: {} },
      { 8: { x: 80, y: 540, down: true }, 3: { x: 260, y: 65, down: true } },
      a
    );
    expect(m.owners).toEqual([8, 3]);
    m = mapSeatPointers(
      m,
      { 8: { x: 90, y: 50, down: true }, 3: { x: 250, y: 550, down: true }, 9: { x: 40, y: 550, down: true } },
      a
    );
    expect(m.owners).toEqual([8, 3]);
    m = mapSeatPointers(m, { 3: { x: 250, y: 550, down: true }, 9: { x: 40, y: 550, down: true } }, a);
    expect(m.owners).toEqual([null, 3]);
    expect(mapSeatPointers(m, {}, a)).toEqual({ owners: [null, null], seats: {} });
  });
});
describe("Palm Patrol feel rules", () => {
  it("authors 56 valid levels with six escalating world twists and final crowns", () => {
    expect(palmLevels.map((l) => l.id)).toEqual(allLevelIds);
    for (const l of palmLevels) {
      expect(l.goals).toHaveLength(3);
      expect(validPalm(createPalm(l, 12))).toBe(true);
    }
    expect(palmLevel("w1-1").count).toBe(5);
    expect(palmLevel("w1-1").waves).toBe(1);
    expect(palmLevel("w2-1").divers).toBe(true);
    expect(palmLevel("w3-1").armored).toBe(true);
    expect(palmLevel("w4-8").diveEvery).toBeLessThan(palmLevel("w2-1").diveEvery);
    expect(palmLevel("w5-1").shieldGap).toBe(0);
    expect(palmLevel("w4-1").aimed).toBe(true);
    expect(palmLevel("w3-8").aimed).toBe(false);
    for (let w = 1; w <= 6; w++) expect(palmLevel(`w${w}-8` as never).boss).toBe(true);
  });
  it("clears all 56 levels through aim/fire and fixed steps, with and without Helper", () => {
    for (const l of palmLevels)
      for (const helper of [false, true]) {
        const s = palmPilot(createPalm(l, 42, helper));
        expect(s.phase, `${l.id}, helper=${helper}`).toBe("cleared");
        expect(validPalm(s), l.id).toBe(true);
        expect(palmResult(s)?.stars).toBeGreaterThan(0);
      }
    expect(palmPilot(createPalm(palmLevel("w4-4"), 71))).toEqual(palmPilot(createPalm(palmLevel("w4-4"), 71)));
  });
  it("marches together, descends on edges, thins faster and ramps inside a wave", () => {
    const s = createPalm(palmLevel("w1-1"), 4),
      next = palmStep(s, tick, 1 / 60);
    expect(next.beetles[1].x - next.beetles[0].x).toBeCloseTo(52);
    expect(next.beetles[0].x).toBeGreaterThan(s.beetles[0].x);
    const edge = palmStep({ ...s, beetles: s.beetles.map((b) => ({ ...b, x: b.x + 51 })) }, tick, 0.1);
    expect(edge.direction).toBe(-1);
    expect(edge.beetles[0].y).toBe(s.beetles[0].y + palmLevel("w1-1").descent);
    expect(palmMarchSpeed({ ...s, beetles: s.beetles.slice(0, 2) })).toBeGreaterThan(palmMarchSpeed(s) * 1.4);
    expect(palmMarchSpeed({ ...s, waveTime: 22 })).toBeCloseTo(palmMarchSpeed(s) * 1.2);
  });
  it("hold fires immediately and every .22s; buffered short taps survive finger-up", () => {
    let s = createPalm(palmLevel("w1-1"), 4);
    const input = { x: 120, down: true, taps: 1, helper: false, finish: false };
    s = palmFrameStep(s, input, 1 / 60);
    expect(s.shots).toBe(1);
    expect(s.husks[0].x).toBe(120);
    for (let i = 0; i < 60; i++) s = palmFrameStep(s, input, 1 / 60);
    expect(s.shots).toBe(5);
    expect(s.cooldown).toBeLessThanOrEqual(FIRE_SECONDS);
    const before = s.shots;
    for (let i = 0; i < 30; i++) s = palmFrameStep(s, { ...input, down: false }, 1 / 60);
    expect(s.shots).toBe(before);
    s = palmFrameStep(s, { ...input, down: false, taps: 2 }, 1 / 60);
    expect(s.shots).toBe(before + 1);
  });
  it("uses 3/5 hearts, grace, shared hit events and terminal retry without refills from Helper", () => {
    for (const helper of [false, true]) {
      let s = createPalm(palmLevel("w4-1"), 4, helper);
      expect(s.lives.hearts).toBe(helper ? 5 : 3);
      s = { ...s, shields: [0, 0, 0], beetles: s.beetles.map((b) => ({ ...b, y: 521 })) };
      s = palmStep(s, tick, 1 / 60);
      expect(s.lives.hit).toBe(1);
      expect(s.lives.hearts).toBe(helper ? 4 : 2);
      expect(s.lives.invulnerable).toBe(1.2);
      expect(s.cue).toBe("hit");
      s = palmStep({ ...s, beetles: s.beetles.map((b) => ({ ...b, y: 521 })) }, tick, 1 / 60);
      expect(s.lives.hit).toBe(1);
      for (let i = 0; i < 40000 && s.phase === "play"; i++) s = palmStep(s, tick, 1 / 60);
      expect(s.lives.hearts).toBe(0);
      expect(palmResult(s)?.outcome).toBe("game-over");
      expect(palmStep(s, tick, 1 / 60)).toBe(s);
      expect(createPalm(s.level, 4, helper).lives.hearts).toBe(helper ? 5 : 3);
    }
    let s = createPalm(palmLevel("w1-1"), 4);
    s.lives = { ...s.lives, hearts: 2, hit: 1 };
    s = palmTransition(s, { type: "helper", value: true });
    expect(s.lives.hearts).toBe(4);
    s = palmTransition(s, { type: "helper", value: false });
    expect(s.lives.hearts).toBe(2);
    expect(s.helped).toBe(true);
  });
  it("separates shield, armoured bonk and net events at the contact location", () => {
    const base = createPalm(palmLevel("w3-1"), 1);
    const shield = palmStep({ ...base, beetles: [{ ...base.beetles[0], x: 72, y: 454 }] }, tick, 1 / 60);
    expect(shield.cue).toBe("shield");
    expect(shield.lives.hit).toBe(0);
    expect(shield.shields[0]).toBe(2);
    let s = {
      ...base,
      beetles: [{ ...base.beetles[0], hp: 2, x: 180, y: 300 }],
      husks: [{ x: 180, y: 310, bounced: false }],
      shots: 2,
    };
    s = palmStep(s, tick, 1 / 60);
    expect(s.cue).toBe("bonk");
    expect(s.caught).toBe(0);
    s = palmStep({ ...s, husks: [{ x: 180, y: 310, bounced: false }] }, tick, 1 / 60);
    expect(s.cue).toBe("net");
    expect(s.caught).toBe(1);
    expect(s.feedbackY).toBe(300);
  });
  it("keeps all math choices untimed; wrong choices mark assistance and meaningful stars", () => {
    for (const l of palmLevels.filter((l) => l.world === "learn")) {
      let s = createPalm(l, 8);
      const wrong = s.beetles.find((b) => b.value !== s.answer)!;
      s = palmTransition(palmTransition(s, { type: "move", x: wrong.x }), { type: "toss" });
      for (let i = 0; i < 15000; i++) s = palmStep(s, tick, 1 / 60);
      expect(s.fact).toBe(0);
      expect(s.misses).toBe(1);
      expect(s.lives.hearts).toBe(3);
      expect(s.beetles[0].y).toBe(150);
      expect(s.helped).toBe(true);
      expect(palmPilot(s).phase).toBe("cleared");
    }
    const done = palmPilot(createPalm(palmLevel("learn-1"), 7));
    expect(palmResult(done)?.stars).toBe(3);
    expect(palmResult({ ...done, misses: 1 })?.stars).toBe(2);
    expect(palmResult({ ...done, misses: 2 })?.stars).toBe(1);
  });
  it("top stars require accuracy, time and no damage; lower star tiers remain reachable", () => {
    const base = { ...createPalm(palmLevel("w1-1"), 4), phase: "cleared" as const, shots: 20, landed: 15, time: palmLevel("w1-1").par - 1 };
    expect(palmResult(base)?.stars).toBe(3);
    expect(palmResult({ ...base, shots: 100 })?.stars).toBe(2);
    expect(palmResult({ ...base, time: 200 })?.stars).toBe(2);
    expect(palmResult({ ...base, lives: { ...base.lives, hearts: 2, hit: 1 } })?.stars).toBe(2);
    expect(palmResult({ ...base, lives: { ...base.lives, hearts: 1, hit: 2 } })?.stars).toBe(1);
  });
  it("does not mutate inputs, stops voluntary free play and rejects malformed state", () => {
    const s = createPalm(palmLevel("w3-1"), 4),
      saved = JSON.stringify(s);
    palmPilot(s);
    expect(JSON.stringify(s)).toBe(saved);
    expect(palmTransition(s, { type: "move", x: NaN })).toBe(s);
    expect(palmStep(s, tick, Infinity)).toBe(s);
    expect(palmResult(palmTransition(createPalm("endless", 4), { type: "finish" }))?.outcome).toBe("stopped");
    for (const bad of [
      null,
      {},
      { ...s, seed: -1 },
      { ...s, currency: 1 },
      { ...s, level: { ...palmLevel("w3-1"), speed: 99 } },
      { ...s, beetles: [s.beetles[0], s.beetles[0]] },
      { ...s, lives: { ...s.lives, hearts: 6 } },
      { ...s, shields: [9] },
      { ...s, launcher: Infinity },
      { ...s, phase: "win" },
    ])
      expect(validPalm(bad)).toBe(false);
  });
});
describe("Beach Ball feel rules", () => {
  it("authors 56 valid levels and world twists with five/seven-point goals", () => {
    expect(beachLevels.map((l) => l.id)).toEqual(allLevelIds);
    for (const l of beachLevels) {
      expect(validBeach(createBeach(l, 42)), l.id).toBe(true);
      expect(l.goals).toHaveLength(3);
    }
    expect(beachLevel("w1-1").speed).toBe(250);
    expect(beachLevel("w1-1").target).toBe(5);
    expect(beachLevel("w4-1").target).toBe(7);
    expect(beachLevel("w2-1").turtle).toBe(true);
    expect(beachLevel("w3-1").balls).toBe(2);
    expect(beachLevel("w4-1").spin).toBeGreaterThan(0);
    expect(beachLevel("w5-1").gust).toBe(true);
    expect(beachLevel("w6-1").tide).toBe(true);
    expect(beachLevel("learn-1").countBy).toBe(2);
    expect(beachLevel("learn-1").goals[0]).toContain("10 points");
    expect(beachLevel("learn-5").countBy).toBe(5);
    for (const l of beachLevels.filter((l) => l.turtle))
      for (const b of createBeach(l, 42).balls) expect(Math.abs(b.y - 300)).toBeGreaterThan(42);
  });
  it("plays every level to a valid result via paddle inputs, deterministically", () => {
    for (const l of beachLevels) {
      const s = beachPilot(createBeach(l, 42));
      expect(s.phase, l.id).not.toBe("play");
      expect(validBeach(s), l.id).toBe(true);
    }
    const a = beachPilot(createBeach(beachLevel("w1-1"), 17));
    expect(a.phase).toBe("cleared");
    expect(a).toEqual(beachPilot(createBeach(beachLevel("w1-1"), 17)));
  });
  it("starts at centre, serves in .65s, rebounds at the drawn face and adds 4% speed", () => {
    const s = createBeach(beachLevel("w1-1"), 3);
    expect(s.balls[0].x).toBe(180);
    expect(s.balls[0].wait).toBe(0.65);
    expect(Math.hypot(s.balls[0].vx, s.balls[0].vy)).toBeCloseTo(250);
    const hit = beachStep({ ...s, balls: [ball({ x: 210, y: 510 })] }, tick, 1 / 60);
    expect(hit.balls[0].vy).toBeLessThan(0);
    expect(hit.balls[0].vx).toBeGreaterThan(0);
    expect(Math.hypot(hit.balls[0].vx, hit.balls[0].vy)).toBeCloseTo(260);
    expect(hit.hits).toBe(1);
    expect(hit.feedbackY).toBe(525);
    expect(hit.feedbackX).toBeCloseTo(210);
    expect(hit.balls[0].squash).toBe(0.18);
    expect(beachStep({ ...s, balls: [ball({ x: 224, y: 510 })] }, tick, 1 / 60).hits).toBe(0);
    const fast = beachStep({ ...s, balls: [ball({ y: 510, vy: 448 })] }, tick, 1 / 60);
    expect(Math.hypot(fast.balls[0].vx, fast.balls[0].vy)).toBeCloseTo(BEACH_CAP);
  });
  it("handles swept contacts, walls, turtle normals, in-level ramp and local point pops", () => {
    const s = createBeach(beachLevel("w1-1"), 3);
    const swept = beachStep({ ...s, balls: [ball({ x: 140, y: 500, vx: 80, vy: 400 })] }, tick, 0.1);
    expect(swept.hits).toBe(1);
    expect(swept.feedbackX).toBeGreaterThan(142.6);
    expect(swept.feedbackX).toBeLessThan(143);
    expect(beachStep({ ...s, balls: [ball({ x: 347, vx: 200 })] }, tick, 1 / 60).balls[0].vx).toBeLessThan(0);
    const turtle = beachStep({ ...s, level: beachLevel("w2-1"), balls: [ball({ y: 340, vy: -250 })] }, tick, 1 / 60);
    expect(turtle.balls[0].vy).toBeGreaterThan(0);
    expect(turtle.cue).toBe("turtle");
    expect(turtle.feedbackY).toBeCloseTo(330);
    const point = beachStep({ ...s, points: [3, 1], balls: [ball({ y: -11, vy: -250 })] }, tick, 1 / 60);
    expect(point.points).toEqual([4, 1]);
    expect(point.feedbackY).toBe(555);
    expect(point.pulse).toBe(0.45);
    expect(point.balls[0].wait).toBe(0.65);
    expect(Math.hypot(point.balls[0].vx, point.balls[0].vy)).toBeGreaterThan(250);
  });
  it("supports both seats at once, solo ownership, and finite Helper advantages", () => {
    const base = createBeach(beachLevel("w1-1"), 12, false, "together");
    expect(beachFrameStep(base, { x: [80, 260], helper: false, finish: false }, 1 / 60).paddles).toEqual([80, 260]);
    const solo = { ...base, mode: "solo" as const };
    expect(beachTransition(solo, { type: "paddle", seat: 1, x: 20 })).toBe(solo);
    expect(paddleWidth({ ...solo, helper: true }, 1)).toBe(86);
    expect(paddleWidth({ ...base, helper: true }, 1)).toBe(116);
    expect(
      Math.hypot(...[createBeach(base.level, 12, true).balls[0].vx, createBeach(base.level, 12, true).balls[0].vy])
    ).toBeCloseTo(210);
    const x = (["gentle", "steady", "zippy"] as const).map(
      (strength) =>
        beachStep({ ...solo, strength, balls: [ball({ x: 30, y: 200, vy: -250 })] }, tick, 1 / 60).paddles[1]
    );
    expect(x[0]).toBeGreaterThan(x[1]);
    expect(x[1]).toBeGreaterThan(x[2]);
  });
  it("resolves simultaneous match points fairly and keeps point-loss plus skill stars", () => {
    const base = createBeach(beachLevel("w3-1"), 1, false, "together");
    const tied = beachStep(
      { ...base, points: [4, 4], balls: [ball({ y: -11, vy: -250 }), ball({ y: 611, vy: 250 })] },
      tick,
      1 / 60
    );
    expect(tied.points).toEqual([5, 5]);
    expect(tied.phase).toBe("play");
    expect(tied.effects.filter((e) => e.point)).toHaveLength(2);
    const won = beachStep({ ...tied, balls: [ball({ y: -11, vy: -250 })] }, tick, 1 / 60);
    expect(won.winner).toBe(0);
    expect(won.phase).toBe("cleared");
    const loss = beachStep(
      { ...createBeach(beachLevel("learn-5"), 5), points: [0, 4], balls: [ball({ x: 20, y: 611 })] },
      tick,
      1 / 60
    );
    expect(beachResult(loss)?.outcome).toBe("game-over");
    expect(beachResult(loss)?.detail).toContain("0 : 25");
    expect(beachStep(loss, tick, 1 / 60)).toBe(loss);
    expect(createBeach(loss.level, 5).points).toEqual([0, 0]);
    for (const [conceded, stars] of [
      [0, 3],
      [1, 2],
      [2, 1],
    ])
      expect(beachResult({ ...won, points: [5, conceded] })?.stars).toBe(stars);
    expect(beachResult(beachTransition(createBeach("endless", 4), { type: "finish" }))?.outcome).toBe("stopped");
    expect(beachConfig(createBeach("endless", 4)).target).toBe(99999999);
  });
  it("keeps snapshots immutable and rejects hostile state/level/input data", () => {
    const s = createBeach(beachLevel("w3-8"), 4),
      original = JSON.stringify(s);
    beachStep(s, tick, 1 / 60);
    expect(JSON.stringify(s)).toBe(original);
    expect(beachTransition(s, { type: "paddle", seat: 0, x: NaN })).toBe(s);
    expect(beachStep(s, tick, -1)).toBe(s);
    for (const bad of [
      null,
      {},
      { ...s, strength: "impossible" },
      { ...s, time: Infinity },
      { ...s, level: { ...beachLevel("w3-8"), speed: 1 } },
      { ...s, balls: [] },
      { ...s, balls: [{ ...s.balls[0], vx: NaN }] },
      { ...s, points: [-1, 2] },
      { ...s, extra: true },
    ])
      expect(validBeach(bad)).toBe(false);
  });
});
describe("action game saves", () => {
  it("round trips earned progress; loss/retry cannot erase stars; rejects saved live simulations", () => {
    let arcade = emptyArcade();
    for (const game of ["palm-patrol", "beach-ball"] as const) {
      arcade = arcadeTransition(arcade, "family", {
        type: "finish",
        game,
        level: "w1-1",
        stars: 3,
        score: 100,
        round: `round-${game}`,
        name: "Family",
      });
      arcade = arcadeTransition(arcade, "family", {
        type: "finish",
        game,
        level: "w1-1",
        stars: 0,
        score: 120,
        round: `loss-${game}`,
        name: "Family",
      });
      expect(arcadeLearner(arcade).games[game]?.stars["w1-1"]).toBe(3);
    }
    expect(validArcade(arcade)).toBe(true);
    const save = { ...emptySave(), arcade };
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    for (const game of ["palm-patrol", "beach-ball"] as const) {
      const bad = structuredClone(save);
      bad.arcade.people.family.games[game]!.stars["w1-1"] = 4 as never;
      expect(() => parseSave(JSON.stringify(bad))).toThrow();
    }
    expect(() =>
      parseSave(JSON.stringify({ ...save, arcade: { ...arcade, session: createBeach("endless", 3) } }))
    ).toThrow();
  });
});
