import { describe, expect, it } from "vitest";
import { HIDDEN_POSE, interpolatePoses } from "../src/arcade/poses";
import { palmPoses, beachPoses } from "../src/arcade/action/poses";
import { arenaTransform } from "../src/arcade/action/arena";
import { createPalm, palmLevels } from "../src/arcade/games/palm-patrol/engine";
import { createBeach, beachLevels } from "../src/arcade/games/beach-ball/engine";
import { createCargo, cargoLevels, landingRow, pieceCells } from "../src/arcade/games/canoe-cargo/engine";
import { cargoPoses } from "../src/arcade/games/canoe-cargo/poses";
import { palmHud } from "../src/arcade/publication";
const arena = arenaTransform(360, 600);
describe("art v3 through kit v3 interpolation", () => {
  it("keeps authored frame indices discrete while moving at half steps", () => {
    const s = createPalm(palmLevels[0], 42), t = { ...s, time: .16, launcher: s.launcher + 10, cooldown: .2 };
    const a = palmPoses(s, arena, false, 0), b = palmPoses(t, arena, false, 0);
    const mid = interpolatePoses(a, b, .5);
    expect(mid[0].frame).toBe(b[0].frame); expect(b[0].frame).not.toBe(a[0].frame);
    expect(mid[57].frame).toBe(1); expect(mid[57].x).toBe(a[57].x + 5);
    expect(palmPoses({ ...s, cooldown: .12 }, arena, false, 0)[57].frame).toBe(2);
    expect(palmPoses(s, arena, false, 0)[57].frame).toBe(0);
    for (const alpha of [0, .1, .5, .9, 1]) for (const p of interpolatePoses(a, b, alpha)) if (p.frame !== undefined) expect(Number.isInteger(p.frame)).toBe(true);
  });
  it("snaps recycled Palm groups and their entrance, then interpolates within a group", () => {
    const s = createPalm(palmLevels[0], 42), next = { ...s, relay: s.relay + 1 };
    const a = palmPoses(s, arena, false, 0), b = palmPoses(next, arena, false, 1), c = palmPoses(next, arena, false, .5);
    expect(interpolatePoses(a, b, .5)[0]).toBe(b[0]);
    expect(interpolatePoses(b, c, .5)[0].y).toBeCloseTo((b[0].y + c[0].y) / 2);
    expect(palmHud(next)).toMatchObject({ relay: 2, relays: palmLevels[0].relays, waves: palmLevels[0].waves });
    expect(palmPoses(s, arena, false, 0)).toHaveLength(88);
  });
  it("keeps Reduce Motion art still without hiding gameplay", () => {
    const s = { ...createPalm(palmLevels[0], 42), time: .16, cooldown: .2 };
    const quiet = palmPoses(s, arena, true, 1), normal = palmPoses(s, arena, false, 0);
    expect(quiet[0]).toMatchObject({ frame: 0, opacity: 1, angle: 0 });
    expect(quiet[0].x).toBe(normal[0].x); expect(quiet[0].y).toBe(normal[0].y);
    expect(quiet[57].frame).toBe(0);
  });
  it("preserves all 72 Beach slots, snaps wall sparks and interpolates moving balls/trails", () => {
    const s = createBeach(beachLevels[0], 42);
    s.balls = s.balls.map(b => ({ ...b, wait: 0, vx: 350, vy: 100 }));
    const t = { ...s, time: .05, balls: s.balls.map(b => ({ ...b, x: b.x + 6 })) };
    const a = beachPoses(s, arena, false, [{ x: 12, y: 200, at: 0 }]);
    const b = beachPoses(t, arena, false, [{ x: 348, y: 220, at: .04 }]);
    const mid = interpolatePoses(a, b, .5);
    expect(b).toHaveLength(72); expect(mid[66]).toBe(b[66]); expect(mid[66].snap).toBe(true);
    expect(mid[0].x).toBeCloseTo((a[0].x + b[0].x) / 2);
    expect(mid[68].x).toBeCloseTo((a[68].x + b[68].x) / 2);
    expect(b[70]).toBe(HIDDEN_POSE);
    expect(beachPoses(s, arena, true, [])[68]).toBe(HIDDEN_POSE);
    const served = beachPoses({ ...t, points: [1, 0] }, arena, false, []);
    expect(interpolatePoses(b, served, .5)[0]).toBe(served[0]);
  });
});
it("matches Cargo's new outline slots while interpolating the active bundle only", () => {
  const s = createCargo(cargoLevels[0], 42, false), cell = 20, a = cargoPoses(s, cell), b = cargoPoses({ ...s, row: s.row + 1 }, cell);
  expect(a).toHaveLength(6);
  for (const [i, [r, c]] of pieceCells(s.piece).entries()) expect(a[i]).toMatchObject({ x: (s.col + c) * cell, y: (s.row + r) * cell });
  expect(a[4]).toMatchObject({ x: s.col * cell, y: s.row * cell });
  expect(a[5]).toMatchObject({ x: s.col * cell, y: landingRow(s) * cell, snap: true });
  expect(interpolatePoses(a, b, .5)[4].y).toBe(a[4].y + cell / 2);
  expect(interpolatePoses(a, b, .5)[5]).toBe(b[5]);
});
