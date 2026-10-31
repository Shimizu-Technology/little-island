import type { LearnEngine } from "../../types";
import { levelOf } from "../../levelOptions";

export type AlgebraKind = "steps" | "depth" | "missing" | "balance" | "two-step" | "substitution" | "pattern" | "expression" | "inequality";
export type AlgebraTask = { kind: AlgebraKind; a: number; b: number; extra: number; answer: number };
export type AlgebraState = { version: 1 | 2; level: number; tasks: AlgebraTask[]; index: number; value: number; offset: number; divided: boolean; helped: boolean };
const pick = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** Each row is an equation with an integer answer; no round depends on random retries for solvability. */
export function makeTask(level: number, rng: () => number, index = 0): AlgebraTask {
  if (level === 1) {
    const a = pick(rng, 3, 11), b = index % 2 ? -pick(rng, 1, Math.min(5, a)) : pick(rng, 1, Math.min(5, 15 - a));
    return { kind: "steps", a, b, extra: 0, answer: a + b };
  }
  if (level === 2) {
    const a = pick(rng, -8, 5), b = index % 2 ? -pick(rng, 1, 5) : pick(rng, 1, 5);
    return { kind: "depth", a, b, extra: 0, answer: a + b };
  }
  if (level === 3) {
    const answer = pick(rng, -10, 8), b = pick(rng, 2, 6);
    return { kind: "missing", a: answer + b, b, extra: 0, answer };
  }
  if (level === 4) {
    const a = pick(rng, 2, 8), answer = pick(rng, 2, 13);
    return { kind: "balance", a, b: answer + a, extra: 1, answer };
  }
  if (index % 2) {
    const a = pick(rng, 1, 3), b = pick(rng, 2, 3), extra = pick(rng, 2, 4);
    return { kind: "substitution", a, b, extra, answer: a + b * extra };
  }
  const a = pick(rng, 2, 7), extra = pick(rng, 2, 3), answer = pick(rng, 2, 12);
  return { kind: "two-step", a, b: answer * extra + a, extra, answer };
}

const shape = (task: AlgebraTask) => task && typeof task === "object" && Object.keys(task).sort().join() === "a,answer,b,extra,kind" && [task.a, task.b, task.extra, task.answer].every(Number.isInteger);
export function taskValid(task: AlgebraTask, level: number, version: 1 | 2 = 2): boolean {
  if (!shape(task)) return false;
  const t = task;
  if (version === 1) {
    if (level === 1) return t.kind === "pattern" && t.a >= 1 && t.a <= 12 && t.b >= 2 && t.b <= 5 && t.extra === 3 && t.answer === t.a + 3 * t.b;
    if (level === 2) return t.kind === "depth" && t.a >= -9 && t.a <= 4 && t.b >= -6 && t.b <= 6 && t.b !== 0 && t.extra === 0 && t.answer === t.a + t.b;
    if (level === 3) return t.kind === "expression" && t.a >= 1 && t.a <= 8 && t.b >= 2 && t.b <= 6 && t.extra >= 2 && t.extra <= 4 && t.answer === t.a + t.b * t.extra;
    if (level === 4) return t.kind === "balance" && t.a >= 2 && t.a <= 9 && t.extra === 1 && t.answer >= 2 && t.answer <= 15 && t.b === t.answer + t.a;
    return ["two-step", "inequality"].includes(t.kind) && t.a >= 2 && t.a <= 9 && t.extra >= 2 && t.extra <= 3 && t.answer >= 2 && t.answer <= 14 && t.b === t.answer * t.extra + t.a;
  }
  if (level === 1) return t.kind === "steps" && t.a >= 3 && t.a <= 11 && t.b !== 0 && Math.abs(t.b) <= 5 && t.extra === 0 && t.answer === t.a + t.b && t.answer >= 0 && t.answer <= 15;
  if (level === 2) return t.kind === "depth" && t.a >= -8 && t.a <= 5 && t.b !== 0 && Math.abs(t.b) <= 5 && t.extra === 0 && t.answer === t.a + t.b && t.answer >= -13 && t.answer <= 10;
  if (level === 3) return t.kind === "missing" && t.b >= 2 && t.b <= 6 && t.extra === 0 && t.answer === t.a - t.b && t.answer >= -10 && t.answer <= 8;
  if (level === 4) return t.kind === "balance" && t.a >= 2 && t.a <= 8 && t.b === t.a + t.answer && t.answer >= 2 && t.answer <= 13 && t.extra === 1;
  return t.kind === "substitution" ? t.a >= 1 && t.a <= 3 && t.b >= 2 && t.b <= 3 && t.extra >= 2 && t.extra <= 4 && t.answer === t.a + t.b * t.extra : t.kind === "two-step" && t.a >= 2 && t.a <= 7 && t.extra >= 2 && t.extra <= 3 && t.answer >= 2 && t.answer <= 12 && t.b === t.answer * t.extra + t.a;
}
export const initialValue = (task?: AlgebraTask) => task && (task.kind === "steps" || task.kind === "depth") ? task.a : 0;
export function solved(state: AlgebraState): boolean {
  const task = state.tasks[state.index];
  if (!task) return false;
  if (task.kind === "balance") return state.offset === -task.a && state.value === task.answer;
  if (task.kind === "inequality") return state.offset === -task.a && state.divided && task.extra * state.value + task.a <= task.b;
  if (task.kind === "two-step") return state.offset === -task.a && state.divided && state.value === task.answer;
  return state.value === task.answer;
}

