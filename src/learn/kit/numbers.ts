/** Shared, pure number tools. Shells are pretend market manipulatives, never rewards. */
export const COINS = [1, 5, 10, 25] as const;
export type Pieces = { tens: number; ones: number; coins: [number, number, number, number] };
export const emptyPieces = (): Pieces => ({ tens: 0, ones: 0, coins: [0, 0, 0, 0] });
export const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const keys = (v: Record<string, unknown>, expected: string[]) =>
  Object.keys(v).length === expected.length && Object.keys(v).every((k) => expected.includes(k));
export const coinTotal = (coins: readonly number[]) => coins.reduce((sum, count, i) => sum + count * COINS[i], 0);
export const pieceTotal = (p: Pieces, money = false) => (money ? coinTotal(p.coins) : 10 * p.tens + p.ones);
export const splitNumber = (n: number) => ({ tens: Math.floor(n / 10), ones: n % 10 });
export function validPieces(v: unknown, max: number, money: boolean): v is Pieces {
  if (
    !object(v) ||
    !keys(v, ["tens", "ones", "coins"]) ||
    !integer(v.tens, 0, Math.floor(max / 10)) ||
    !integer(v.ones, 0, max) ||
    !Array.isArray(v.coins) ||
    v.coins.length !== 4 ||
    !v.coins.every((n, i) => integer(n, 0, Math.floor(max / COINS[i])))
  )
    return false;
  const p = v as Pieces;
  return pieceTotal(p, money) <= max && (money ? p.tens === 0 && p.ones === 0 : p.coins.every((n) => n === 0));
}
export function adjustPieces(
  p: Pieces,
  part: "tens" | "ones" | 0 | 1 | 2 | 3,
  delta: 1 | -1,
  max: number,
  money: boolean
): Pieces {
  const next: Pieces = { ...p, coins: [...p.coins] };
  if (typeof part === "number") next.coins[part] += delta;
  else next[part] += delta;
  return validPieces(next, max, money) ? next : p;
}
/** A contiguous serpentine path, never a circular or unnumbered track. */
export function pathRows(first: number, last: number, columns: number): number[][] {
  const rows: number[][] = [];
  for (let n = first; n <= last; n += columns) {
    const row = Array.from({ length: Math.min(columns, last - n + 1) }, (_, i) => n + i);
    rows.push(rows.length % 2 ? row.reverse() : row);
  }
  return rows;
}

/** One winding reef section: which stones it shows. Long paths split into sections that follow the turtle. */
export const sectionSize = (end: number) => (end <= 30 ? end : end === 100 ? 25 : 30);
export const sectionOf = (stone: number, end: number) =>
  stone <= 0 ? 0 : Math.min(Math.ceil(end / sectionSize(end)) - 1, Math.floor((stone - 1) / sectionSize(end)));
export function sectionRange(section: number, end: number): [number, number] {
  const size = sectionSize(end);
  return [section * size, Math.min(end, (section + 1) * size)];
}

export type Point = { x: number; y: number };
export type Winding = { points: Point[]; d: string; r: number; rows: number };
/**
 * A winding path of `count` evenly spaced round stones in a width × height box. It starts at the
 * bottom left, runs across, turns up at the side and runs back, like a real board-game path.
 * Rows are chosen so the stones come out as large as possible (radius 16–30).
 */
export type WindingRoom = { top?: number; bottom?: number; startInset?: number; endInset?: number };
export function winding(width: number, height: number, count: number, room: WindingRoom = {}): Winding {
  const build = (rows: number, r: number) => {
    const mx = r + 6,
      top = r + 10 + (room.top ?? 0),
      bottom = r + 10 + (room.bottom ?? 0);
    const gap = rows > 1 ? (height - top - bottom) / (rows - 1) : 0;
    const t = Math.max(4, Math.min(gap / 2, r + 10));
    const xa = mx + t,
      xb = width - mx - t;
    const samples: Point[] = [];
    const line = (a: Point, b: Point) => {
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let i = samples.length ? 1 : 0; i <= n; i++) samples.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    };
    const arc = (cx: number, cy: number, from: number, to: number) => {
      const n = Math.max(2, Math.ceil((Math.abs(to - from) * t) / 2));
      for (let i = 1; i <= n; i++) {
        const a = from + ((to - from) * i) / n;
        samples.push({ x: cx + t * Math.cos(a), y: cy + t * Math.sin(a) });
      }
    };
    for (let i = 0; i < rows; i++) {
      const y = rows > 1 ? height - bottom - i * gap : (top + height - bottom) / 2,
        right = i % 2 === 0;
      const start = i === 0 ? mx + (room.startInset ?? 0) : right ? xa : xb;
      const stop = i === rows - 1 ? (right ? width - mx - (room.endInset ?? 0) : mx + (room.endInset ?? 0)) : right ? xb : xa;
      line({ x: start, y }, { x: stop, y });
      if (i === rows - 1) break;
      const next = y - gap,
        side = right ? xb : xa,
        out = right ? 1 : -1;
      // Quarter turn out and up, a straight climb, then a quarter turn back in.
      arc(side, y - t, Math.PI / 2, right ? 0 : Math.PI);
      line(samples[samples.length - 1], { x: side + out * t, y: next + t });
      arc(side, next + t, right ? 0 : Math.PI, right ? -Math.PI / 2 : (3 * Math.PI) / 2);
    }
    let total = 0;
    const along = samples.map((p, i) => (total += i ? Math.hypot(p.x - samples[i - 1].x, p.y - samples[i - 1].y) : 0));
    const spacing = count > 1 ? total / (count - 1) : 0;
    const points: Point[] = [];
    for (let k = 0, j = 0; k < count; k++) {
      const want = k * spacing;
      while (j < samples.length - 2 && along[j + 1] < want) j++;
      const span = along[j + 1] - along[j] || 1,
        f = Math.min(1, Math.max(0, (want - along[j]) / span));
      points.push({ x: samples[j].x + (samples[j + 1].x - samples[j].x) * f, y: samples[j].y + (samples[j + 1].y - samples[j].y) * f });
    }
    const d = samples
      .filter((_, i) => i % 3 === 0 || i === samples.length - 1)
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join("");
    return { points, d, spacing, gap: rows > 1 ? gap : height, run: xb - xa };
  };
  let best: Winding | null = null;
  for (let rows = 1; rows <= 10; rows++) {
    const guess = build(rows, 24);
    if (guess.run < 40 || (rows > 1 && guess.gap < 40)) continue;
    const r = Math.max(16, Math.min(30, 0.42 * Math.min(guess.spacing, rows > 1 ? guess.gap : Infinity)));
    const shaped = build(rows, r);
    const fit = Math.max(16, Math.min(30, 0.42 * Math.min(shaped.spacing, rows > 1 ? shaped.gap : Infinity)));
    if (!best || fit > best.r) best = { points: shaped.points, d: shaped.d, r: Math.floor(fit), rows };
  }
  return best ?? { points: Array.from({ length: count }, (_, i) => ({ x: 20 + i, y: height / 2 })), d: "", r: 16, rows: 1 };
}
