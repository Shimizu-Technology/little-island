import { createMathQuestions, mathAnswer, mathResult, type MathConfig, type MathQuestion, validMathQuestion } from "../../../math/questions";
import type { LearnId, LearnOptions } from "../../types";

export type MathGame = Extract<LearnId, "shell-math" | "number-hop" | "quick-practice">;
export type MathRound = {
  version: 1;
  questions: MathQuestion[];
  index: number;
  /** One flag per completed question, including the settled current question. */
  completed: boolean[];
  helped: boolean;
  shown: boolean;
  steps: number;
  wrong: number | null;
  solved: boolean;
};
export const isMathGame = (id: string): id is MathGame => ["shell-math", "number-hop", "quick-practice"].includes(id);
export const mathConfig = (o: LearnOptions, game: MathGame): MathConfig => ({
  limit: o.pace === "easy" ? 10 : 20,
  operation: o.mathOperation ?? "add",
  missing: game === "quick-practice",
});
export const validMathOptions = (o: LearnOptions) =>
  (o.mode === "solo" || o.mode === "together") && (o.pace === "easy" || o.pace === "medium" || o.pace === "hard") &&
  o.language === undefined && (o.mathOperation === undefined || ["add", "subtract", "mixed"].includes(o.mathOperation));
export const questionOf = (s: MathRound) => s.questions[Math.min(s.index, s.questions.length - 1)];
export function createRound(o: LearnOptions, game: MathGame, rng: () => number): MathRound {
  return { version: 1, questions: createMathQuestions(mathConfig(o, game), (game === "quick-practice" ? 3 : 5) + (o.pace === "hard" ? 2 : 0), rng).slice(o.pace === "hard" ? 2 : 0),
    index: 0, completed: [], helped: false, shown: false, steps: 0, wrong: null, solved: false };
}
export type MathAction = { type: "step" } | { type: "show" } | { type: "answer"; answer: number } | { type: "next" };
/** No timers, random draws, speech or external writes in a round transition. */
export function mathMove(s: MathRound, game: MathGame, action: MathAction): MathRound {
  if (!action || typeof action !== "object" || s.index >= s.questions.length) return s;
  const q = questionOf(s);
  if (action.type === "next") return s.solved ? {
    ...s, index: s.index + 1, helped: false, shown: false, steps: 0, wrong: null, solved: false,
  } : s;
  if (s.solved) return s;
  if (action.type === "show") return s.shown ? s : { ...s, helped: true, shown: true, steps: game === "quick-practice" ? 0 : q.b, wrong: null };
  if (action.type === "step") return game === "quick-practice" || s.steps >= q.b ? s : { ...s, steps: s.steps + 1, wrong: null };
  if (action.type !== "answer" || !q.choices.includes(action.answer) || (game !== "quick-practice" && s.steps !== q.b)) return s;
  return action.answer === mathAnswer(q)
    ? { ...s, solved: true, wrong: null, completed: [...s.completed, s.helped] }
    : { ...s, helped: true, wrong: action.answer };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const int = (v: unknown, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export function validRound(v: unknown, o: LearnOptions, game: MathGame): v is MathRound {
  if (!validMathOptions(o) || !object(v) || Object.keys(v).length !== 9 ||
    Object.keys(v).some(k => !["version", "questions", "index", "completed", "helped", "shown", "steps", "wrong", "solved"].includes(k))) return false;
  const config = mathConfig(o, game), count = game === "quick-practice" ? 3 : 5;
  if (v.version !== 1 || !Array.isArray(v.questions) || v.questions.length !== count ||
    !v.questions.every((q, i) => validMathQuestion(q, config.limit) &&
      q.operation === (config.operation === "mixed" ? i % 2 ? "subtract" : "add" : config.operation) &&
      (o.pace === "hard" || i >= 2 || Math.max(q.a, q.b, mathResult(q)) <= 6) &&
      q.blank === (game === "quick-practice" && (i + (o.pace === "hard" ? 2 : 0)) % 3 === 2 ? "second" : "result")) ||
    !int(v.index, count) || !Array.isArray(v.completed) || !v.completed.every(n => typeof n === "boolean") ||
    typeof v.helped !== "boolean" || typeof v.shown !== "boolean" || typeof v.solved !== "boolean" || !int(v.steps, config.limit)) return false;
  const s = v as MathRound;
  if (s.completed.length !== s.index + (s.solved ? 1 : 0)) return false;
  if (s.index === count) return !s.solved && !s.helped && !s.shown && s.steps === 0 && s.wrong === null;
  const q = questionOf(s);
  if (game === "quick-practice" ? s.steps !== 0 : s.steps > q.b) return false;
  if (s.shown && (!s.helped || (game !== "quick-practice" && s.steps !== q.b))) return false;
  if (s.solved && (s.completed[s.index] !== s.helped || (game !== "quick-practice" && s.steps !== q.b))) return false;
  if (s.wrong !== null && (!s.helped || s.solved || !q.choices.includes(s.wrong) || s.wrong === mathAnswer(q) ||
    (game !== "quick-practice" && s.steps !== q.b))) return false;
  return true;
}
