/** Orthographic ground plane: 22° yaw, 58° elevation. Rules remain in grid space. */
export const CRAB_CAMERA = { a: 0.927184, b: -0.317676, c: 0.374607, d: 0.786302 };
export function crabProject(x: number, y: number) {
  "worklet";
  return { x: CRAB_CAMERA.a * x + CRAB_CAMERA.c * y, y: CRAB_CAMERA.b * x + CRAB_CAMERA.d * y };
}
export function crabFraming(width: number, height: number) {
  // Vertical screen scan crosses diagonals, not the projected grid Y axis.
  const pitch = CRAB_CAMERA.d - CRAB_CAMERA.b * CRAB_CAMERA.c / CRAB_CAMERA.a;
  const unit = height / (12 * pitch);
  return { unit, heroSize: Math.min(width * 0.09, unit * 0.65), rows: height / (unit * pitch) };
}
/** Frame-rate independent follow; no drift/pressure when a child stops to plan. */
export function crabFollow(current: number, target: number, dt: number, reset = false) {
  "worklet";
  if (reset) return target;
  return current + (target - current) * (1 - Math.exp(-Math.min(dt, 0.05) / 0.14));
}

/** Conjugate the default center pivot explicitly. Native and web must share the
 * same ground origin; zero-sized parents/transformOrigin diverge on iOS. */
type GroundTransform = { translateX: number } | { translateY: number } | { scaleY: number } | { rotate: `${number}deg` };
export function crabGroundTransform(width: number, height: number): GroundTransform[] {
  return [
    { translateX: -width / 2 }, { translateY: -height / 2 },
    { scaleY: Math.sin(58 * Math.PI / 180) }, { rotate: "-22deg" },
    { translateX: width / 2 }, { translateY: height / 2 },
  ];
}
