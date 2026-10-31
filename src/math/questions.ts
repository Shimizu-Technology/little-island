/** Shared arithmetic for learning boards and the optional three-question warm-up. */
export type MathLimit = 10 | 20;
export type MathOperation = "add" | "subtract" | "mixed";
export type MathConfig = { limit: MathLimit; operation: MathOperation; missing?: boolean };
export type MathQuestion = {
  version: 1;
  a: number;
  b: number;
  operation: "add" | "subtract";
  blank: "result" | "second";
  choices: number[];
};

export const mathResult = (q: MathQuestion) => q.operation === "add" ? q.a + q.b : q.a - q.b;
export const mathAnswer = (q: MathQuestion) => q.blank === "second" ? q.b : mathResult(q);
export const mathEquation = (q: MathQuestion, reveal = false) =>
  `${q.a} ${q.operation === "add" ? "+" : "−"} ${q.blank === "second" && !reveal ? "?" : q.b} = ${q.blank === "result" && !reveal ? "?" : mathResult(q)}`;
export const mathSpeechKey = (q: MathQuestion) => `math-${q.operation}-${q.a}-${q.b}-${q.blank}`;
export const mathSkill = (q: MathQuestion, limit: MathLimit) =>
  `num.${q.blank === "second" ? "missing" : q.operation}-within-${limit}`;

const integer = (v: unknown, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export function validMathQuestion(value: unknown, limit: MathLimit): value is MathQuestion {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const q = value as Record<string, unknown>;
  if (Object.keys(q).length !== 6 || Object.keys(q).some(k => !["version", "a", "b", "operation", "blank", "choices"].includes(k)) ||
    q.version !== 1 || !integer(q.a, limit) || !integer(q.b, limit) || q.a < 1 || q.b < 1 ||
    (q.operation !== "add" && q.operation !== "subtract") || (q.blank !== "result" && q.blank !== "second")) return false;
  const result = q.operation === "add" ? q.a + q.b : q.a - q.b;
  const answer = q.blank === "second" ? q.b : result;
  return integer(result, limit) && Array.isArray(q.choices) && q.choices.length === 3 &&
    q.choices.every(n => integer(n, limit)) && new Set(q.choices).size === 3 && q.choices.includes(answer);
}

/** Bounded even for a constant RNG; no retry-until-unique loops. */
export function createMathQuestions(config: MathConfig, count: number, rng: () => number): MathQuestion[] {
  const draw = (n: number) => Math.min(n - 1, Math.max(0, Math.floor((Number.isFinite(n) ? rng() : 0) * n) || 0));
  return Array.from({ length: Math.min(12, Math.max(0, Math.floor(count))) }, (_, index) => {
    const operation = config.operation === "mixed" ? (index % 2 ? "subtract" : "add") : config.operation;
    // First two questions use small amounts; a round then reaches its chosen range.
    const ceiling = index < 2 ? Math.min(config.limit, 6) : config.limit;
    const a = operation === "add" ? 1 + draw(ceiling - 1) : 1 + draw(ceiling);
    const b = operation === "add" ? 1 + draw(ceiling - a) : 1 + draw(a);
    const blank = config.missing && index % 3 === 2 ? "second" : "result";
    const answer = blank === "second" ? b : operation === "add" ? a + b : a - b;
    const pool = [answer, answer - 1, answer + 1, answer - 2, answer + 2, ...Array.from({ length: config.limit + 1 }, (_, n) => n)];
    const choices = [...new Set(pool.filter(n => n >= 0 && n <= config.limit))].slice(0, 3);
    for (let i = choices.length - 1; i > 0; i--) { const j = draw(i + 1); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    return { version: 1, a, b, operation, blank, choices };
  });
}
