import type { LearnEngine, LearnOptions, Pace, SkillProgress } from "../../types";
import { pickItems } from "../../skills";
import { random } from "../../../games/types";
import {
  bools,
  exact,
  familyResult,
  integer,
  phonemes,
  readingSkills,
  seat,
  wordEntry,
  wordsAt,
} from "../../kit/reading";
import { LEGACY_WARMUP_WORDS, PICTURE_WORDS } from "../../content/reading/clues";
import { LADDERS } from "../../content/reading/ladders";

/**
 * Sound Boat: hear (and see) a word, then tap letter tiles into the boat's boxes, left to right.
 * Words 1–4 are picture words (the first two have some letters already in); words 5–10 are two
 * word ladders, where one letter changes from the word before.
 */
export type BoatState = {
  pictures: string[];
  ladders: string[];
  starter: 0 | 1;
  /** Word 0–9; 10 when the boat has reached the island. */
  index: number;
  /** How many empty boxes of this word are filled. */
  filled: number;
  /** Wrong tiles tried for the box that is glowing now (they sit out until it fills). */
  out: string[];
  /** The help lit the right tile for the glowing box. */
  hint: boolean;
  /** A wrong tile or help was used on this word. */
  assisted: boolean;
  /** One entry per finished word: built with no wrong tile and no help. */
  clean: boolean[];
};

export const WORDS_PER_ROUND = 10;
const PICTURES = 4;
const ladderWords = (id: string): readonly string[] => LADDERS.find((l) => l.id === id)!.words;
export const boatWords = (s: Pick<BoatState, "pictures" | "ladders">): string[] => [
  ...s.pictures,
  ...s.ladders.flatMap((id) => ladderWords(id).slice(1)),
];
export const boatWord = (s: BoatState) => wordEntry(boatWords(s)[Math.min(s.index, WORDS_PER_ROUND - 1)])!;
/** In a ladder rung, the word she is changing; otherwise undefined. */
export function boatPrevious(s: BoatState): string | undefined {
  const i = Math.min(s.index, WORDS_PER_ROUND - 1);
  if (i < PICTURES) return undefined;
  const rung = (i - PICTURES) % 3,
    ladder = ladderWords(s.ladders[Math.floor((i - PICTURES) / 3)]);
  return ladder[rung];
}
export const isLadder = (s: BoatState) => Math.min(s.index, WORDS_PER_ROUND - 1) >= PICTURES;
export const startsLadder = (s: BoatState) => s.index === PICTURES || s.index === PICTURES + 3;
/** Box positions she fills, in order. The first words have some letters already in. */
export function boatBlanks(s: BoatState): number[] {
  const word = boatWord(s),
    n = word.tiles.length,
    all = word.tiles.map((_, i) => i);
  const previous = boatPrevious(s);
  if (previous) {
    const before = wordEntry(previous)!.tiles;
    return all.filter((i) => before[i] !== word.tiles[i]);
  }
  if (s.index === 0) return [0];
  if (s.index === 1) return n > 2 ? [0, n - 1] : all;
  return all;
}
export const boatComplete = (s: BoatState) => s.index < WORDS_PER_ROUND && s.filled === boatBlanks(s).length;
/** What each box shows now ("" while empty). */
export function boatBoxes(s: BoatState): string[] {
  const word = boatWord(s),
    blanks = boatBlanks(s);
  return word.tiles.map((t, i) => (blanks.indexOf(i) < 0 || blanks.indexOf(i) < s.filled ? t : ""));
}
/** The box that glows now, or -1 when the word is built. */
export const boatCurrent = (s: BoatState) => boatBlanks(s)[s.filled] ?? -1;
export const boatExpected = (s: BoatState) => boatWord(s).tiles[boatCurrent(s)];

// Tiles that sound alike are never offered against each other, so a wrong tile is really wrong.
const twins = [
  ["c", "k", "ck"],
  ["ee", "ea"],
  ["ai", "a_e"],
  ["oa", "o_e"],
  ["s", "ss", "z"],
  ["l", "ll"],
  ["oo", "u"],
];
const families = [
  ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "z"],
  ["a", "e", "i", "o", "u"],
  ["sh", "ch", "th", "ck", "ng", "ll"],
  ["a_e", "i_e", "o_e"],
  ["ee", "ea", "ai", "oa", "oo", "ar", "or"],
];
const hashWord = (word: string, salt: number) =>
  [...word].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 2166136261 ^ salt);
