import { describe, expect, it } from "vitest";
import { FLAP_DURATION, GLIDE_WING, stepWing } from "../src/arcade/games/fruit-bat-flight/animation";
import { createFlight, flightStep, flightTransition, validFlight } from "../src/arcade/games/fruit-bat-flight/engine";
import { flightLevels } from "../src/arcade/games/scrolling/content";

describe("attached bat flap", () => {
  it("has one downstroke followed by a slower recovery to glide", () => {
    let angle = GLIDE_WING;
    const angles: number[] = [];
    for (let i = 0; i < 60; i++) {
      angle = stepWing(angle, Math.max(0, FLAP_DURATION - i / 120), 1 / 120);
      angles.push(angle);
    }
    const trough = angles.indexOf(Math.min(...angles));
    expect(trough).toBeGreaterThan(5);
    expect(trough).toBeLessThan(16);
    expect(angles.slice(0, trough).every((a, i) => a > angles[i + 1])).toBe(true);
    expect(angles.slice(trough, -1).every((a, i) => a < angles[trough + i + 1])).toBe(true);
    expect(angles.at(-1)).toBeCloseTo(GLIDE_WING, 2);
  });
  it("keeps the wing angle on a rapid retap while applying the flight impulse immediately", () => {
    let state = flightTransition(createFlight(flightLevels[0], 17), { type: "flap" });
    for (let i = 0; i < 5; i++) state = flightStep(state, { type: "idle" }, 1 / 60);
    const retap = flightTransition(state, { type: "flap" });
    expect(retap.wing).toBe(state.wing);
    expect(retap.flap).toBe(FLAP_DURATION);
    expect(retap.vy).toBeLessThan(state.vy);
    expect(validFlight(retap)).toBe(true);
  });
  it("stays within the authored shoulder/face clearance envelope at 60 and 120Hz", () => {
    for (const dt of [1 / 60, 1 / 120]) {
      let angle = GLIDE_WING;
      for (let i = 0; i < 240; i++) {
        angle = stepWing(angle, i % 13 < 8 ? FLAP_DURATION : 0, dt);
        expect(angle).toBeGreaterThanOrEqual(-.95);
        expect(angle).toBeLessThanOrEqual(GLIDE_WING);
        // Control/end points of the membrane, with a 2px stroke allowance.
        for (const [x, y] of [[0, 0], [-12, -25], [-40, -32], [-35, -9], [-24, -18], [-20, 4], [-13, -5], [-10, 11]]) {
          expect(43 + x * Math.cos(angle) - y * Math.sin(angle) + 2).toBeLessThan(59);
        }
      }
    }
  });
});
