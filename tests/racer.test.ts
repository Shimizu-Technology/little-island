import { describe, expect, it } from "vitest";
import { COURSES, raceCourse } from "../src/racer/courses";
import {
  advanceRace,
  createRaceSession,
  mergeRaceRecord,
  obstaclePosition,
  pauseRace,
  raceBotInput,
  racePlacement,
  raceRecord,
  formatRaceTime as raceTime,
  RACE_HZ,
  RACE_LIMIT_TICKS,
  startRace,
  stepRace,
  stepFinishers,
  COYOTE_TICKS,
  JUMP_BUFFER_TICKS,
  validRaceRecord,
  validRaceRecords,
  validRaceSession,
} from "../src/racer/engine";
function autopilot(course: (typeof COURSES)[number]["id"], mode: "practice" | "race" = "race", seed = 1) {
  let s = startRace(createRaceSession(course, mode, seed, "fixture"));
  while (s.status === "running") s = stepRace(s, raceBotInput(s.runners[0], raceCourse(course), s.tick + 1));
  return s;
}
describe("Island race physics, courses and truthful results", () => {
  it.each(COURSES.map((c) => c.id))("finishes %s through the same run/jump controls with real CPU positions", (id) => {
    const s = autopilot(id);
    expect(s.status, JSON.stringify(s.runners)).toBe("finished");
    expect(s.tick).toBeLessThan(60 * RACE_HZ);
    expect(s.runners[0].x).toBe(raceCourse(id).length);
    expect(s.runners[0].checkpoint).toBe(raceCourse(id).checkpoints.length - 1);
    expect(validRaceSession(s)).toBe(true);
    expect(validRaceRecord(raceRecord(s))).toBe(true);
    expect(raceRecord(s)?.placement).toBe(
      1 + s.runners.slice(1).filter((r) => r.finishTick !== null && r.finishTick < s.tick).length
    );
  });
  it("all authored courses remain traversable across opponent seeds", () => {
    for (const c of COURSES)
      for (let seed = 0; seed < 16; seed++) {
        const s = autopilot(c.id, "race", seed);
        expect(s.status, `${c.id} seed ${seed}: ${JSON.stringify(s.runners)}`).toBe("finished");
        expect(s.runners[0].falls).toBeLessThan(10);
      }
  });
  it("CPU contenders finish by physical traversal with different actual times", () => {
    let s = startRace(createRaceSession("lagoon", "race", 3));
    for (let i = 0; i < 60 * RACE_HZ; i++) s = stepRace(s, { direction: 0 });
    expect(s.runners[0].x).toBe(1);
    expect(s.runners.slice(1).every((r) => r.finishTick !== null)).toBe(true);
    expect(new Set(s.runners.slice(1).map((r) => r.finishTick)).size).toBeGreaterThan(1);
    expect(racePlacement(s)).toBe(4);
    expect(raceRecord(s)).toBeNull();
  });
  it("jumping requires ground, gravity returns to it and jump spam cannot fly", () => {
    let s = startRace(createRaceSession());
    s = stepRace(s, { direction: 0, jump: true });
    const first = s.runners[0];
    expect(first.y).toBeGreaterThan(0);
    expect(first.vy).toBeGreaterThan(0);
    for (let i = 0; i < 20; i++) s = stepRace(s, { direction: 0, jump: true });
    expect(s.runners[0].y).toBeLessThan(2);
    for (let i = 0; i < 60; i++) s = stepRace(s, { direction: 0 });
    expect(s.runners[0].y).toBe(0);
    expect(s.runners[0].grounded).toBe(true);
  });
  it("walking into a hurdle causes real checkpoint recovery without advancing flags", () => {
    let s = startRace(createRaceSession());
    while (s.runners[0].falls === 0 && s.tick < 200) s = stepRace(s, { direction: 1 });
    expect(s.runners[0].falls).toBe(1);
    expect(s.runners[0].checkpoint).toBe(0);
    expect(s.runners[0].x).toBe(1);
    expect(s.runners[0].recovery).toBeGreaterThan(0);
    const next = stepRace(s, { direction: 1, jump: true });
    expect(next.runners[0].x).toBe(1);
    expect(next.tick).toBe(s.tick + 1);
  });
  it("water gaps reset to the latest reached checkpoint", () => {
    let s = startRace(createRaceSession());
    s.runners[0] = { ...s.runners[0], x: 15.8, checkpoint: 1, vx: 4.8 };
    while (s.runners[0].falls === 0 && s.tick < 180) s = stepRace(s, { direction: 1 });
    expect(s.runners[0].falls).toBe(1);
    expect(s.runners[0].x).toBe(12);
    expect(s.runners[0].checkpoint).toBe(1);
  });
  it("rollers change position and gates change collision height deterministically", () => {
    const roller = raceCourse("lagoon").obstacles.find((o) => o.kind === "roller")!;
    const gate = raceCourse("canopy").obstacles.find((o) => o.kind === "gate")!;
    expect(obstaclePosition(roller, 0).x).not.toBe(obstaclePosition(roller, 30).x);
    expect(obstaclePosition(gate, 0).height).not.toBe(obstaclePosition(gate, 60).height);
    expect(obstaclePosition(gate, 60)).toEqual(obstaclePosition(gate, 60));
  });
  it("stops the clock and all CPU simulation during pause, including round-trip recovery", () => {
    let s = startRace(createRaceSession("canopy", "race"));
    for (let i = 0; i < 110; i++) s = stepRace(s, raceBotInput(s.runners[0], raceCourse(s.course), s.tick));
    const p = pauseRace(s),
      restored = JSON.parse(JSON.stringify(p));
    expect(validRaceSession(restored), JSON.stringify(restored)).toBe(true);
    expect(stepRace(p, { direction: 1, jump: true })).toBe(p);
    expect(stepRace(startRace(restored), { direction: 0 })).toEqual(stepRace(startRace(p), { direction: 0 }));
  });
  it("fixed-step catchup matches exactly and bounds a long frame", () => {
    const initial = startRace(createRaceSession());
    let exact = initial;
    for (let i = 0; i < 6; i++) exact = stepRace(exact, { direction: 1, jump: i === 0 });
    expect(advanceRace(initial, { direction: 1, jump: true }, 0.1).session).toEqual(exact);
    expect(advanceRace(initial, { direction: 1 }, 1000).session).toEqual(pauseRace(initial));
    expect(advanceRace(initial, { direction: 1 }, 1000).interrupted).toBe(true);
    expect(advanceRace(initial, { direction: 1 }, Number.NaN).session.tick).toBe(0);
  });
  it("race limit is a terminal loss, finishing is terminal, and retry gets a fresh identity", () => {
    let s = startRace(createRaceSession("lagoon", "race"));
    s = { ...s, tick: RACE_LIMIT_TICKS - 1 };
    s = stepRace(s, { direction: 0 });
    expect(s.status).toBe("timedout");
    expect(validRaceSession(s)).toBe(true);
    expect(stepRace(s, { direction: 1 })).toBe(s);
    const won = autopilot("training");
    expect(stepRace(won, { direction: -1 })).toBe(won);
    expect(createRaceSession().id).not.toBe(createRaceSession().id);
  });
  it("records are idempotent and keep separate practice/race and course bests", () => {
    const race = raceRecord(autopilot("lagoon"))!,
      practice = raceRecord(autopilot("lagoon", "practice"))!;
    const one = mergeRaceRecord({}, race);
    expect(mergeRaceRecord(one, race)).toBe(one);
    expect(validRaceRecords(one)).toBe(true);
    expect(validRaceRecords({ wrong: race })).toBe(false);
    expect(mergeRaceRecord(one, { ...race, ticks: race.ticks + 1 })).toBe(one);
    expect(Object.keys(mergeRaceRecord(one, practice))).toHaveLength(2);
    expect(mergeRaceRecord(one, { ...race, ticks: race.ticks - 1 })["lagoon:race"]?.ticks).toBe(race.ticks - 1);
  });
  it("rejects malformed, unsupported, oversized and impossible session fields", () => {
    const s = createRaceSession("lagoon", "race");
    for (const patch of [
      { schema: 2 },
      { course: "unknown" },
      { mode: "online" },
      { id: "x".repeat(121) },
      { tick: Infinity },
      { seed: -1 },
      { runners: [] },
      { status: "finished" },
    ])
      expect(validRaceSession({ ...s, ...patch })).toBe(false);
    for (const patch of [
      { x: Infinity },
      { speed: 999 },
      { checkpoint: 99 },
      { vy: NaN },
      { falls: -1 },
      { finishTick: 1 },
      { recovery: 100 },
    ])
      expect(validRaceSession({ ...s, runners: [{ ...s.runners[0], ...patch }, ...s.runners.slice(1)] })).toBe(false);
    expect(validRaceRecord({ ...raceRecord(autopilot("training")), entrants: 99 })).toBe(false);
  });
});