/** Shared worked maths for new and supported legacy tasks. */
export function workedHint(t: AlgebraTask): string {
  if (t.kind === "pattern") return `Add ${t.b} each time. The last number is ${t.a + 2 * t.b}; ${t.a + 2 * t.b} + ${t.b} = ${t.answer}.`;
  if (t.kind === "expression" || t.kind === "substitution") return `Multiply first: ${t.b} × ${t.extra} = ${t.b * t.extra}. Then ${t.a} + ${t.b * t.extra} = ${t.answer}.`;
  if (t.kind === "inequality") return `Take ${t.a} from both sides, then divide both sides by ${t.extra}. Keep ≤: x ≤ ${t.answer}. Any integer at or below ${t.answer} works.`;
  if (t.kind === "balance" || t.kind === "two-step") return `Take ${t.a} from both pans.${t.extra > 1 ? ` Then split both sides into ${t.extra} equal groups.` : ""}`;
  if (t.kind === "missing") return `Undo plus ${t.b}: move ${t.b} down from ${t.a}.`;
  return `Start at ${t.a}. Move ${Math.abs(t.b)} ${t.b < 0 ? "down" : "up"} to reach ${t.answer}.`;
}
/** Extend the line instead of pinning an out-of-range diver to an endpoint. */
export function seaLineRange(value: number, start?: number) {
  const min = Math.floor(Math.min(value - 10, start ?? value, 0) / 5) * 5;
  const max = Math.ceil(Math.max(value + 10, start ?? value, 0) / 5) * 5;
  return { min, max };
}

export const engine: LearnEngine<AlgebraState> = {
  id: "treasure-algebra", name: "Treasure Algebra", island: "numbers", ages: [9, 14], ownLevels: true,
  tagline: "Dive, balance, and open the chest.", description: "Travel above and below sea level, then balance treasure equations.",
  help: "Move the diver with the step buttons. For a balance, remove the same weight from both pans, then divide both sides if needed. Hint explains one move without ending the round.",
  color: "#AC5C26", surface: "#FFF0CF", modes: ["solo", "together"],
  levelNames: [
    { name: "Sunny steps", description: "Add and subtract positive steps on a line." },
    { name: "Below sea level", description: "Cross zero into negative depths." },
    { name: "Missing treasure", description: "Find the number hiding in a box." },
    { name: "Balance the chest", description: "Remove the same weight from both pans." },
    { name: "Two-step treasure", description: "Undo two-step equations and substitute a value." },
  ],
  skills: { "num.patterns": "Number steps", "num.integers": "Positive and negative numbers", "num.expressions": "Missing numbers", "num.balance": "Balancing equations", "num.two-step": "Two-step equations and substitution" },
  create: (options, context) => {
    const level = levelOf(options), tasks: AlgebraTask[] = [], seen = new Set<string>();
    let attempts = 0;
    while (tasks.length < 5 && attempts++ < 200) {
      const task = makeTask(level, context.rng, tasks.length), key = JSON.stringify(task);
      if (!seen.has(key)) { seen.add(key); tasks.push(task); }
    }
    return { version: 2, level, tasks, index: 0, value: initialValue(tasks[0]), offset: 0, divided: false, helped: false };
  },
  validate: (value, options): value is AlgebraState => {
    if (!value || typeof value !== "object" || Object.keys(value).sort().join() !== "divided,helped,index,level,offset,tasks,value,version") return false;
    const s = value as AlgebraState;
    if ((s.version !== 1 && s.version !== 2) || s.level !== levelOf(options) || !Array.isArray(s.tasks) || s.tasks.length !== 5 || !s.tasks.every(t => taskValid(t, s.level, s.version)) || !Number.isInteger(s.index) || s.index < 0 || s.index > 5) return false;
    const t = s.tasks[s.index];
    return Number.isInteger(s.value) && s.value >= -20 && s.value <= 100 && Number.isInteger(s.offset) && s.offset >= -20 && s.offset <= 20 && typeof s.divided === "boolean" && typeof s.helped === "boolean" && (s.index < 5 || (s.value === 0 && s.offset === 0 && !s.divided)) && (!t || ["balance", "two-step", "inequality"].includes(t.kind) || (s.offset === 0 && !s.divided));
  },
  outcome: state => state.index === 5 ? "done" : null,
};
