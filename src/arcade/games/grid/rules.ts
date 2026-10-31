export const directions = ["up", "right", "down", "left"] as const;
export type Direction = (typeof directions)[number];
export type Cell = { x: number; y: number };
export const delta: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const inside = (p: Cell, cols: number, rows: number) => p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows;
export const opposite = (a: Direction, b: Direction) => (directions.indexOf(a) + 2) % 4 === directions.indexOf(b);
export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const exact = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  object(v) && Object.keys(v).sort().join() === [...keys].sort().join();
export const integer = (v: unknown, max = 99999999): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export const finite = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
export const cell = (v: unknown, cols: number, rows: number): v is Cell =>
  exact(v, ["x", "y"]) && integer(v.x, cols - 1) && integer(v.y, rows - 1);
/** Compare against bounded canonical content without traversing untrusted object graphs. */
export function matches(expected: unknown, value: unknown): boolean {
  if (Array.isArray(expected))
    return Array.isArray(value) && expected.length === value.length && expected.every((e, i) => matches(e, value[i]));
  if (object(expected))
    return exact(value, Object.keys(expected)) && Object.keys(expected).every((k) => matches(expected[k], value[k]));
  return expected === value;
}
