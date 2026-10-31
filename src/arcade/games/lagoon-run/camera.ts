/** A single pinhole camera in the uniform 390×660 arena. z=-1.2 is the horizon, z=1 contact. */
export const TRACK_WIDTH = 390, TRACK_HEIGHT = 660, HORIZON = .44, CONTACT = .84, ROAD_HALF = .46;
export function projectTrack(lane: number, z: number) {
  "worklet";
  // Perspective grows slowly at the horizon, rapidly near the runner.
  const depth = Math.max(0, (z + 1.2) / 2.2), scale = depth / (2 - Math.min(1.3, depth));
  return { x: TRACK_WIDTH * (.5 + (lane - 1) * (2 / 3) * ROAD_HALF * scale), y: TRACK_HEIGHT * (HORIZON + (CONTACT - HORIZON) * scale), scale };
}
export function roadEdge(z: number, right: boolean) { "worklet"; return projectTrack(right ? 2.5 : -.5, z); }
/** Sprite scale is around its centre; compensate so its visible foot stays on the camera point. */
export function trackSprite(lane: number, z: number, width: number, height: number) {
  "worklet";
  const p = projectTrack(lane, z);
  return { x: p.x - width / 2, y: p.y - height / 2 - height * p.scale / 2, scale: p.scale, opacity: z > -1.2 && z < 1.16 ? 1 : 0 };
}

/** Presentation-only slot, after the existing 311 actor/geometry slots. */
export const CAMERA_SLOT = 311;

/** One optical zoom keeps runner, duck clearance, ramps and shadows in the same camera. */
export const HERO_ZOOM = 1.7;
