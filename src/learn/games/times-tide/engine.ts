import type { LearnEngine } from "../../types";
import { levelOf } from "../../levelOptions";

export type TideTask = { kind: "groups" | "array" | "table" | "share" | "area"; a: number; b: number; total: number; remainder: number };
export type TideState = { version: 1; level: number; tasks: TideTask[]; index: number; marks: number[]; answer: string; helped: boolean };
const pick = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const expected = (t: TideTask) => t.kind === "share" ? t.a : t.total;
export const taskValid = (t: TideTask, level: number) => {
  if (!t || typeof t !== "object" || Object.keys(t).sort().join() !== "a,b,kind,remainder,total" || !["groups", "array", "table", "share", "area"].includes(t.kind) || !Number.isInteger(t.a) || !Number.isInteger(t.b) || !Number.isInteger(t.total) || !Number.isInteger(t.remainder)) return false;
  if (t.a < 2 || t.b < 1 || t.total < 2 || t.remainder < 0) return false;
  if (level === 1) return t.kind === "groups" && [2, 5, 10].includes(t.b) && t.a <= 4 && t.total === t.a * t.b && t.remainder === 0;
  if (level === 2) return t.kind === "array" && t.a <= 5 && t.b <= 6 && t.total === t.a * t.b && t.remainder === 0;
  if (level === 3) return t.kind === "table" && t.a <= 10 && t.b <= 10 && t.total === t.a * t.b && t.remainder === 0;
  // Levels 4 and 5 exchanged places in 2.3. Keep both task shapes valid so an
  // in-progress family round from the earlier build resumes without data loss.
  if (level === 4 || level === 5) return t.kind === "share"
    ? t.a <= 8 && t.b <= 8 && t.total === t.a * t.b + t.remainder && t.remainder < t.b
    : t.kind === "area" && t.a >= 11 && t.a <= 29 && t.b >= 2 && t.b <= 5 && t.total === t.a * t.b && t.remainder === 0;
  return false;
};
export const makeTask = (level: number, rng: () => number): TideTask => {
  if (level === 1) { const a = pick(rng, 2, 4), b = [2, 5, 10][pick(rng, 0, 2)]; return { kind: "groups", a, b, total: a * b, remainder: 0 }; }
  if (level === 2) { const a = pick(rng, 2, 5), b = pick(rng, 2, 6); return { kind: "array", a, b, total: a * b, remainder: 0 }; }
  if (level === 3) { const a = pick(rng, 3, 10), b = pick(rng, 3, 10); return { kind: "table", a, b, total: a * b, remainder: 0 }; }
  if (level === 5) { const a = pick(rng, 2, 8), b = pick(rng, 2, 8), remainder = pick(rng, 0, b - 1); return { kind: "share", a, b, total: a * b + remainder, remainder }; }
  const a = [11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29][pick(rng, 0, 17)], b = pick(rng, 2, 5); return { kind: "area", a, b, total: a * b, remainder: 0 };
};
export const solved = (s: TideState) => { const t = s.tasks[s.index]; if (!t) return false; if (t.kind === "share") return s.marks.length === t.b + 1 && s.marks.slice(0, t.b).every(v => v === t.a) && s.marks[t.b] === t.remainder; if (t.kind === "area") return s.marks.length === 2 && s.marks[0] === Math.floor(t.a / 10) * 10 * t.b && s.marks[1] === (t.a % 10) * t.b && Number(s.answer) === t.total && s.answer.length > 0; return s.marks.length === t.a && s.marks.every(v => v === t.b) && Number(s.answer) === t.total; };
/** All visible pool controls share the same bounded transition. */
export function changePool(s: TideState, index: number, action: "add" | "remove" | "fill"): TideState {
  const t = s.tasks[s.index];
  if (!t || t.kind === "area") return s;
  const length = t.kind === "share" ? t.b + 1 : t.a;
  if (index < 0 || index >= length) return s;
  const marks = Array.from({ length }, (_, i) => s.marks[i] ?? 0);
  const max = t.kind === "share" ? t.total : t.b;
  marks[index] = action === "fill" && t.kind === "table" ? t.b : Math.max(0, Math.min(max, marks[index] + (action === "remove" ? -1 : 1)));
  return { ...s, marks };
}

export const engine: LearnEngine<TideState> = {
  id: "times-tide", name: "Times Tide", island: "numbers", ages: [6, 11], ownLevels: true,
  tagline: "Fill pools, build arrays, share fish.", description: "Move fish and shells to see how groups become multiplication and division.",
  help: "Tap a pool to add one fish. On array levels, fill each row with shells. Count the whole picture and enter the total. For sharing, give every friend the same number and leave extras in the last pool. Use Hint whenever you need it.",
  color: "#AC5C26", surface: "#FFF0CF", modes: ["solo", "together"],
  levelNames: [
    { name: "Fish in equal pools", description: "Make equal groups of 2, 5 or 10 fish." },
    { name: "Shell arrays", description: "Build rows and connect them to repeated addition." },
    { name: "Skip-count reef", description: "Count by groups across a reef array." },
    { name: "Area-model treasure", description: "Split a two-digit multiplication into tens and ones." },
    { name: "Fair fish shares", description: "Solve division and factor puzzles with leftovers." },
  ],
  skills: { "num.equal-groups": "Equal groups", "num.arrays": "Arrays and repeated addition", "num.tables": "Times tables", "num.division": "Division with remainders", "num.area": "Area model multiplication" },
  create: (o, c) => { const level = levelOf(o); const tasks: TideTask[] = []; const seen = new Set<string>(); let tries = 0; while (tasks.length < 5 && tries++ < 100) { const t = makeTask(level, c.rng); const key = `${t.a}:${t.b}:${t.remainder}`; if (!seen.has(key)) { tasks.push(t); seen.add(key); } } return { version: 1, level, tasks, index: 0, marks: [], answer: "", helped: false }; },
  validate: (x, o): x is TideState => { if (!x || typeof x !== "object" || Object.keys(x).sort().join() !== "answer,helped,index,level,marks,tasks,version") return false; const s = x as TideState; const t = s.tasks?.[s.index]; return s.version === 1 && s.level === levelOf(o) && Array.isArray(s.tasks) && s.tasks.length === 5 && s.tasks.every(v => taskValid(v, s.level)) && Number.isInteger(s.index) && s.index >= 0 && s.index <= 5 && Array.isArray(s.marks) && s.marks.length <= (t?.kind === "share" ? t.b + 1 : t?.a ?? 0) && s.marks.every((v, i) => Number.isInteger(v) && v >= 0 && v <= (t?.kind === "share" ? t.total : t?.kind === "area" ? t.total : t?.b ?? 0)) && typeof s.answer === "string" && /^\d{0,3}$/.test(s.answer) && typeof s.helped === "boolean" && (s.index < 5 || (s.marks.length === 0 && s.answer === "")); },
  outcome: s => s.index === 5 ? "done" : null,
};
