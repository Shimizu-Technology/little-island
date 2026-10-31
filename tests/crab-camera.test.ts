import { describe, expect, it } from "vitest";
import { CRAB_CAMERA, crabFollow, crabFraming, crabProject, crabGroundTransform } from "../src/arcade/games/crab-crossing/camera";

describe("Crab Crossing planning camera", () => {
  it.each([[390, 844], [390, 790], [393, 759], [768, 950], [1024, 680]])("shows at least twelve rows at %s×%s", (w, h) => {
    const framing = crabFraming(w, h);
    const nextRowAtSameScreenX = crabProject(-CRAB_CAMERA.c / CRAB_CAMERA.a, 1);
    expect(h / (nextRowAtSameScreenX.y * framing.unit)).toBeCloseTo(12);
    expect(framing.rows).toBeGreaterThanOrEqual(12 - 1e-8);
    expect(framing.rows).toBeLessThanOrEqual(13);
    // Art occupies ~90% of its square; the rest is room for claws and hop poses.
    if (h > w && w < 600) expect(framing.heroSize * 0.9 / w).toBeCloseTo(0.08);
    else expect(framing.heroSize / framing.unit).toBeLessThanOrEqual(0.65);
  });
  it("projects lanes upward to the right and forward up-left, without a singular plane", () => {
    expect(crabProject(1, 0)).toMatchObject({ x: CRAB_CAMERA.a, y: CRAB_CAMERA.b });
    expect(CRAB_CAMERA.b).toBeLessThan(0);
    expect(crabProject(0, -1).x).toBeLessThan(0);
    expect(crabProject(0, -1).y).toBeLessThan(0);
    expect(CRAB_CAMERA.a * CRAB_CAMERA.d - CRAB_CAMERA.b * CRAB_CAMERA.c).toBeCloseTo(Math.sin(58 * Math.PI / 180), 4);
  });
  it("projects from zero with the native default center pivot", () => {
    type Matrix = [number, number, number, number, number, number];
    const mul = (a: Matrix, b: Matrix): Matrix => [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
    const width = 700, height = 900;
    let matrix: Matrix = [1, 0, 0, 1, width / 2, height / 2];
    for (const item of crabGroundTransform(width, height)) {
      let part: Matrix = [1, 0, 0, 1, 0, 0];
      if ("translateX" in item) part[4] = Number(item.translateX);
      if ("translateY" in item) part[5] = Number(item.translateY);
      if ("scaleY" in item) part[3] = Number(item.scaleY);
      if ("rotate" in item) {
        const angle = parseFloat(String(item.rotate)) * Math.PI / 180;
        part = [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0];
      }
      matrix = mul(matrix, part);
    }
    matrix = mul(matrix, [1, 0, 0, 1, -width / 2, -height / 2]);
    // The authored projection coefficients are rounded; tolerate <0.05px.
    for (const [x, y] of [[0, 0], [350, 450], [700, 900]]) {
      expect(matrix[0] * x + matrix[2] * y + matrix[4]).toBeCloseTo(crabProject(x, y).x, 1);
      expect(matrix[1] * x + matrix[3] * y + matrix[5]).toBeCloseTo(crabProject(x, y).y, 1);
    }
  });
  it("follows monotonically with the same damping at 60 and 120Hz", () => {
    let a = 0, b = 0;
    for (let i = 0; i < 60; i++) a = crabFollow(a, 100, 1 / 60);
    for (let i = 0; i < 120; i++) b = crabFollow(b, 100, 1 / 120);
    expect(a).toBeCloseTo(b, 8);
    expect(a).toBeLessThan(100);
    expect(a).toBeGreaterThan(99);
    expect(crabFollow(a, a, 1)).toBe(a);
    expect(crabFollow(100, 0, 0.016)).toBeGreaterThan(0);
    expect(crabFollow(-500, 250, 1 / 120, true)).toBe(250);
  });
});