/** The letter tiles on offer: the right ones plus a few look-alikes, in a fixed order for this word. */
export function boatChoices(s: BoatState): string[] {
  const word = boatWord(s),
    blanks = boatBlanks(s),
    needed = [...new Set(blanks.map((i) => word.tiles[i]))];
  const previous = boatPrevious(s);
  const size = s.index === 0 ? 3 : s.index === 1 ? 4 : previous ? 4 : Math.min(7, needed.length + 3);
  const rng = random(hashWord(word.word, s.index));
  const twinsOf = (t: string) => twins.find((g) => g.includes(t)) ?? [t];
  const chosen = [...needed];
  const fits = (t: string) => !chosen.some((c) => twinsOf(c).includes(t) || tileLabel(c) === tileLabel(t));
  // In a ladder, the letter that is leaving is the tempting choice to leave out.
  const leaving = previous ? wordEntry(previous)!.tiles.filter((t, i) => t !== word.tiles[i]) : [];
  for (const t of leaving) if (fits(t)) chosen.push(t);
  for (const t of needed) {
    const pool = (families.find((f) => f.includes(t)) ?? families[0]).slice();
    for (let k = pool.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [pool[k], pool[j]] = [pool[j], pool[k]];
    }
    let added = 0;
    for (const c of pool)
      if (added < 3 && fits(c)) {
        chosen.push(c);
        added++;
      }
  }
  const extra = chosen.slice(needed.length);
  const tiles = [...needed, ...extra.slice(0, Math.max(0, size - needed.length))];
  for (let k = tiles.length - 1; k > 0; k--) {
    const j = Math.floor(rng() * (k + 1));
    [tiles[k], tiles[j]] = [tiles[j], tiles[k]];
  }
  return tiles;
}
/** How a tile is written on screen: a silent-e vowel shows just its vowel (the e already sits at the end). */
export const tileLabel = (tile: string) => tile.replace(/_e$/, "");
export const silentE = (s: BoatState) => boatWord(s).tiles.some((t) => /_e$/.test(t));

export type BoatAction = { type: "tile"; tile: string } | { type: "help" } | { type: "next" };
export function boatMove(s: BoatState, a: BoatAction): BoatState {
  if (s.index >= WORDS_PER_ROUND) return s;
  const complete = boatComplete(s);
  if (a.type === "next")
    return complete
      ? {
          ...s,
          index: s.index + 1,
          filled: 0,
          out: [],
          hint: false,
          assisted: false,
          clean: [...s.clean, !s.assisted],
        }
      : s;
  if (complete) return s;
  if (a.type === "help") return s.hint ? s : { ...s, hint: true, assisted: true };
  if (!boatChoices(s).includes(a.tile) || s.out.includes(a.tile)) return s;
  if (a.tile === boatExpected(s)) return { ...s, filled: s.filled + 1, out: [], hint: false };
  return { ...s, out: [...s.out, a.tile], assisted: true };
}
export const boatTurn = (s: BoatState | LegacyBoatState, o: LearnOptions): 0 | 1 =>
  isLegacyBoat(s)
    ? (((s.starter + s.index + (o.mode === "together" && s.stage !== "count" ? 1 : 0)) % 2) as 0 | 1)
    : (((s.starter + Math.min(s.index, WORDS_PER_ROUND - 1)) % 2) as 0 | 1);

const picturePool = (pace: Pace) =>
  PICTURE_WORDS[pace].map((w) => wordEntry(w)!).filter((w) => w.tiles.length >= 2 && w.tiles.length <= 5);
