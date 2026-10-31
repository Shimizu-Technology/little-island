import { growthTrack } from "../learn/growth/content";
import type { GrowthQuestion } from "../learn/growth/types";
import { random, shuffle } from "../games/types";
import { PICTURE_WORDS } from "../learn/content/reading/clues";
import { SENTENCES } from "../learn/content/reading/sentences";
import { wordAudio, wordEntry, type ReadingScene } from "../learn/kit/reading";
import {
  createMathQuestions, mathAnswer, mathSkill, mathSpeechKey, validMathQuestion, type MathQuestion,
} from "../math/questions";
import { gateAccepts, makeGate, type Gate } from "../state/grownUpGate";
import { validPracticeSettings, type PracticeResult, type PracticeSettings, type PracticeSummary } from "./types";

export const PRACTICE_LENGTH = 3;
export type PracticeQuestion =
  | { kind: "growth"; id: string; skill: string; speech: string; text: string; task: GrowthQuestion; choices: string[]; answer: number }
  | { kind: "math"; id: string; skill: string; speech: string; question: MathQuestion }
  | { kind: "word"; id: string; skill: string; speech: string; text: string; choices: string[]; answer: number }
  | { kind: "sentence"; id: string; skill: string; speech: string; text: string; choices: ReadingScene[]; answer: number };

export type PracticeRound = {
  questions: PracticeQuestion[];
  index: number;
  results: PracticeResult[];
  helped: boolean;
  shown: boolean;
  solved: boolean;
  wrong: number | null;
  gate: Gate;
  gateOpen: boolean;
  gateError: boolean;
  status: "playing" | "complete" | "bypassed" | "cancelled";
};
export type PracticeAction =
  | { type: "choose"; question: number; choice: number }
  | { type: "show"; question: number }
  | { type: "next"; question: number }
  | { type: "gate-open" }
  | { type: "gate-close" }
  | { type: "cancel" }
  | { type: "bypass"; answer: string };

/** Keep malformed configuration out of the bounded generators. No save/store dependency. */
export function practiceConfigKey(settings: PracticeSettings): string {
  if (!validPracticeSettings(settings)) throw new Error("Invalid practice settings");
  return `${settings.enabled}:${settings.subject}:${settings.limit}:${settings.operation}:${settings.mathStage ?? "basic"}:${settings.readingStage ?? "basic"}`;
}

export function practiceAnswer(q: PracticeQuestion): number {
  return q.kind === "math" ? q.question.choices.indexOf(mathAnswer(q.question)) : q.answer;
}
export const practiceChoiceCount = (q: PracticeQuestion) => q.kind === "math" ? q.question.choices.length : q.choices.length;

