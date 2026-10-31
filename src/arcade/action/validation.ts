/** Runtime guards for bounded ephemeral simulations. No in-progress action game is saved. */
export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const exact = (v: unknown, keys: string): v is Record<string, unknown> =>
  object(v) && Object.keys(v).sort().join() === keys.split(" ").sort().join();
export function finite(v: unknown, min = 0, max = 99999999): v is number {
  "worklet";
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
export const integer = (v: unknown, max = 99999999): v is number => finite(v, 0, max) && Number.isInteger(v);
export function clamp(n: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, n));
}
export const canonicalLevel = <L extends { id: string }>(v: unknown, levels: readonly L[]): v is L =>
  object(v) &&
  levels.some(
    (l) =>
      l.id === v.id &&
      Object.keys(l).length === Object.keys(v).length &&
      Object.entries(l).every(([k, value]) => JSON.stringify(value) === JSON.stringify(v[k]))
  );
