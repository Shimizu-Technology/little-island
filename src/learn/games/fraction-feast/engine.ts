import type { LearnEngine } from "../../types";
import { levelOf } from "../../levelOptions";
export type FeastTask = { kind: "share" | "line" | "equivalent" | "combine" | "subtract" | "decimal"; n: number; d: number; extra: number; answer: number };
export type FeastState = { version: 1; level: number; tasks: FeastTask[]; index: number; pieces: number; helped: boolean };
const pick = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const makeTask = (level: number, r: () => number, index = 0): FeastTask => {
  if (level === 1) { const d = r() < 0.5 ? 2 : 4, n = pick(r, 1, d - 1); return { kind: "share", n, d, extra: pick(r, 0, 2), answer: n }; }
  if (level === 2) { const d = pick(r, 3, 6), n = pick(r, 1, d - 1); return { kind: "line", n, d, extra: 0, answer: n }; }
  if (level === 3) { const d = pick(r, 2, 4), n = pick(r, 1, d - 1), extra = pick(r, 2, 3); return { kind: "equivalent", n, d, extra, answer: n * extra }; }
  if (level === 4) { const d = pick(r, 4, 8); if (index % 2) { const n = pick(r, 2, d-1), extra = pick(r, 1, n-1); return { kind: "subtract", n, d, extra, answer: n-extra }; } const n = pick(r, 2, d-1), extra = pick(r, d-n+1, d-1); return { kind: "combine", n, d, extra, answer: n + extra }; }
  const d = 100, n = pick(r, 1, 9) * 10 + pick(r, 0, 9); return { kind: "decimal", n, d, extra: index % 3, answer: n };
};
export const taskValid = (t: FeastTask, l: number) => !!t && typeof t === "object" && Object.keys(t).sort().join() === "answer,d,extra,kind,n" && (l === 4 ? ["combine", "subtract"].includes(t.kind) : ["share", "line", "equivalent", "combine", "decimal"][l - 1] === t.kind) && [t.n, t.d, t.extra, t.answer].every(Number.isInteger) && t.n > 0 && t.n < t.d && (l === 1 ? [2, 4].includes(t.d) && t.extra >= 0 && t.extra <= 2 && t.answer === t.n : l === 2 ? t.d >= 3 && t.d <= 8 && t.extra === 0 && t.answer === t.n : l === 3 ? t.d >= 2 && t.d <= 5 && t.extra >= 2 && t.extra <= 3 && t.answer === t.n * t.extra : l === 4 ? t.d >= 4 && t.d <= 8 && t.extra >= 1 && (t.kind === "combine" ? t.n >= 2 && t.n < t.d && t.extra < t.d && t.n + t.extra > t.d && t.answer === t.n + t.extra : t.n >= 2 && t.n < t.d && t.extra < t.n && t.answer === t.n - t.extra) : t.d === 100 && t.extra >= 0 && t.extra <= 2 && t.answer === t.n);
/** Each outlined whole always contains one denominator of equal pieces. */
export function fractionModel(t: FeastTask) {
  const denominator = t.kind === "equivalent" ? t.d * t.extra : t.d;
  const wholes = t.kind === "combine" ? 2 : 1;
  return { denominator, wholes, total: denominator * wholes };
}
export function mixedNumber(n: number, d: number): string {
  const whole = Math.floor(n / d), rest = n % d;
  return rest ? `${whole} ${rest}/${d}` : `${whole}`;
}
export function fractionClue(t: FeastTask, pieces: number): string {
  const { denominator } = fractionModel(t);
  return `You have ${pieces}/${denominator} shaded. The target is ${t.answer}/${denominator}. ${pieces < t.answer ? "Shade more pieces." : "Take back some pieces."}`;
}

export const engine: LearnEngine<FeastState> = {
  id: "fraction-feast", name: "Fraction Feast", island: "numbers", ages: [7, 13], ownLevels: true, tagline: "Share, fold and fill fractions.",
  description: "Share island food fairly, walk a fraction line and build decimals on a hundred grid.",
  help: "Choose a piece count or tap number-line steps to show the requested fraction. On the hundred grid, add ten squares or one square at a time. Count the shaded pieces and press Check. Tap Hint to see a worked clue.",
  color: "#AC5C26", surface: "#FFF0CF", modes: ["solo", "together"],
  levelNames: [
    { name: "Fair pie shares", description: "Cut halves and quarters, then serve equal slices." },
    { name: "Fraction footsteps", description: "Find unit parts and fractions on a number line." },
    { name: "Fold the same amount", description: "Build equivalent fractions with smaller pieces." },
    { name: "Combine the feast", description: "Add like-denominator fractions and see the mixed whole." },
    { name: "Hundred-square market", description: "Connect hundredths, decimals, percent and shell money." },
  ],
  skills: { "num.fair-shares": "Fair shares", "num.fraction-line": "Fractions on a number line", "num.equivalent": "Equivalent fractions", "num.fraction-sums": "Fraction sums", "num.decimal-percent": "Decimals and percents" },
  create: (o, c) => { const level = levelOf(o), tasks: FeastTask[] = [], seen = new Set<string>(); let tries = 0; while (tasks.length < 5 && tries++ < 100) { const t = makeTask(level, c.rng, tasks.length), key = `${t.kind}:${t.n}:${t.d}:${t.extra}`; if (!seen.has(key)) { seen.add(key); tasks.push(t); } } return { version: 1, level, tasks, index: 0, pieces: 0, helped: false }; },
  validate: (x, o): x is FeastState => { if (!x || typeof x !== "object" || Object.keys(x).sort().join() !== "helped,index,level,pieces,tasks,version") return false; const s = x as FeastState; return s.version === 1 && s.level === levelOf(o) && Array.isArray(s.tasks) && s.tasks.length === 5 && s.tasks.every(t => taskValid(t, s.level)) && Number.isInteger(s.index) && s.index >= 0 && s.index <= 5 && Number.isInteger(s.pieces) && s.pieces >= 0 && s.pieces <= (s.tasks[s.index]?.kind === "decimal" ? 100 : (s.tasks[s.index]?.kind === "equivalent" ? (s.tasks[s.index]?.d ?? 1) * (s.tasks[s.index]?.extra ?? 1) : s.tasks[s.index]?.kind === "combine" ? 2 * (s.tasks[s.index]?.d ?? 1) : s.tasks[s.index]?.d ?? 1)) && typeof s.helped === "boolean" && (s.index < 5 || s.pieces === 0); },
  outcome: s => s.index === 5 ? "done" : null,
};