/** Exactly three questions, chosen with the existing bounded arithmetic and curated reading banks. */
export function createPracticeRound(settings: PracticeSettings, seed: number): PracticeRound {
  practiceConfigKey(settings);
  const rng = random(seed);
  const math = createMathQuestions({ limit: settings.limit, operation: settings.operation, missing: true }, PRACTICE_LENGTH, rng);
  if (!math.every(q => validMathQuestion(q, settings.limit))) throw new Error("Invalid practice arithmetic");
  const words = shuffle(PICTURE_WORDS.easy, rng);
  const sentences = SENTENCES.filter(s => s.pace === "easy");
  const sentence = sentences[Math.floor(rng() * sentences.length)];
  const reading = (index: number, useSentence: boolean): PracticeQuestion => {
    if (useSentence) {
      const order = shuffle([0, 1, 2], rng);
      return {
        kind: "sentence", id: `sentence-${sentence.id}`, skill: "read.meaning",
        text: sentence.text, speech: `which-one-sentence-${sentence.id}`,
        choices: order.map(i => ({ ...sentence.scenes[i] })), answer: order.indexOf(0),
      };
    }
    const target = words[index];
    const choices = shuffle([target, ...words.filter(w => w !== target).slice(0, 2)], rng);
    return {
      kind: "word", id: `word-${target}`, skill: wordEntry(target)!.skill,
      text: target, speech: wordAudio(target), choices, answer: choices.indexOf(target),
    };
  };
  const advanced = (subject: "math" | "reading", index: number): PracticeQuestion | null => {
    const stage = subject === "math" ? settings.mathStage : settings.readingStage;
    if (!stage) return null;
    const game = subject === "math" ? "quick-practice" : "which-one";
    const pool = growthTrack(game, stage)!.questions.filter(q => !q.tiles);
    const task = shuffle(pool, random(seed ^ 0x34ad))[index % pool.length];
    const choices = shuffle(task.choices.map(c => c.value), rng);
    return { kind: "growth", text: [task.context, task.prompt].filter(Boolean).join(" "), id: `${game}-${stage}-${task.id}`, skill: task.skill, speech: `growth-${game}-${stage}-${task.id}-prompt`, task, choices, answer: choices.indexOf(task.answer) };
  };
  const questions = math.map((q, index): PracticeQuestion => {
    const subject = settings.subject === "reading" || (settings.subject === "mixed" && index === 1) ? "reading" : "math";
    const growth = advanced(subject, index);
    if (growth) return growth;
    if (settings.subject === "reading") return reading(index, index === 1);
    if (settings.subject === "mixed" && index === 1) return reading(index, seed % 2 === 0);
    // Keep the shared generator's add/subtract alternation when reading occupies the middle slot.
    if (settings.subject === "mixed" && index === 2) q = math[1];
    return { kind: "math", id: `math-${index}`, skill: mathSkill(q, settings.limit), speech: mathSpeechKey(q), question: q };
  });
  return {
    questions, index: 0, results: [], helped: false, shown: false, solved: false, wrong: null,
    gate: makeGate(rng), gateOpen: false, gateError: false, status: "playing",
  };
}

/** Pure transitions. An old question's queued tap cannot act on a later question. */
export function practiceTransition(s: PracticeRound, action: PracticeAction): PracticeRound {
  if (s.status !== "playing") return s;
  if (action.type === "cancel") return { ...s, status: "cancelled", gateOpen: false };
  if (action.type === "gate-open") return s.gateOpen ? s : { ...s, gateOpen: true, gateError: false };
  if (action.type === "gate-close") return { ...s, gateOpen: false, gateError: false };
  if (action.type === "bypass") {
    if (!s.gateOpen) return s;
    return gateAccepts(s.gate, action.answer)
      ? { ...s, status: "bypassed", gateOpen: false }
      : { ...s, gateError: true };
  }
  if (s.gateOpen || action.question !== s.index) return s;
  if (action.type === "next") {
    if (!s.solved) return s;
    return s.results.length === PRACTICE_LENGTH
      ? { ...s, status: "complete" }
      : { ...s, index: s.index + 1, helped: false, shown: false, solved: false, wrong: null };
  }
  if (s.solved) return s;
  if (action.type === "show") return { ...s, helped: true, shown: true };
  const q = s.questions[s.index];
  if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= practiceChoiceCount(q)) return s;
  if (action.choice !== practiceAnswer(q)) return { ...s, helped: true, wrong: action.choice };
  return { ...s, solved: true, wrong: null, results: [...s.results, { skill: q.skill, helped: s.helped }] };
}

/** Synchronous ownership of input and terminal delivery, independent of React batching. */
export function createPracticeSession(settings: PracticeSettings, seed: number) {
  let state = createPracticeRound(settings, seed);
  return {
    initial: state,
    canHear(question: number) {
      return state.status === "playing" && !state.gateOpen && !state.solved && state.index === question;
    },
    dispatch(action: PracticeAction, active = true): { state: PracticeRound; changed: boolean; summary?: PracticeSummary; cancelled?: boolean } {
      if (!active && action.type !== "cancel") return { state, changed: false };
      const previous = state;
      state = practiceTransition(state, action);
      if (state === previous) return { state, changed: false };
      if (state.status === "cancelled") return { state, changed: true, cancelled: true };
      if (state.status === "complete" || state.status === "bypassed")
        return { state, changed: true, summary: { results: state.results.map(result => ({ ...result })), bypassed: state.status === "bypassed" } };
      return { state, changed: true };
    },
  };
}
