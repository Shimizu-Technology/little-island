/** Small deterministic helpers for predict → test → explain games. No UI or platform imports. */
export type Prediction = 0 | 1;
export const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
export const exact = (x: unknown, keys: string[]) =>
  isRecord(x) && Object.keys(x).length === keys.length && keys.every((k) => Object.hasOwn(x, k));
export const integer = (x: unknown, min: number, max: number): x is number =>
  Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
export const prediction = (x: unknown): x is Prediction => x === 0 || x === 1;
export const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  return (
    isRecord(a) &&
    isRecord(b) &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((k) => same(a[k], b[k]))
  );
};
export const scienceSkills = {
  "sci.predict": "Making a prediction",
  "sci.cause-effect": "Trying a change and noticing why",
};
