import { WORDS } from "../content/reading/words";
import type { Pace } from "../types";

export type ReadingScene = {
  subject: string;
  object: string;
  relation: "on" | "in" | "under" | "beside";
  color: string;
  size: "big" | "little";
  /** Explicit story dimensions; ordinary sentence scenes keep their defaults. */
  subjectSize?: number;
  objectSize?: number;
};
export type ReadingWord = { word: string; skill: string; pace: Pace; tiles: readonly string[] };
export const wordBank: readonly ReadingWord[] = WORDS.map((w) =>
  w.word === "box" || w.word === "fox" ? { ...w, tiles: [w.word[0], "o", "x"] } : w
);
export const paceRank: Record<Pace, number> = { easy: 0, medium: 1, hard: 2 };
/** Deliberate exceptions, visible to the adult; never inferred from spelling. */
export const trickyWords: Record<Pace, readonly string[]> = {
  easy: [
    "where",
    "what",
    "does",
    "have",
    "the",
    "a",
    "is",
    "to",
    "i",
    "you",
    "was",
    "said",
    "we",
    "he",
    "she",
    "my",
    "of",
    "are",
    "and",
    "has",
    "under",
    "little",
    "blue",
    "for",
    "in",
    "on",
  ],
  medium: ["be", "me", "they", "her", "his"],
  hard: ["have", "one", "two"],
};
export const readingSkills: Record<string, string> = {
  "read.short-a": "Short a words",
  "read.short-e": "Short e words",
  "read.short-i": "Short i words",
  "read.short-o": "Short o words",
  "read.short-u": "Short u words",
  "read.digraph-sh": "The sh sound",
  "read.digraph-ch": "The ch sound",
  "read.digraph-th": "The th sound",
  "read.digraph-ck": "The ck sound",
  "read.blend-start": "Blends at the start",
  "read.blend-end": "Blends at the end",
  "read.ng": "The ng sound",
  "read.silent-e": "Silent e words",
  "read.vowel-team-ee": "The ee team",
  "read.vowel-team-ea": "The ea team",
  "read.vowel-team-ai": "The ai team",
  "read.vowel-team-oa": "The oa team",
  "read.vowel-team-oo": "The oo team",
  "read.r-controlled-ar": "The ar sound",
  "read.r-controlled-or": "The or sound",
  "read.careful-reading": "Reading every word",
  "read.meaning": "Reading for meaning",
};
export const tokens = (text: string): string[] => text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
export const wordEntry = (word: string) => wordBank.find((w) => w.word === word.toLowerCase());
export const wordsAt = (pace: Pace) => wordBank.filter((w) => paceRank[w.pace] <= paceRank[pace]);
/** Every word must be curated at this pace or explicitly tricky. Unknown words fail closed. */
export function checkDecodability(text: string, pace: Pace): string[] {
  const allowed = new Set([
    ...wordsAt(pace).map((w) => w.word),
    ...Object.entries(trickyWords)
      .filter(([p]) => paceRank[p as Pace] <= paceRank[pace])
      .flatMap(([, words]) => words),
  ]);
  return [...new Set(tokens(text).filter((w) => !allowed.has(w)))];
}
const sounds: Record<string, string> = {
  c: "k",
  ck: "k",
  ll: "l",
  ss: "s",
  a_e: "long a",
  i_e: "long i",
  o_e: "long o",
  ee: "long e",
  ea: "long e",
  ai: "long a",
  oa: "long o",
  oo: "oo",
};
export function phonemes(word: string): string[] {
  return (wordEntry(word)?.tiles ?? []).flatMap((t) =>
    t === "x"
      ? ["k", "s"]
      : [t === "s" && ["rose", "nose", "rise", "has"].includes(word.toLowerCase()) ? "z" : (sounds[t] ?? t)]
  );
}
export const wordAudio = (word: string) => `sound-boat-word-${word.toLowerCase().replace(/[^a-z]/g, "")}`;
export const sceneLabel = (s: ReadingScene) =>
  s.objectSize !== undefined
    ? `${s.color} ${s.subject} beside a ${s.size} ${s.object}`
    : `${s.size} ${s.color} ${s.subject} ${s.relation === "beside" ? "with" : s.relation} ${s.object}`;
export const exact = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === [...keys].sort().join();
export const integer = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export const seat = (v: unknown): v is 0 | 1 => v === 0 || v === 1;
export const bools = (v: unknown, length: number): v is boolean[] =>
  Array.isArray(v) && v.length === length && v.every((b) => typeof b === "boolean");
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function familyResult(clean: readonly boolean[], starter: 0 | 1) {
  const scores = [0, 0];
  clean.forEach((right, i) => {
    if (right) scores[(starter + i) % 2]++;
  });
  return scores[0] === scores[1] ? ("draw" as const) : scores[0] > scores[1] ? (0 as const) : (1 as const);
}