it("can pause, validate and resume every airborne finish-line crossing", () => {
  for (const course of COURSES) {
    let s = startRace(createRaceSession(course.id, "practice"));
    const ground = course.platforms.find((p) => p.from <= course.length && p.to >= course.length)!;
    s = { ...s, runners: [{ ...s.runners[0], x: course.length - 0.5, y: ground.y, vx: 4.8, grounded: true }] };
    s = stepRace(s, { direction: 1, jump: true });
    for (let i = 0; i < 90 && s.status === "running"; i++) {
      expect(validRaceSession(s)).toBe(true);
      const paused = pauseRace(s);
      expect(validRaceSession(paused)).toBe(true);
      s = stepRace(startRace(paused), { direction: 1 });
    }
    expect(s.status).toBe("finished");
    expect(validRaceSession(s)).toBe(true);
  }
});

describe("Quality edition: fair time, forgiving input and meaningful routes", () => {
  it.each([1 / 60, 1 / 30, 0.1, 0.2, 0.4, 0.5])("keeps the complete clock at %s second frame intervals", (interval) => {
    let s = startRace(createRaceSession("training", "practice"));
    let remainder = 0;
    const frames = Math.round(60 / interval);
    for (let i = 0; i < frames; i++) {
      const result = advanceRace(s, { direction: 0 }, interval, remainder);
      expect(result.interrupted).toBe(false);
      s = result.session;
      remainder = result.remainder;
    }
    expect(s.tick).toBe(3600);
    expect(s.status).toBe("running");
  });
  it("handles a slow collision frame identically to thirty safe substeps", () => {
    const initial = startRace(createRaceSession());
    initial.runners[0] = { ...initial.runners[0], x: 6.9, vx: 4.8 };
    let exact = initial;
    for (let i = 0; i < 30; i++) exact = stepRace(exact, { direction: 1 });
    const slow = advanceRace(initial, { direction: 1 }, 0.5);
    expect(slow.session).toEqual(exact);
    expect(slow.session.runners[0].falls).toBe(1);
  });
  it("preserves a jump request across sub-frame updates and buffers it just before landing", () => {
    const s = startRace(createRaceSession());
    s.runners[0] = { ...s.runners[0], y: 0.04, vy: -1, grounded: false };
    const noStep = advanceRace(s, { direction: 0, jump: true }, 0.001);
    expect(noStep.session).toBe(s); // the UI retains its input until a step consumes it
    let next = stepRace(s, { direction: 0, jump: true });
    expect(next.runners[0].jumpBuffer).toBe(JUMP_BUFFER_TICKS);
    while (!next.runners[0].grounded) next = stepRace(next, { direction: 0 });
    next = stepRace(next, { direction: 0 });
    expect(next.runners[0].vy).toBeGreaterThan(0);
    expect(next.runners[0].jumpBuffer).toBe(0);
  });
  it("allows one edge-grace jump but never grants a second midair jump", () => {
    let s = startRace(createRaceSession());
    s.runners[0] = { ...s.runners[0], x: 15.99, vx: 4.8 };
    for (let i = 0; i < 8 && s.runners[0].grounded; i++) s = stepRace(s, { direction: 1 });
    expect(s.runners[0].grounded).toBe(false);
    expect(s.runners[0].coyote).toBeGreaterThan(0);
    s = stepRace(s, { direction: 1, jump: true });
    const vy = s.runners[0].vy;
    expect(vy).toBeGreaterThan(8);
    s = stepRace(s, { direction: 1, jump: true });
    expect(s.runners[0].vy).toBeLessThan(vy);
    expect(s.runners[0].coyote).toBe(0);
    expect(validRaceSession(s)).toBe(true);
  });
  it("expires late jump grace and clears buffered input during checkpoint recovery", () => {
    let s = startRace(createRaceSession());
    s.runners[0] = { ...s.runners[0], x: 16.3, y: -0.2, grounded: false, coyote: 1 };
    s = stepRace(s, { direction: 0 });
    s = stepRace(s, { direction: 0, jump: true });
    expect(s.runners[0].vy).toBeLessThan(0);
    s.runners[0] = { ...s.runners[0], y: -2.99, vy: -5 };
    s = stepRace(s, { direction: 0, jump: true });
    expect(s.runners[0].recovery).toBe(42);
    expect(s.runners[0].jumpBuffer).toBe(0);
    expect(s.runners[0].coyote).toBe(0);
  });
  it("offers a real high bridge route while the lower route remains open", () => {
    const course = raceCourse("lagoon");
    expect(course.platforms.some((p) => p.oneWay)).toBe(true);
    let high = startRace(createRaceSession("lagoon", "practice"));
    high.runners[0] = { ...high.runners[0], x: 22.1, vx: 4.8, checkpoint: 1 };
    high = stepRace(high, { direction: 1, jump: true });
    for (let i = 0; i < 50 && !high.runners[0].grounded; i++) high = stepRace(high, { direction: 1 });
    expect(high.runners[0].y).toBeCloseTo(1.05);
    expect(high.runners[0].grounded).toBe(true);
    expect(high.runners[0].falls).toBe(0);
    let low = startRace(createRaceSession("lagoon", "practice"));
    low.runners[0] = { ...low.runners[0], x: 22.1, vx: 4.8, checkpoint: 1 };
    for (let i = 0; i < 20; i++) low = stepRace(low, { direction: 1 });
    expect(low.runners[0].x).toBeGreaterThan(23);
    expect(low.runners[0].y).toBe(0);
    expect(low.runners[0].falls).toBe(0);
    // A later jump clears the moving coconut and lands back on the lower trail;
    // the bridge must not silently capture every possible successful jump.
    while (low.runners[0].x < 24.75) low = stepRace(low, { direction: 1 });
    low = stepRace(low, { direction: 1, jump: true });
    let reachedBridge = false;
    for (let i = 0; i < 65 && !low.runners[0].grounded; i++) {
      low = stepRace(low, { direction: 1 });
      if (low.runners[0].grounded && low.runners[0].y > 0) reachedBridge = true;
    }
    expect(low.runners[0].falls).toBe(0);
    expect(low.runners[0].y).toBe(0);
    expect(reachedBridge).toBe(false);
  });
  it("runs slower opponents to their own physical finishes after your result is locked", () => {
    let s = startRace(createRaceSession("lagoon", "race"));
    const length = raceCourse(s.course).length;
    s.runners[0] = { ...s.runners[0], x: length - 0.01, vx: 4.8 };
    s = stepRace(s, { direction: 1 });
    expect(s.status).toBe("finished");
    const record = raceRecord(s),
      player = s.runners[0];
    let guard = 0;
    while (s.runners.some((r) => r.finishTick === null) && guard++ < 4000) s = stepFinishers(s);
    expect(s.runners.every((r) => r.finishTick !== null)).toBe(true);
    expect(s.runners.slice(1).every((r) => r.finishTick! > player.finishTick!)).toBe(true);
    expect(s.runners[0]).toBe(player);
    expect(raceRecord(s)).toEqual(record);
    expect(stepFinishers(s)).toBe(s);
    expect(validRaceSession(s)).toBe(true);
  });
  it("never simulates a finisher beyond the race deadline or while a race is paused", () => {
    const paused = pauseRace(startRace(createRaceSession("lagoon", "race")));
    expect(stepFinishers(paused)).toBe(paused);
    const s = { ...paused, tick: RACE_LIMIT_TICKS, status: "finished" as const };
    s.runners[0] = { ...s.runners[0], x: raceCourse(s.course).length, finishTick: 100 };
    expect(stepFinishers(s)).toBe(s);
  });
  it("preserves frozen original saves and distinguishes records across course editions", () => {
    const legacy = createRaceSession("canopy", "race");
    delete legacy.edition;
    legacy.runners.forEach((r, i) => {
      if (i > 0) r.speed = 4.25 + ((legacy.seed + i * 17) % 9) * 0.09;
    });
    expect(validRaceSession(JSON.parse(JSON.stringify(legacy)))).toBe(true);
    expect(raceCourse("canopy", 1).platforms.every((p) => !p.oneWay)).toBe(true);
    expect(raceCourse("canopy", 2).platforms.some((p) => p.oneWay)).toBe(true);
    const fresh = raceRecord(autopilot("canopy"))!;
    const old = { ...fresh, ticks: 1 };
    delete old.edition;
    const records = mergeRaceRecord({}, old);
    const next = mergeRaceRecord(records, fresh);
    expect(next["canopy:race"]).toEqual(fresh);
    expect(mergeRaceRecord(next, old)).toBe(next);
    expect(validRaceRecords(next)).toBe(true);
    let running = startRace(legacy);
    for (let i = 0; i < 100; i++)
      running = stepRace(running, raceBotInput(running.runners[0], raceCourse("canopy", 1), running.tick));
    expect(validRaceSession(running)).toBe(true);
  });
  it("rejects malformed optional compatibility and input-grace fields", () => {
    const s = startRace(createRaceSession());
    for (const patch of [
      { jumpBuffer: JUMP_BUFFER_TICKS + 1 },
      { coyote: COYOTE_TICKS + 1 },
      { landedAt: 1 },
      { jumpBuffer: 0.5 },
      { coyote: NaN },
    ]) {
      expect(validRaceSession({ ...s, runners: [{ ...s.runners[0], ...patch }] })).toBe(false);
    }
    expect(validRaceSession({ ...s, edition: 3 })).toBe(false);
    expect(validRaceRecord({ ...raceRecord(autopilot("training")), edition: 3 })).toBe(false);
  });
});

