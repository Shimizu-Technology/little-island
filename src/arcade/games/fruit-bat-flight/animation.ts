/** Animation only: flight impulse, collision hull and scoring do not depend on this clock. */
export const FLAP_DURATION = .24;
export const GLIDE_WING = .12;
/** A fast downstroke and slower recovery. Retaps retarget the attached wing, never reset it. */
export function stepWing(angle: number, remaining: number, dt: number): number {
  "worklet";
  const down = remaining > .14;
  const target = down ? -.95 : GLIDE_WING;
  return target + (angle - target) * Math.exp(-dt / (down ? .025 : .055));
}
