import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { random } from "../src/games/types";
import {
  checkDecodability,
  phonemes,
  tokens,
  wordAudio,
  wordBank,
  wordEntry,
  type ReadingScene,
} from "../src/learn/kit/reading";
import { insideStyle } from "../src/learn/kit/scene";
import { LEGACY_WARMUP_WORDS, PICTURE_WORDS, pictureFor } from "../src/learn/content/reading/clues";
import { LADDERS } from "../src/learn/content/reading/ladders";
import { SENTENCES } from "../src/learn/content/reading/sentences";
import { STORIES } from "../src/learn/content/reading/stories";
import {
  WORDS_PER_ROUND,
  boatBlanks,
  boatChoices,
  boatComplete,
  boatExpected,
  boatFromLegacy,
  boatMove,
  boatPrevious,
  boatWord,
  engine as boat,
  tileLabel,
  type BoatState,
  type LegacyBoatState,
} from "../src/learn/games/sound-boat/engine";
import { engine as which, whichAnswer, whichNext, whichPick } from "../src/learn/games/which-one/engine";
import {
  engine as tales,
  tale,
  taleDone,
  taleFromLegacy,
  taleHear,
  talePick,
  taleReader,
  taleTurnPage,
  type LegacyTaleState,
  type TaleState,
} from "../src/learn/games/turtle-tales/engine";
import type { LearnOptions, Pace } from "../src/learn/types";
const paces: Pace[] = ["easy", "medium", "hard"];
const ctx = (seed = 21) => ({ rng: random(seed), starter: 1 as const, skills: {}, today: 20000 });
const speech = JSON.parse(readFileSync(new URL("../scripts/learn/reading.json", import.meta.url), "utf8")) as Record<
  string,
  string
>;
const diff = (a: ReadingScene, b: ReadingScene) =>
  (["subject", "object", "relation", "color", "size"] as const).filter((k) => a[k] !== b[k]);
const objectSource = readFileSync(new URL("../src/learn/art/Objects.tsx", import.meta.url), "utf8");
const drawn = new Set(
  [...objectSource.slice(0, objectSource.indexOf("] as const")).matchAll(/"([a-z]+)",/g)].map((m) => m[1])
);

