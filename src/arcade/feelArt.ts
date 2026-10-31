/** Presentation helpers only. They never feed positions, inputs or outcomes into an engine. */
export function railHeading(body: readonly { x: number; y: number }[], index: number, fallback: string): number {
  const p = body[index], toward = index ? body[index - 1] : body[1];
  if (index > 0 && p && toward) {
    const dx = index ? toward.x - p.x : p.x - toward.x;
    const dy = index ? toward.y - p.y : p.y - toward.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.001) return Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? Math.PI : 0) : (dy < 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  return fallback === "left" ? Math.PI : fallback === "up" ? -Math.PI / 2 : fallback === "down" ? Math.PI / 2 : 0;
}
export function crabHopFrame(age: number | undefined, duration: number): number {
  return age === undefined ? 0 : Math.min(4, 1 + Math.floor(age / duration * 4));
}
type BallPose = { x: number; y: number; vx: number; vy: number; wait: number };
/** Observe an existing reflection; exclude serves and paddle/turtle reversals away from a rail. */
export function beachWallContact(before: BallPose, after: BallPose, dt: number): { x: number; y: number } | null {
  "worklet";
  if (dt <= 0 || dt > 0.12 || before.wait > 0 || after.wait > 0 || before.vx * after.vx >= 0) return null;
  const plane = before.vx < 0 ? 12 : 348;
  if ((before.x + before.vx * dt - plane) * Math.sign(before.vx) < -0.5) return null;
  if (Math.abs(after.x - plane) > Math.abs(before.vx) * dt + 0.5) return null;
  const fraction = Math.max(0, Math.min(1, (plane - before.x) / (before.vx * dt)));
  return { x: plane, y: before.y + before.vy * dt * fraction };
}