it("all course opponents physically finish across varied seeds and save at every checkpoint", () => {
  for (const course of COURSES.filter((c) => c.id !== "training")) {
    for (let seed = 0; seed < 9; seed++) {
      let s = startRace(createRaceSession(course.id, "race", seed));
      let checkpoint = 0;
      while (s.status === "running") {
        s = stepRace(s, raceBotInput(s.runners[0], course, s.tick + 1));
        if (s.runners[0].checkpoint !== checkpoint) {
          checkpoint = s.runners[0].checkpoint;
          expect(validRaceSession(JSON.parse(JSON.stringify(pauseRace(s))))).toBe(true);
        }
      }
      let limit = 0;
      while (s.runners.some((r) => r.finishTick === null) && limit++ < 4000) s = stepFinishers(s);
      expect(s.status).toBe("finished");
      expect(
        s.runners.every((r) => r.finishTick !== null),
        `${course.id} ${seed}`
      ).toBe(true);
      expect(validRaceSession(s)).toBe(true);
    }
  }
});

it("pausing clears queued jumps while retaining the exact position and edge grace", () => {
  const s = startRace(createRaceSession());
  s.runners[0] = { ...s.runners[0], y: 0.5, grounded: false, jumpBuffer: 6, coyote: 3 };
  const paused = pauseRace(s);
  expect(paused.runners[0].jumpBuffer).toBe(0);
  expect(paused.runners[0].coyote).toBe(3);
  expect(paused.runners[0].x).toBe(s.runners[0].x);
  expect(paused.runners[0].y).toBe(s.runners[0].y);
  expect(stepRace(paused, { direction: 1, jump: true })).toBe(paused);
});