describe("curated reading content", () => {
  it("has at least 120 unique practice words, 20 four-word ladders, 60 sentences, and 12 six-page stories", () => {
    expect(wordBank.length).toBeGreaterThanOrEqual(120);
    expect(new Set(wordBank.map((w) => w.word)).size).toBe(wordBank.length);
    expect(LADDERS.length).toBeGreaterThanOrEqual(20);
    expect(SENTENCES.length).toBeGreaterThanOrEqual(60);
    expect(STORIES.length).toBe(12);
    for (const p of paces) {
      expect(STORIES.filter((t) => t.pace === p)).toHaveLength(4);
      expect(SENTENCES.filter((t) => t.pace === p)).toHaveLength(20);
    }
    for (const t of STORIES) {
      expect(t.pages.length).toBeGreaterThanOrEqual(4);
      expect(t.pages.length).toBeLessThanOrEqual(8);
    }
  });
  it("only pictures words whose drawing is the word itself, at the right pace", () => {
    for (const p of paces) {
      expect(PICTURE_WORDS[p].length, p).toBeGreaterThanOrEqual(8);
      for (const w of PICTURE_WORDS[p]) {
        const entry = wordEntry(w);
        expect(entry?.pace, w).toBe(p);
        expect(drawn.has(w), `${w} has a drawing`).toBe(true);
        expect(pictureFor(w)).toBe(w);
        expect(entry!.tiles.length).toBeGreaterThanOrEqual(2);
        expect(entry!.tiles.length).toBeLessThanOrEqual(5);
      }
    }
    // No stand-in pictures: a word without its own clear drawing gets no picture at all.
    for (const w of ["man", "fig", "pen", "cot", "ten", "mat", "rug", "mug", "ship", "jet", "toad", "coat", "rain"])
      expect(pictureFor(w), w).toBeUndefined();
  });
  it("rejects unknown words and patterns introduced at later paces", () => {
    expect(checkDecodability("The cat is on the mat.", "easy")).toEqual([]);
    expect(checkDecodability("The sheep is in the boat.", "easy")).toEqual(["sheep", "boat"]);
    expect(checkDecodability("The sheep is in the boat.", "hard")).toEqual([]);
    expect(checkDecodability("A unicorn teleports.", "hard")).toEqual(["unicorn", "teleports"]);
  });
  it("segments sounds rather than letters, and keeps silent e with the vowel", () => {
    expect(phonemes("ship")).toEqual(["sh", "i", "p"]);
    expect(phonemes("ring")).toEqual(["r", "i", "ng"]);
    expect(phonemes("clap")).toEqual(["k", "l", "a", "p"]);
    expect(phonemes("cake")).toEqual(["k", "long a", "k"]);
    expect(phonemes("sheep")).toEqual(["sh", "long e", "p"]);
    expect(phonemes("box")).toEqual(["b", "o", "k", "s"]);
    expect(phonemes("unknown")).toEqual([]);
    expect(wordBank.find((w) => w.word === "rose")?.tiles).toEqual(["r", "o_e", "s"]);
    expect(phonemes("rose")).toEqual(["r", "long o", "z"]);
  });
  for (const t of STORIES)
    it(`${t.id}: every title and page is decodable at ${t.pace}`, () => {
      for (const text of [t.title, ...t.pages.map((p) => p.text)])
        expect(checkDecodability(text, t.pace), text).toEqual([]);
      for (const p of t.pages) expect(tokens(p.text).length).toBeLessThanOrEqual(18);
    });
  it("checks every picture sentence and its near misses", () => {
    for (const item of SENTENCES) {
      expect(checkDecodability(item.text, item.pace), item.text).toEqual([]);
      for (const scene of item.scenes.slice(1)) expect(diff(item.scenes[0], scene)).toHaveLength(1);
    }
  });
  // Words that name each picture value. Anything not listed is named by its own word.
  const names: Record<string, string[]> = {
    dog: ["dog", "pup"],
    pond: ["pond", "pool"],
    sand: ["sand", "beach"],
    beside: ["beside"],
  };
  const named = (value: string) => names[value] ?? [value];
  // Pictures that a child could fairly call by the other name are never the only difference.
  const lookAlikes = [
    ["frog", "toad"],
    ["cup", "mug"],
    ["mat", "rug"],
    ["boat", "ship"],
    ["dish", "pot"],
  ];
  it("gives every story page a near-miss picture that one word on the page rules out", () => {
    for (const t of STORIES)
      t.pages.forEach((p, i) => {
        const where = `${t.id} page ${i}: ${p.text}`;
        const words = tokens(p.text);
        const changed = diff(p.scene, p.miss);
        expect(changed, where).toHaveLength(1);
        const [field] = changed;
        expect(words, where).toContain(p.cue);
        expect(named(p.scene[field]), where).toContain(p.cue);
        for (const w of named(p.miss[field])) expect(words, `${where} must not name ${w}`).not.toContain(w);
        if (field === "color") expect([p.scene.color, p.miss.color].sort(), where).toEqual(["blue", "red"]);
        if (field === "size")
          expect(
            words.some((w) => w === "big" || w === "little"),
            where
          ).toBe(true);
        for (const pair of lookAlikes)
          expect(pair.includes(p.scene[field]) && pair.includes(p.miss[field]), `${where} look-alikes`).toBe(false);
        for (const sc of [p.scene, p.miss])
          if (sc.relation === "in") expect(insideStyle[sc.object], `${where}: in ${sc.object}`).toBeTruthy();
      });
  });
  it("every ladder changes exactly one letter tile and one sound per rung", () => {
    for (const ladder of LADDERS)
      for (let i = 0; i < ladder.words.length; i++) {
        const w = ladder.words[i];
        expect(checkDecodability(w, ladder.pace)).toEqual([]);
        if (i) {
          const a = phonemes(ladder.words[i - 1]),
            b = phonemes(w);
          expect(a.length, ladder.id).toBe(b.length);
          expect(
            a.filter((s, j) => s !== b[j]),
            `${ladder.words[i - 1]} → ${w}`
          ).toHaveLength(1);
          const ta = wordEntry(ladder.words[i - 1])!.tiles,
            tb = wordEntry(w)!.tiles;
          expect(
            tb.filter((t, j) => t !== ta[j]),
            `${ladder.words[i - 1]} → ${w}`
          ).toHaveLength(1);
        }
      }
  });
  it("bundles every word, sentence, page, intro and help line with no missing audio", () => {
    const keys = [
      "sound-boat-help",
      "sound-boat-intro",
      "sound-boat-ladder",
      "turtle-tales-help",
      "turtle-tales-intro",
      "turtle-tales-look",
      "which-one-help",
      "which-one-intro",
      "which-one-look",
    ];
    for (const w of wordBank) keys.push(wordAudio(w.word));
    for (const i of SENTENCES) {
      keys.push(`which-one-sentence-${i.id}`);
      for (const w of tokens(i.text)) keys.push(wordAudio(w));
    }
    for (const t of STORIES)
      t.pages.forEach((p, i) => {
        keys.push(`turtle-tales-${t.id}-page-${i}`);
        expect(speech[`turtle-tales-${t.id}-page-${i}`]).toBe(p.text);
        for (const w of tokens(p.text)) keys.push(wordAudio(w));
      });
    for (const key of keys) {
      expect(speech[key], key).toBeTruthy();
      expect(existsSync(new URL(`../assets/audio/${key}.m4a`, import.meta.url)), key).toBe(true);
    }
    const map = readFileSync(new URL("../src/content/learnAudio/reading.ts", import.meta.url), "utf8");
    for (const key of Object.keys(speech)) {
      expect(statSync(new URL(`../assets/audio/${key}.m4a`, import.meta.url)).size, key).toBeGreaterThan(1000);
      expect(map).toContain(`'${key}': require(`);
    }
    for (const e of [boat, tales, which])
      expect(speech[e.introAudio!].split(/\s+/).length, e.id).toBeLessThanOrEqual(10);
  });
});

