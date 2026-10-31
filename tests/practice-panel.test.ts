import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createPracticeRound, createPracticeSession, practiceAnswer, practiceConfigKey, practiceTransition,
  type PracticeRound,
} from "../src/practice/engine";
import { defaultPracticeSettings, type PracticeSettings, type PracticeSummary } from "../src/practice/types";
import { mathAnswer, mathEquation, mathSkill, mathSpeechKey, validMathQuestion } from "../src/math/questions";
import { checkDecodability, wordAudio, wordEntry } from "../src/learn/kit/reading";
import { pictureFor } from "../src/learn/content/reading/clues";
import { SENTENCES } from "../src/learn/content/reading/sentences";

const config = (subject: PracticeSettings["subject"] = "math"): PracticeSettings => ({ ...defaultPracticeSettings, enabled: true, subject });
const chooseRight = (s: PracticeRound) => practiceTransition(s, { type: "choose", question: s.index, choice: practiceAnswer(s.questions[s.index]) });
const next = (s: PracticeRound) => practiceTransition(s, { type: "next", question: s.index });

describe("three-question practice selection", () => {
  it("selects deterministic bounded math/reading/mixed rounds across seeds and settings", () => {
    for (const subject of ["math", "reading", "mixed"] as const)
      for (const limit of [10, 20] as const)
        for (const operation of ["add", "subtract", "mixed"] as const)
          for (let seed = 0; seed < 80; seed++) {
            const settings = { ...config(subject), limit, operation };
            const s = createPracticeRound(settings, seed);
            expect(s).toEqual(createPracticeRound(settings, seed));
            expect(s.questions).toHaveLength(3);
            expect(new Set(s.questions.map(q => q.id)).size).toBe(3);
            expect(s.results).toEqual([]);
            expect(s.questions.filter(q => q.kind === "math")).toHaveLength(subject === "math" ? 3 : subject === "reading" ? 0 : 2);
            if (subject === "mixed" && operation === "mixed")
              expect(s.questions.filter(q => q.kind === "math").map(q => q.question.operation)).toEqual(["add", "subtract"]);
            for (const q of s.questions) {
              expect(practiceAnswer(q)).toBeGreaterThanOrEqual(0);
              expect(practiceAnswer(q)).toBeLessThan(3);
              if (q.kind === "math") {
                expect(validMathQuestion(q.question, limit)).toBe(true);
                expect(q.question.choices[practiceAnswer(q)]).toBe(mathAnswer(q.question));
                expect(q.speech).toBe(mathSpeechKey(q.question));
                expect(q.skill).toBe(mathSkill(q.question, limit));
                expect(mathEquation(q.question)).toContain("?");
                if (operation !== "mixed") expect(q.question.operation).toBe(operation);
              } else {
                expect(checkDecodability(q.text, "easy")).toEqual([]);
                expect(q.choices).toHaveLength(3);
                if (q.kind === "word") {
                  expect(q.choices[q.answer]).toBe(q.text);
                  expect(q.skill).toBe(wordEntry(q.text)!.skill);
                  expect(q.speech).toBe(wordAudio(q.text));
                  expect(q.choices.every(word => pictureFor(word) === word && wordEntry(word)!.pace === "easy")).toBe(true);
                } else {
                  const source = SENTENCES.find(item => `sentence-${item.id}` === q.id)!;
                  expect(q.choices[q.answer]).toEqual(source.scenes[0]);
                  expect(q.text).toBe(source.text);
                  expect(q.speech).toBe(`which-one-sentence-${source.id}`);
                }
              }
            }
          }
  });
  it("reuses bundled reading speech without asking Hear to speak the answer", () => {
    const speech = JSON.parse(readFileSync(new URL("../scripts/learn/reading.json", import.meta.url), "utf8")) as Record<string, string>;
    expect(speech["which-one-intro"]).toBe("Read it. Then tap the picture that matches!");
    const kinds = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      for (const q of createPracticeRound(config("reading"), seed).questions) {
        if (q.kind === "math") continue;
        kinds.add(q.kind);
        expect(speech[q.speech]).toBe(q.text);
        expect(existsSync(new URL(`../assets/audio/${q.speech}.m4a`, import.meta.url))).toBe(true);
      }
    }
    expect(kinds).toEqual(new Set(["word", "sentence"]));
    const mixedKinds = new Set([0, 1].map(seed => createPracticeRound(config("mixed"), seed).questions[1].kind));
    expect(mixedKinds).toEqual(new Set(["word", "sentence"]));
  });
  it("rejects malformed settings and distinguishes every configuration change", () => {
    for (const patch of [{ limit: 100000 }, { subject: "all" }, { operation: "multiply" }, { enabled: 1 }, { extra: true }])
      expect(() => createPracticeRound({ ...config(), ...patch } as PracticeSettings, 1)).toThrow("Invalid practice settings");
    const settings = config();
    for (const patch of [{ enabled: false }, { subject: "reading" }, { limit: 20 }, { operation: "add" }])
      expect(practiceConfigKey({ ...settings, ...patch } as PracticeSettings)).not.toBe(practiceConfigKey(settings));
  });
});

