/** Shared by the native gesture worklet and deterministic touch tests. */
export const CARGO_TAP_SLOP = 8, CARGO_SOFT_SLOP = 14, CARGO_FLICK_DISTANCE = 44, CARGO_FLICK_SPEED = .95;
export function cargoTouch(dx: number, dy: number, elapsedMs: number, cell: number, velocityY: number) {
  "worklet";
  return {
    columns: Math.round(dx / cell),
    soft: dy > CARGO_SOFT_SLOP && dy > Math.abs(dx) * .7,
    // Require displacement, average speed AND current speed; a long slow pull cannot lock accidentally.
    flick: dy > CARGO_FLICK_DISTANCE && dy > Math.abs(dx) * 1.25 && dy / Math.max(1, elapsedMs) > CARGO_FLICK_SPEED && velocityY > 800,
  };
}

export function cargoTap(distance: number, dropped: boolean, success: boolean) {
  "worklet";
  return success && !dropped && distance <= CARGO_TAP_SLOP;
}

/** Short flicks can have too few samples for RNGH's fitted velocity (notably on web). */
export function cargoSpeed(dy: number, previousY: number, elapsedMs: number, reported: number) {
  "worklet";
  return Math.max(reported, (dy - previousY) * 1000 / Math.max(1, elapsedMs));
}