/** The first picture word is one pace gentler, so every round opens with an easy win. */
const startPace = (pace: Pace): Pace => (pace === "hard" ? "medium" : "easy");
function validPictures(v: unknown, pace: Pace): v is string[] {
  if (!Array.isArray(v) || v.length !== PICTURES || new Set(v).size !== PICTURES) return false;
  return v.every(
    (w, i) =>
      typeof w === "string" && (i === 0 ? picturePool(startPace(pace)) : picturePool(pace)).some((e) => e.word === w)
  );
}
function validLadders(v: unknown, pace: Pace): v is string[] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    new Set(v).size === 2 &&
    v.every((id) => LADDERS.some((l) => l.id === id && l.pace === pace))
  );
}
function createBoat(
  o: LearnOptions,
  c: { skills: SkillProgress; rng: () => number; starter: 0 | 1; today: number; previous?: unknown }
): BoatState {
  const previous = (c.previous ?? {}) as Partial<BoatState>;
  const first = pickItems(picturePool(startPace(o.pace)), c.skills, 1, c.rng, c.today)[0].word;
  const rest = pickItems(
    picturePool(o.pace).filter((w) => w.word !== first),
    c.skills,
    PICTURES - 1,
    c.rng,
    c.today
  ).sort((a, b) => a.tiles.length - b.tiles.length).map((w) => w.word);
  const available = LADDERS.filter((l) => l.pace === o.pace);
  const preferred = available.filter((l) => !(Array.isArray(previous.ladders) && previous.ladders.includes(l.id)));
  const ladders = pickItems(preferred.length >= 2 ? preferred : available, c.skills, 2, c.rng, c.today).map(
    (l) => l.id
  );
  return {
    pictures: [first, ...rest],
    ladders,
    starter: c.starter,
    index: 0,
    filled: 0,
    out: [],
    hint: false,
    assisted: false,
    clean: [],
  };
}

// ---- Rounds saved by app 1.4.0 (count the sounds, then load letters). They still load: a finished one shows
// its finish, and an unfinished one is swapped for a fresh round of the new game by the Board.
export type LegacyBoatState = {
  warmups: string[];
  ladders: string[];
  starter: 0 | 1;
  index: number;
  clean: boolean[];
  count: number;
  loaded: number;
  stage: "count" | "letters" | "sail" | "done";
  assisted: boolean;
  feedback: "none" | "count" | "letter" | "hint";
};
export const isLegacyBoat = (s: unknown): s is LegacyBoatState => !!s && typeof s === "object" && "warmups" in s;
const legacyWords = (s: LegacyBoatState) => [...s.warmups, ...s.ladders.flatMap((id) => [...ladderWords(id)])];
const legacyWord = (s: LegacyBoatState) => wordEntry(legacyWords(s)[Math.min(s.index, 9)])!;
function legacyMissing(s: LegacyBoatState) {
  const words = legacyWords(s),
    now = legacyWord(s);
  const previous = s.index > 2 && s.index !== 6 ? wordEntry(words[s.index - 1]) : undefined;
  return now.tiles.map((tile, i) => (previous?.tiles[i] === tile ? -1 : i)).filter((i) => i >= 0);
}
function validLegacy(v: unknown, o: LearnOptions): v is LegacyBoatState {
  if (
    !exact(v, ["warmups", "ladders", "starter", "index", "clean", "count", "loaded", "stage", "assisted", "feedback"])
  )
    return false;
  if (
    !Array.isArray(v.warmups) ||
    v.warmups.length !== 2 ||
    new Set(v.warmups).size !== 2 ||
    !v.warmups.every(
      (w) =>
        typeof w === "string" &&
        LEGACY_WARMUP_WORDS.has(w) &&
        wordsAt(o.pace).some(
          (e) => e.word === w && e.tiles.length >= 3 && e.tiles.length <= 5 && e.tiles.length === phonemes(w).length
        )
    )
  )
    return false;
  if (!validLadders(v.ladders, o.pace)) return false;
  if (
    !seat(v.starter) ||
    !integer(v.index, 10) ||
    !bools(v.clean, v.index) ||
    !integer(v.count, 6) ||
    !integer(v.loaded, 5) ||
    typeof v.assisted !== "boolean" ||
    !["count", "letters", "sail", "done"].includes(v.stage as string) ||
    !["none", "count", "letter", "hint"].includes(v.feedback as string)
  )
    return false;
  const s = v as LegacyBoatState;
  if (s.index === 10)
    return s.stage === "done" && s.count === 0 && s.loaded === 0 && !s.assisted && s.feedback === "none";
  if (s.stage === "done" || (s.feedback !== "none" && !s.assisted)) return false;
  if (s.stage === "count")
    return (
      s.loaded === 0 && s.feedback !== "letter" && (s.feedback !== "count" || s.count !== legacyWord(s).tiles.length)
    );
  const missing = legacyMissing(s).length;
  return (
    s.count === legacyWord(s).tiles.length &&
    s.feedback !== "count" &&
    (s.stage === "sail" ? s.loaded === missing && s.feedback !== "letter" : s.loaded < missing)
  );
}
/** A fresh new-style round for an unfinished 1.4.0 round (same seat order; seeded from the old round). */
export function boatFromLegacy(s: LegacyBoatState, o: LearnOptions, skills: SkillProgress, today: number): BoatState {
  const seed = hashWord(s.warmups.join(" ") + s.ladders.join(" "), s.index);
  return createBoat(o, { skills, rng: random(seed), starter: s.starter, today });
}