/** Builds the current word with the right tiles. */
function buildWord(s: BoatState): BoatState {
  while (!boatComplete(s)) s = boatMove(s, { type: "tile", tile: boatExpected(s) });
  return s;
}

describe("Sound Boat: picture words, then one-letter ladders, to the island", () => {
  for (const mode of boat.modes)
    for (const pace of paces)
      it(`${mode}/${pace}: builds ten words, survives reload at every step, and returns the outcome`, () => {
        const o = { mode, pace };
        let s = boat.create(o, ctx()) as BoatState;
        for (let i = 0; i < WORDS_PER_ROUND; i++) {
          expect(boat.validate(s, o)).toBe(true);
          expect(boat.turn!(s, o)).toBe((1 + i) % 2);
          const blanks = boatBlanks(s);
          if (i === 0) expect(blanks).toHaveLength(1);
          if (i === 1) expect(blanks.length).toBeLessThanOrEqual(2);
          if (i >= 4) {
            expect(blanks, boatWord(s).word).toHaveLength(1);
            expect(boatPrevious(s)).toBeTruthy();
          } else expect(pictureFor(boatWord(s).word), boatWord(s).word).toBe(boatWord(s).word);
          while (!boatComplete(s)) {
            const choices = boatChoices(s);
            expect(choices).toContain(boatExpected(s));
            expect(new Set(choices.map(tileLabel)).size, choices.join()).toBe(choices.length);
            s = boatMove(s, { type: "tile", tile: boatExpected(s) });
            expect(boat.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
          }
          expect(boatMove(s, { type: "tile", tile: boatChoices(s)[0] })).toBe(s);
          s = boatMove(s, { type: "next" });
        }
        expect(boat.validate(s, o)).toBe(true);
        expect(s.clean).toEqual(Array(WORDS_PER_ROUND).fill(true));
        expect(boat.outcome(s, o)).toBe(mode === "versus" ? "draw" : "done");
        expect(boatMove(s, { type: "next" })).toBe(s);
      });
  it("opens each pace with an easy picture word with one letter to find", () => {
    for (const pace of paces)
      for (let seed = 1; seed < 30; seed++) {
        const s = boat.create({ mode: "solo", pace }, ctx(seed)) as BoatState;
        expect(PICTURE_WORDS[pace === "hard" ? "medium" : "easy"]).toContain(s.pictures[0]);
        expect(boatChoices(s)).toHaveLength(3);
        expect(new Set(s.pictures).size).toBe(4);
      }
  });
  it("never offers two tiles that sound alike or look the same", () => {
    const twins = [
      ["c", "k", "ck"],
      ["ee", "ea"],
      ["ai", "a_e"],
      ["oa", "o_e"],
      ["s", "ss", "z"],
      ["l", "ll"],
    ];
    for (const pace of paces)
      for (let seed = 1; seed < 20; seed++) {
        let s = boat.create({ mode: "solo", pace }, ctx(seed)) as BoatState;
        while (s.index < WORDS_PER_ROUND) {
          const choices = boatChoices(s);
          const needed = boatBlanks(s).map((i) => boatWord(s).tiles[i]);
          // A word like cake needs both c and k; otherwise sound-alikes never appear together.
          for (const g of twins)
            expect(
              choices.filter((c) => g.includes(c) && !needed.includes(c)).length +
                (needed.some((c) => g.includes(c)) ? 1 : 0),
              choices.join()
            ).toBeLessThanOrEqual(Math.max(1, needed.filter((c) => g.includes(c)).length));
          s = boatMove(buildWord(s), { type: "next" });
        }
      }
  });
  it("a wrong tile waits on the side; help lights the right one; either marks the word as helped", () => {
    const o: LearnOptions = { mode: "versus", pace: "easy" };
    let s = boat.create(o, ctx()) as BoatState;
    const wrong = boatChoices(s).find((t) => t !== boatExpected(s))!;
    s = boatMove(s, { type: "tile", tile: wrong });
    expect(s).toMatchObject({ filled: 0, out: [wrong], assisted: true });
    expect(boat.validate(s, o)).toBe(true);
    expect(boatMove(s, { type: "tile", tile: wrong })).toBe(s);
    s = boatMove(s, { type: "help" });
    expect(s.hint).toBe(true);
    expect(boat.validate(s, o)).toBe(true);
    s = boatMove(s, { type: "tile", tile: boatExpected(s) });
    expect(s).toMatchObject({ out: [], hint: false, assisted: true });
    s = boatMove(buildWord(s), { type: "next" });
    expect(s.clean).toEqual([false]);
    expect(boat.validate(s, o)).toBe(true);
    expect(boatMove(s, { type: "tile", tile: "not-offered" })).toBe(s);
  });
  it("rejects forged, oversized, contradictory, extra-field and wrong-pace saves", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    const s = boat.create(o, ctx()) as BoatState;
    const right = boatExpected(s);
    const corrupt: unknown[] = [
      { ...s, extra: true },
      { ...s, index: 1 },
      { ...s, filled: 999 },
      { ...s, filled: 2 },
      { ...s, out: [right], assisted: true },
      { ...s, out: ["q", "q"], assisted: true },
      { ...s, out: ["zz"], assisted: true },
      { ...s, hint: true },
      { ...s, pictures: ["sheep", "boat", "moon", "star"] },
      { ...s, pictures: ["cat", "cat", "dog", "sun"] },
      { ...s, ladders: ["easy-0", "easy-0"] },
      { ...s, clean: Array(100).fill(true) },
      { ...s, starter: 2 },
      { ...s, filled: NaN },
      { ...s, index: WORDS_PER_ROUND, clean: Array(WORDS_PER_ROUND).fill(true), filled: 1 },
    ];
    for (const bad of corrupt) expect(boat.validate(bad, o)).toBe(false);
  });
  it("keeps rounds saved by the older Sound Boat loading, and turns unfinished ones into a fresh round", () => {
    const o: LearnOptions = { mode: "versus", pace: "easy" };
    const old: LegacyBoatState = {
      warmups: ["man", "fig"],
      ladders: ["easy-0", "easy-1"],
      starter: 1,
      index: 1,
      clean: [true],
      count: 2,
      loaded: 0,
      stage: "count",
      assisted: false,
      feedback: "none",
    };
    expect([...LEGACY_WARMUP_WORDS]).toContain("man");
    expect(boat.validate(old, o)).toBe(true);
    expect(boat.outcome(old, o)).toBeNull();
    expect(boat.turn!(old, o)).toBe(0);
    const fresh = boatFromLegacy(old, o, {}, 20000);
    expect(boat.validate(fresh, o)).toBe(true);
    expect(fresh.starter).toBe(1);
    expect(boatFromLegacy(old, o, {}, 20000)).toEqual(fresh);
    const finished = { ...old, index: 10, clean: Array(10).fill(true), count: 0, stage: "done" as const };
    expect(boat.validate(finished, o)).toBe(true);
    expect(boat.outcome(finished, o)).toBe("draw");
    expect(boat.validate({ ...old, stage: "letters" }, o)).toBe(false);
    expect(boat.validate({ ...old, warmups: ["man", "zzz"] }, o)).toBe(false);
  });
});