it("a clean edition-2 run can beat every CPU speed without hidden catch-up", () => {
  for (const course of COURSES.filter((c) => c.id !== "training")) {
    for (let seed = 0; seed < 9; seed++) {
      const s = autopilot(course.id, "race", seed);
      expect(racePlacement(s), `${course.id} ${seed}`).toBe(1);
      expect(s.runners.slice(1).every((r) => r.speed < s.runners[0].speed)).toBe(true);
    }
  }
});

it("formats timer rounding across minute boundaries without displaying 0:60", () => {
  expect(raceTime(0)).toBe("0:00.0");
  expect(raceTime(3599)).toBe("1:00.0");
  expect(raceTime(3600)).toBe("1:00.0");
  expect(raceTime(RACE_LIMIT_TICKS)).toBe("3:00.0");
});

it("accepts a jump pressed just before recovery ends without carrying a stale early tap", () => {
  const s = startRace(createRaceSession());
  s.runners[0] = { ...s.runners[0], recovery: 2 };
  let next = stepRace(s, { direction: 1, jump: true });
  expect(next.runners[0].x).toBe(1);
  next = stepRace(next, { direction: 1 });
  next = stepRace(next, { direction: 1 });
  expect(next.runners[0].vy).toBeGreaterThan(0);
  s.runners[0] = { ...s.runners[0], recovery: 20 };
  next = stepRace(s, { direction: 0, jump: true });
  for (let i = 0; i < 21; i++) next = stepRace(next, { direction: 0 });
  expect(next.runners[0].y).toBe(0);
});
