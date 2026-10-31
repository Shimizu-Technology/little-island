import { describe, expect, it } from "vitest";
import { beachWallContact, crabHopFrame, railHeading } from "../src/arcade/feelArt";

describe("art presentation follows the existing routes", () => {
  it("heads and chicks follow all four tangents, including a corner", () => {
    const corner = [{ x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 2 }];
    expect(corner.map((_, i) => railHeading(corner, i, "right"))).toEqual([0, -Math.PI / 2, 0, Math.PI / 2]);
    expect(railHeading([{ x: 1, y: 1 }, { x: 2, y: 1 }], 0, "left")).toBe(Math.PI);
    expect(railHeading([{ x: 1, y: 1 }], 0, "down")).toBe(Math.PI / 2);
  });
  it("shows compress, push, tuck and landing inside one 120ms hop", () => {
    expect([undefined, 0, .03, .06, .09, .12].map(t => crabHopFrame(t, .12))).toEqual([0, 1, 2, 3, 4, 4]);
  });
  it("locates a rail reflection without reporting serves, paused frames or centre reversals", () => {
    const before = { x: 346, y: 200, vx: 240, vy: 180, wait: 0 };
    expect(beachWallContact(before, { ...before, x: 346, y: 203, vx: -240 }, 1 / 60)).toEqual({ x: 348, y: 201.5 });
    const left = { ...before, x: 14, vx: -240 };
    expect(beachWallContact(left, { ...left, x: 14, vx: 240 }, 1 / 60)?.x).toBe(12);
    expect(beachWallContact(before, { ...before, wait: .65, vx: -240 }, 1 / 60)).toBeNull();
    expect(beachWallContact(before, { ...before, vx: -240 }, 0)).toBeNull();
    expect(beachWallContact({ ...before, x: 180 }, { ...before, x: 181, vx: -240 }, 1 / 60)).toBeNull();
  });
});