describe("Which One: careful first tries and untimed family turns", () => {
  for (const mode of which.modes)
    for (const pace of paces)
      it(`${mode}/${pace}: completes and survives reload`, () => {
        const o = { mode, pace };
        let s = which.create(o, ctx());
        for (let i = 0; i < 8; i++) {
          expect(which.turn!(s, o)).toBe((1 + i) % 2);
          if (i === 0) {
            s = whichPick(s, (whichAnswer(s) + 1) % 3);
            expect(s.tried).toBe(true);
            expect(which.validate(s, o)).toBe(true);
          }
          s = whichPick(s, whichAnswer(s));
          expect(which.validate(s, o)).toBe(true);
          expect(whichPick(s, 0)).toBe(s);
          s = whichNext(s);
          expect(which.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
        }
        expect(which.outcome(s, o)).toBe(mode === "versus" ? 0 : "done");
        expect(s.clean).toEqual([false, true, true, true, true, true, true, true]);
      });
  it("rejects inconsistent answers, non-permutations and out-of-range values", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    const s = which.create(o, ctx());
    for (const bad of [
      { ...s, solved: true, wrong: 0 },
      { ...s, tried: true, wrong: whichAnswer(s) },
      { ...s, orders: Array(8).fill([0, 0, 2]) },
      { ...s, index: 8 },
      { ...s, ids: Array(8).fill(s.ids[0]) },
      { ...s, extra: 1 },
      { ...s, wrong: Infinity },
    ])
      expect(which.validate(bad, o)).toBe(false);
  });
});