describe("practice transitions and truthful help notes", () => {
  for (const subject of ["math", "reading", "mixed"] as const) {
    it(`${subject}: needs three correct/guided selections, with no reset or perfect-answer gate`, () => {
      let s = createPracticeRound(config(subject), 5);
      expect(next(s)).toBe(s);
      s = chooseRight(s);
      expect(s.results).toEqual([{ skill: s.questions[0].skill, helped: false }]);
      expect(chooseRight(s)).toBe(s);
      s = next(s);
      const wrongChoice = (practiceAnswer(s.questions[1]) + 1) % 3;
      const missed = practiceTransition(s, { type: "choose", question: 1, choice: wrongChoice });
      expect(missed.results).toHaveLength(1);
      expect(missed.helped).toBe(true);
      expect(missed.solved).toBe(false);
      expect(next(missed)).toBe(missed);
      s = chooseRight(missed);
      expect(s.results.map(r => r.helped)).toEqual([false, true]);
      s = next(s);
      s = practiceTransition(s, { type: "show", question: 2 });
      expect(s.results).toHaveLength(2);
      expect(s.shown).toBe(true);
      expect(s.solved).toBe(false);
      expect(next(s)).toBe(s);
      s = chooseRight(s);
      expect(s.results.map(r => r.helped)).toEqual([false, true, true]);
      s = next(s);
      expect(s.status).toBe("complete");
      expect(s.results).toHaveLength(3);
      expect(next(s)).toBe(s);
    });
  }
  it("ignores out-of-range choices and stale events without mutating the original round", () => {
    const original = createPracticeRound(config(), 3);
    const copy = structuredClone(original);
    for (const choice of [-1, 3, 999, NaN, Infinity, 1.5])
      expect(practiceTransition(original, { type: "choose", question: 0, choice })).toBe(original);
    const s = next(chooseRight(original));
    for (const action of [
      { type: "show", question: 0 }, { type: "next", question: 0 }, { type: "choose", question: 0, choice: 0 },
    ] as const) expect(practiceTransition(s, action)).toBe(s);
    expect(original).toEqual(copy);
    expect(s.results).toHaveLength(1);
  });
  it("requires an open multiplication gate and preserves only completed results on bypass", () => {
    for (const completed of [0, 1, 2, 3]) {
      let s = createPracticeRound(config("mixed"), 23);
      for (let i = 0; i < completed; i++) {
        s = chooseRight(s);
        if (i < 2) s = next(s);
      }
      expect(practiceTransition(s, { type: "bypass", answer: String(s.gate.answer) })).toBe(s);
      s = practiceTransition(s, { type: "gate-open" });
      for (const answer of ["", "wrong", "0", `${s.gate.answer}.0`, `${s.gate.answer}000`]) {
        const rejected = practiceTransition(s, { type: "bypass", answer });
        expect(rejected.status).toBe("playing");
        expect(rejected.gateError).toBe(true);
      }
      expect(chooseRight(s)).toBe(s);
      s = practiceTransition(s, { type: "bypass", answer: ` ${s.gate.answer} ` });
      expect(s.status).toBe("bypassed");
      expect(s.results).toHaveLength(completed);
      expect(s.results.every(result => !result.helped)).toBe(true);
    }
  });
});

describe("synchronous panel session boundary", () => {
  it("delivers completion once even with batched repeated input and repeated finish/bypass", () => {
    const session = createPracticeSession(config("mixed"), 9);
    let s = session.initial;
    const summaries: PracticeSummary[] = [];
    for (let question = 0; question < 3; question++) {
      const action = { type: "choose", question, choice: practiceAnswer(s.questions[question]) } as const;
      for (let n = 0; n < 20; n++) s = session.dispatch(action).state;
      expect(s.results).toHaveLength(question + 1);
      for (let n = 0; n < 20; n++) {
        const result = session.dispatch({ type: "next", question });
        s = result.state;
        if (result.summary) summaries.push(result.summary);
      }
    }
    for (let n = 0; n < 20; n++) {
      expect(session.dispatch({ type: "bypass", answer: String(s.gate.answer) }).summary).toBeUndefined();
      expect(session.dispatch({ type: "cancel" }).cancelled).toBeUndefined();
    }
    expect(summaries).toEqual([{ results: s.results, bypassed: false }]);
    expect(session.canHear(2)).toBe(false);
  });
  it("pauses input/audio eligibility and allows cancellation while inactive or in the gate", () => {
    const session = createPracticeSession(config(), 10);
    const s = session.initial;
    expect(session.canHear(0)).toBe(true);
    expect(session.dispatch({ type: "choose", question: 0, choice: practiceAnswer(s.questions[0]) }, false).changed).toBe(false);
    session.dispatch({ type: "gate-open" });
    expect(session.canHear(0)).toBe(false);
    expect(session.dispatch({ type: "cancel" }, false).cancelled).toBe(true);
    expect(session.dispatch({ type: "cancel" }).cancelled).toBeUndefined();
    expect(session.dispatch({ type: "bypass", answer: String(s.gate.answer) }).summary).toBeUndefined();
    expect(session.canHear(0)).toBe(false);
  });
  it("returns completed help flags on bypass once and keeps the summary detached", () => {
    const session = createPracticeSession(config("reading"), 2);
    session.dispatch({ type: "show", question: 0 });
    session.dispatch({ type: "choose", question: 0, choice: practiceAnswer(session.initial.questions[0]) });
    session.dispatch({ type: "next", question: 0 });
    session.dispatch({ type: "show", question: 1 });
    session.dispatch({ type: "gate-open" });
    const action = { type: "bypass", answer: String(session.initial.gate.answer) } as const;
    const result = session.dispatch(action);
    expect(result.summary).toEqual({ bypassed: true, results: [{ skill: session.initial.questions[0].skill, helped: true }] });
    expect(session.dispatch(action).summary).toBeUndefined();
    result.summary!.results[0].helped = false;
    expect(result.state.results[0].helped).toBe(true);
  });
});