export const engine: LearnEngine<BoatState | LegacyBoatState> = {
  id: "sound-boat",
  name: "Sound Boat",
  island: "reading",
  tagline: "Spell a word, sail to the island.",
  description:
    "Hear a word and see its picture, then tap letters into the boat to spell it. Later, change one letter to make a new word.",
  help: "Listen to the word and look at the picture. Tap a letter to fill the glowing box, left to right. A wrong letter wiggles and waits on the side; try another. Each finished word sails the boat closer to the island. Wide boxes hold two letters that make one sound, like sh in ship. In words like cake, the e at the end is already there: it is silent and helps the a say its name. In the second half, change one letter to make the new word, like cat to cot. The help button lights the right letter. Together, take turns word by word. Take turns with a score: a word built without help or a wrong letter earns a point. There is no clock.",
  helpAudio: "sound-boat-help",
  introAudio: "sound-boat-intro",
  color: "#386C9A",
  surface: "#E3EEF8",
  modes: ["solo", "together", "versus"],
  skills: readingSkills,
  paceHelp: {
    easy: "Short vowel words: cat, hen, pig, dog, sun.",
    medium: "Two letters, one sound, and blends: fish, duck, crab, kite.",
    hard: "Vowel teams: sheep, boat, moon, star.",
  },
  create: (o, c) => createBoat(o, c),
  validate(v, o): v is BoatState | LegacyBoatState {
    if (isLegacyBoat(v)) return validLegacy(v, o);
    if (!exact(v, ["pictures", "ladders", "starter", "index", "filled", "out", "hint", "assisted", "clean"]))
      return false;
    if (!validPictures(v.pictures, o.pace) || !validLadders(v.ladders, o.pace)) return false;
    if (
      !seat(v.starter) ||
      !integer(v.index, WORDS_PER_ROUND) ||
      !bools(v.clean, v.index) ||
      typeof v.hint !== "boolean" ||
      typeof v.assisted !== "boolean" ||
      !Array.isArray(v.out) ||
      v.out.length > 7 ||
      !v.out.every((t) => typeof t === "string") ||
      new Set(v.out).size !== v.out.length ||
      !integer(v.filled, 5)
    )
      return false;
    const s = v as BoatState;
    if (s.index === WORDS_PER_ROUND) return s.filled === 0 && s.out.length === 0 && !s.hint && !s.assisted;
    if (s.filled > boatBlanks(s).length || ((s.hint || s.out.length > 0) && !s.assisted)) return false;
    if (boatComplete(s)) return s.out.length === 0 && !s.hint;
    const choices = boatChoices(s),
      expected = boatExpected(s);
    return s.out.every((t) => choices.includes(t) && t !== expected);
  },
  outcome(s, o) {
    const finished = isLegacyBoat(s) ? s.stage === "done" : s.index === WORDS_PER_ROUND;
    return !finished ? null : o.mode === "versus" ? familyResult(s.clean, s.starter) : "done";
  },
  turn: boatTurn,
};