describe("Turtle Tales: read each page, then pick the picture that matches it", () => {
  for (const mode of tales.modes)
    for (const pace of paces)
      it(`${mode}/${pace}: reads every page to the end and survives reload at every step`, () => {
        const o = { mode, pace };
        let s = tales.create(o, ctx()) as TaleState;
        const t = tale(s);
        for (let p = 0; p < t.pages.length; p++) {
          expect(tales.validate(s, o)).toBe(true);
          expect(tales.turn!(s, o)).toBe((s.starter + p) % 2);
          if (p === 1) {
            s = talePick(s, 1 - s.sides[p]);
            expect(s).toMatchObject({ wrong: true, solved: false });
            expect(talePick(s, 1 - s.sides[p])).toBe(s);
            s = taleHear(s);
            expect(taleHear(s)).toBe(s);
            expect(tales.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
          }
          expect(taleTurnPage(s)).toBe(s);
          s = talePick(s, s.sides[p]);
          expect(s.solved).toBe(true);
          expect(tales.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
          s = taleTurnPage(s);
        }
        expect(taleDone(s)).toBe(true);
        expect(tales.validate(s, o)).toBe(true);
        expect(s.clean).toEqual(t.pages.map((_, i) => i !== 1));
        expect(tales.outcome(s, o)).toBe("done");
        expect(talePick(s, 0)).toBe(s);
      });
  it("puts the matching picture on both sides across a round", () => {
    const s = tales.create({ mode: "solo", pace: "easy" }, ctx(5)) as TaleState;
    const many = Array.from(
      { length: 20 },
      (_, i) => tales.create({ mode: "solo", pace: "easy" }, ctx(i + 1)) as TaleState
    );
    expect(new Set(many.flatMap((m) => m.sides))).toEqual(new Set([0, 1]));
    expect(s.sides).toHaveLength(tale(s).pages.length);
  });
  it("rejects skipped pages, impossible flags, wrong lengths and extra fields", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    const s = tales.create(o, ctx()) as TaleState;
    for (const bad of [
      { ...s, page: 99 },
      { ...s, page: 2 },
      { ...s, sides: [0, 1] },
      { ...s, sides: s.sides.map(() => 2) },
      { ...s, page: 6, clean: Array(6).fill(true), solved: true },
      { ...s, clean: [true] },
      { ...s, extra: 1 },
      { ...s, starter: -1 },
      { ...s, id: "tale-4" },
    ])
      expect(tales.validate(bad, o)).toBe(false);
  });
  it("keeps rounds saved by the older Turtle Tales loading and carries them to the same page", () => {
    const o: LearnOptions = { mode: "together", pace: "easy" };
    const old: LegacyTaleState = {
      id: "tale-1",
      starter: 0,
      page: 2,
      word: 1,
      pointed: false,
      modelPages: [0],
      question: 0,
      orders: [
        [1, 0, 2],
        [2, 1, 0],
      ],
      wrong: null,
      solved: false,
      done: false,
    };
    expect(tales.validate(old, o)).toBe(true);
    expect(tales.outcome(old, o)).toBeNull();
    const now = taleFromLegacy(old);
    expect(tales.validate(now, o)).toBe(true);
    expect(now.page).toBe(2);
    const questions = { ...old, page: 6, word: 0, modelPages: [], question: 1 };
    expect(tales.validate(questions, o)).toBe(true);
    expect(tales.outcome(taleFromLegacy(questions), o)).toBe("done");
    const finished = { ...questions, question: 2, done: true };
    expect(tales.validate(finished, o)).toBe(true);
    expect(tales.outcome(finished, o)).toBe("done");
    expect(tales.validate({ ...old, word: 99 }, o)).toBe(false);
    expect(taleReader(now)).toBe(0);
  });
});

describe("rounds saved by app 1.4.0 keep the whole save loading", () => {
  // Real states recorded by playing the 1.4.0 engines (commit 585cf55): every stage, mode and pace.
  const fixtures = JSON.parse(
    readFileSync(new URL("./fixtures/reading-1.4.0-rounds.json", import.meta.url), "utf8")
  ) as { game: "sound-boat" | "turtle-tales" | "which-one"; options: LearnOptions; state: unknown }[];
  const engines = { "sound-boat": boat, "turtle-tales": tales, "which-one": which } as const;
  it("covers every reading game and the finished and unfinished stages", () => {
    for (const g of Object.keys(engines)) expect(fixtures.filter((f) => f.game === g).length, g).toBeGreaterThan(20);
    expect(fixtures.some((f) => f.game === "sound-boat" && (f.state as LegacyBoatState).stage === "letters")).toBe(
      true
    );
    expect(fixtures.some((f) => f.game === "turtle-tales" && (f.state as LegacyTaleState).question === 1)).toBe(true);
  });
  it("every 1.4.0 round passes validLearnSession and parseSave, and opens sensibly in the new game", async () => {
    const { startSession, validLearnSession } = await import("../src/learn/session");
    const { emptySave, parseSave } = await import("../src/state/validation");
    for (const f of fixtures) {
      const where = `${f.game} ${f.options.mode}/${f.options.pace} ${JSON.stringify(f.state).slice(0, 80)}`;
      const envelope = startSession(f.game, { options: f.options, names: ["Mia", "Dad"], starter: 0 }, {}, 3);
      const session = { ...envelope, revision: 4, state: f.state };
      expect(validLearnSession(session, f.game), where).toBe(true);
      const save = { ...emptySave(), learn: { [f.game]: session }, recentLearn: f.game };
      expect(parseSave(JSON.stringify(save)).learn?.[f.game]?.state, where).toEqual(f.state);
      const engine = engines[f.game] as unknown as {
        outcome: (s: unknown, o: LearnOptions) => unknown;
        validate: (s: unknown, o: LearnOptions) => boolean;
      };
      const outcome = engine.outcome(f.state, f.options);
      if (f.game === "sound-boat") {
        const old = f.state as LegacyBoatState;
        expect(outcome !== null, where).toBe(old.stage === "done");
        if (old.stage !== "done")
          expect(boat.validate(boatFromLegacy(old, f.options, {}, 20000), f.options), where).toBe(true);
      }
      if (f.game === "turtle-tales") {
        const old = f.state as LegacyTaleState;
        expect(outcome !== null, where).toBe(old.done);
        const now = taleFromLegacy(old);
        expect(tales.validate(now, f.options), where).toBe(true);
        expect(now.page, where).toBe(old.page);
      }
      if (f.game === "which-one") {
        // Which One kept its shape: an old round simply plays on to the end.
        let s = f.state as Parameters<typeof whichPick>[0];
        while (s.index < 8) s = whichNext(whichPick(s, whichAnswer(s)));
        expect(which.validate(s, f.options), where).toBe(true);
      }
    }
  });
});
