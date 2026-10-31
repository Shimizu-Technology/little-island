import { describe, expect, it } from "vitest";
import { HIDDEN_POSE, interpolatePose, interpolatePoses, samePublication } from "../src/arcade/poses";
import { drainCommands, enqueueCommand, type Commands } from "../src/arcade/mailbox";
import { advanceClock, FIXED_DT } from "../src/arcade/clock";
import { createFlight, flightStep, flightTransition } from "../src/arcade/games/fruit-bat-flight/engine";
import { createRun, runStep, runTransition } from "../src/arcade/games/lagoon-run/engine";
import { flightLevels, runLevels } from "../src/arcade/games/scrolling/content";
import { flightFrame } from "../src/arcade/games/scrolling/commands";
import { flightHud, runHud, palmHud, beachHud } from "../src/arcade/publication";
import { createPalm, palmLevels, palmTransition } from "../src/arcade/games/palm-patrol/engine";
import { createBeach, beachLevels } from "../src/arcade/games/beach-ball/engine";
import { worldIds } from "../src/arcade/types";
import { worldPalettes, nightPalettes, worldMotifs, worldIndex } from "../src/arcade/worlds";

describe("fixed-step render interpolation", () => {
  it("lerps translation, scale and opacity and follows the shortest angle", () => {
    const a = { x: 0, y: 10, angle: Math.PI * .95, scale: 1, opacity: .2 };
    const b = { x: 20, y: 30, angle: -Math.PI * .95, scale: 2, opacity: .8 };
    expect(interpolatePose(a, b, .5)).toEqual(expect.objectContaining({ x: 10, y: 20, scale: 1.5, opacity: .5 }));
    expect(interpolatePose(a, b, .5).angle).toBeCloseTo(Math.PI);
    expect(interpolatePose(a, b, -4).x).toBe(0); expect(interpolatePose(a, b, 9).x).toBe(20);
  });
  it("snaps teleports, recycled identities, appearance, disappearance and discrete previews", () => {
    const a = { x: 0, y: 0, identity: 1 };
    for (const b of [{ x: 100, y: 0, identity: 1 }, { x: 1, y: 1, identity: 2 }, { x: 2, y: 2, identity: 1, snap: true }]) expect(interpolatePose(a, b, .5)).toBe(b);
    const b = { x: 3, y: 3, identity: 1 };
    expect(interpolatePose({ ...a, opacity: 0 }, b, .1)).toBe(b);
    expect(interpolatePose(a, { ...b, opacity: 0 }, .5)).toBe(HIDDEN_POSE);
    expect(interpolatePose(undefined, b, .5)).toBe(b);
  });
  it("keeps hidden slots constant and leaves simulation/pose inputs untouched", () => {
    const a = [{ x: 0, y: 0 }, HIDDEN_POSE], b = [{ x: 10, y: 20 }, { x: -5, y: -8, opacity: 0 }];
    const copy = JSON.stringify([a, b]);
    expect(interpolatePoses(a, b, .5)[1]).toBe(HIDDEN_POSE);
    expect(JSON.stringify([a, b])).toBe(copy);
  });
  it("renders intermediate poses at 120 Hz without changing either pure engine's 60 Hz trajectory", () => {
    const play = <S>(initial: S, step: (s: S, dt: number) => S, hz: number) => {
      let s = initial, clock = { remainder: 0, ticks: 0, dropped: 0 };
      for (let n = 0; n < hz * 2; n++) {
        const advance = advanceClock(clock, 1 / hz); clock = advance.clock;
        for (let i = 0; i < advance.steps; i++) s = step(s, FIXED_DT);
        interpolatePoses([{ x: n, y: 0 }], [{ x: n + 1, y: 0 }], clock.remainder / FIXED_DT);
      }
      return s;
    };
    const f = flightTransition(createFlight(flightLevels[0], 42), { type: "flap" }), r = runTransition(createRun(runLevels[0], 42), { type: "jump" });
    expect(play(f, (s, dt) => flightStep(s, { type: "idle" }, dt), 120)).toEqual(play(f, (s, dt) => flightStep(s, { type: "idle" }, dt), 60));
    expect(play(r, (s, dt) => runStep(s, { type: "idle" }, dt), 120)).toEqual(play(r, (s, dt) => runStep(s, { type: "idle" }, dt), 60));
  });
});
describe("UI-owned mailbox", () => {
  it("drains acknowledged commands, preserves later arrivals and serials, and consumes rapid taps once", () => {
    let box: Commands<{ type: "flap" }> = { helper: false, serial: 0, queue: [] };
    box = enqueueCommand(enqueueCommand(box, { type: "flap" }), { type: "flap" });
    const s = flightFrame(createFlight(flightLevels[0], 4), box, FIXED_DT);
    expect(s.event).toBe(2);
    const arrived = enqueueCommand(box, { type: "flap" } as const), drained = drainCommands(arrived, s);
    expect(drained.queue.map(c => c.id)).toEqual([3]);
    const next = flightFrame(s, drained, FIXED_DT), empty = drainCommands(drained, next);
    expect(next.event).toBe(3); expect(empty.queue).toEqual([]);
    expect(drainCommands(empty, next)).toBe(empty);
    expect(enqueueCommand(empty, { type: "flap" }).queue[0].id).toBe(4);
  });
  it("bounds bursts without reusing ids", () => {
    let box: Commands<number> = { helper: false, queue: [] };
    for (let i = 0; i < 100; i++) box = enqueueCommand(box, i);
    expect(box.queue).toHaveLength(32); expect(box.queue[0].id).toBe(69); expect(box.serial).toBe(100);
  });
});
describe("compact changed HUD publication", () => {
  it("excludes simulation arrays, clocks, poses and RNG from ordinary play payloads", () => {
    const f = createFlight(flightLevels[0], 2), r = createRun(runLevels[0], 2), p = createPalm(palmLevels[0], 2), b = createBeach(beachLevels[0], 2);
    for (const [state, payload] of [[f, flightHud(f)], [r, runHud(r)], [p, palmHud(p)], [b, beachHud(b)]] as const) {
      for (const key of ["seed", "gates", "rows", "beetles", "husks", "balls", "effects", "time", "travel"]) expect(payload).not.toHaveProperty(key);
      expect(JSON.stringify(payload).length).toBeLessThan(JSON.stringify(state).length * .8);
    }
  });
  it("does not publish an unchanged tick or invisible invulnerability countdown", () => {
    const s = createFlight(flightLevels[0], 2);
    expect(samePublication(flightHud(s), flightHud({ ...s, hover: 3, time: 7, seed: 10, lives: { ...s.lives, invulnerable: .5 } }))).toBe(true);
    expect(samePublication(flightHud(s), flightHud({ ...s, score: 1 }))).toBe(false);
    expect(samePublication(runHud(createRun(runLevels[0], 2)), runHud(createRun(runLevels[0], 2)))).toBe(true);
  });
  it("retains learning-only facts/answers and avoids copying unchanged launcher input", () => {
    const f = createFlight(flightLevels.find(l => l.world === "learn")!, 2), p = createPalm(palmLevels.find(l => l.world === "learn")!, 2);
    expect(flightHud(f).facts).toHaveLength(4); expect(flightHud(f).next).toBeDefined(); expect(palmHud(p).answers).toHaveLength(3);
    expect(palmTransition(p, { type: "move", x: p.launcher })).toBe(p);
  });
});
it("supplies a distinct palette and motif for every WorldId", () => {
  expect(Object.keys(worldPalettes)).toEqual([...worldIds]);
  expect(new Set(worldIds.map(w => worldPalettes[w].top)).size).toBe(7);
  expect(new Set(worldIds.map(w => nightPalettes[w].top)).size).toBe(7);
  expect(new Set(worldIds.map(w => worldMotifs[w].kind)).size).toBe(7);
  expect(worldIds.map(w => worldIndex[w])).toEqual([0, 1, 2, 3, 4, 5, 6]);
});
