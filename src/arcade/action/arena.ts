/** The only camera for both action games. All distances below are logical units. */
export const ARENA_WIDTH = 360,
  ARENA_HEIGHT = 600;
export type Arena = { scale: number; x: number; y: number; width: number; height: number };
export function arenaTransform(width: number, height: number): Arena {
  "worklet";
  const scale = Math.max(0.01, Math.min(width / ARENA_WIDTH, height / ARENA_HEIGHT));
  return {
    scale,
    x: (width - ARENA_WIDTH * scale) / 2,
    y: (height - ARENA_HEIGHT * scale) / 2,
    width: ARENA_WIDTH * scale,
    height: ARENA_HEIGHT * scale,
  };
}
export function arenaPoint(arena: Arena, x: number, y: number) {
  "worklet";
  return { x: arena.x + x * arena.scale, y: arena.y + y * arena.scale };
}
export function arenaTouch(arena: Arena, x: number, y: number) {
  "worklet";
  return { x: (x - arena.x) / arena.scale, y: (y - arena.y) / arena.scale };
}
export const BALL_RADIUS = 12,
  PADDLE_HEIGHT = 20,
  PADDLE_Y = [535, 65] as const;
/** Ball centre plane = drawn paddle face ± drawn ball radius. */
export const PADDLE_CONTACT = [535 - PADDLE_HEIGHT / 2 - BALL_RADIUS, 65 + PADDLE_HEIGHT / 2 + BALL_RADIUS] as const;
export const BUG_RADIUS_X = 18,
  BUG_RADIUS_Y = 21,
  HUSK_RADIUS = 6;
/** Swept circle against the drawn capsule paddle (a segment with 10-unit round caps). */
export function paddleContact(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  centre: number,
  seat: 0 | 1,
  width: number
): number | null {
  "worklet";
  const dx = x1 - x0,
    dy = y1 - y0,
    y = PADDLE_Y[seat],
    half = width / 2 - PADDLE_HEIGHT / 2,
    radius = PADDLE_HEIGHT / 2 + BALL_RADIUS;
  let first = 2;
  const line = PADDLE_CONTACT[seat];
  if (dy !== 0) {
    const t = (line - y0) / dy;
    if (t >= 0 && t <= 1 && Math.abs(x0 + dx * t - centre) <= half) first = t;
  }
  const a = dx * dx + dy * dy;
  if (a > 0)
    for (const side of [-1, 1]) {
      const cx = centre + half * side,
        ox = x0 - cx,
        oy = y0 - y,
        b = 2 * (ox * dx + oy * dy),
        c = ox * ox + oy * oy - radius * radius,
        disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a),
        x = x0 + dx * t,
        cy = y0 + dy * t;
      if (t >= 0 && t <= 1 && (x - cx) * side >= 0 && (seat === 0 ? cy <= y : cy >= y)) first = Math.min(first, t);
    }
  return first <= 1 ? first : null;
}
