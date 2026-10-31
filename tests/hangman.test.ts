import { describe, expect, it } from "vitest";
import { customWord, guessLetter, wordHint, wordRules, wordStatus, wrongLetters } from "../src/games/words";
import { defaultOptions } from "../src/games/types";
import { applySessionAction } from "../src/state/sessionAction";
import { emptySave, parseSave, validSession } from "../src/state/validation";
import { emptyWordRecords, recordWordRound, validWordRecords } from "../src/state/wordRecords";
const round = (word = "RAIN") => customWord(defaultOptions, word)!;
const type = (s: ReturnType<typeof round>, letters: string) => [...letters].reduce(guessLetter, s);

describe("Hangman Challenge and preserved Practice", () => {
  it("loses at exactly six unique wrong letters and cannot become a win through answer reveal or later taps", () => {
    const five = type(round(), "BCDEF");
    expect(wordStatus(five)).toBe("playing");
    const lost = guessLetter(five, "G");
    expect(wordStatus(lost)).toBe("lost");
    expect(lost.guessed).toEqual(["B", "C", "D", "E", "F", "G"]);
    expect(type(lost, "RAIN")).toBe(lost);
    expect(wordHint(lost)).toBe(lost);
    expect(validSession(lost)).toBe(true);
    expect(validSession({ ...lost, guessed: [...lost.guessed, ..."RAIN"] })).toBe(false);
  });
  it("wins before the limit, reveals repeated occurrences, and ignores repeated/invalid/post-win input", () => {
    const start = round("MAMA");
    const m = guessLetter(start, "M");
    expect([...m.word].filter((l) => m.guessed.includes(l))).toEqual(["M", "M"]);
    expect(guessLetter(m, "M")).toBe(m);
    expect(guessLetter(m, "? ")).toBe(m);
    const won = type(m, "BCDEFA");
    expect(wordStatus(won)).toBe("won");
    expect(wrongLetters(won)).toHaveLength(5);
    expect(guessLetter(won, "G")).toBe(won);
    expect(validSession(won)).toBe(true);
  });
  it("permits one distinct-letter hint including all occurrences and records it as assistance", () => {
    const start = round("MAMA"),
      hinted = wordHint(start);
    expect(hinted.guessed).toEqual(["M"]);
    expect(hinted.hints).toBe(1);
    expect(wordHint(hinted)).toBe(hinted);
    const won = guessLetter(hinted, "A");
    expect(wordStatus(won)).toBe("won");
    expect(validSession({ ...won, hints: 2 })).toBe(false);
    expect(recordWordRound(hinted, won)).toMatchObject({ wins: 1, assistedWins: 1, losses: 0, bestWrong: null });
  });
  it("retains legacy unlimited rules, identity, completion and guesses after import", () => {
    const original = round(),
      { wordRules: _removed, ...oldOptions } = original.options;
    const legacy = { ...original, options: oldOptions, guessed: [..."BCDEFGHJKLMOPQSTUVWXYZ"], hints: 0 };
    const encoded = JSON.stringify({ ...emptySave(), sessions: { "word-rescue": legacy } });
    const loaded = parseSave(encoded).sessions["word-rescue"]!;
    expect(loaded).toEqual(legacy);
    if (loaded.game !== "word-rescue") throw Error("Wrong game");
    expect(wordRules(loaded)).toBe("practice");
    expect(wordStatus(loaded)).toBe("playing");
    expect(wordStatus(type(loaded, "RAIN"))).toBe("won");
    expect(recordWordRound(loaded, type(loaded, "RAIN"))).toBeUndefined();
  });
  it("composes a burst through the terminal boundary without charging duplicates or recording two results", () => {
    const initial = round();
    let save = { ...emptySave(), sessions: { "word-rescue": initial } };
    for (const letter of "BBCCDDEEFFGRAIN") {
      const previous = save.sessions["word-rescue"];
      save = applySessionAction(save, "word-rescue", initial.id, (s) =>
        s.game === "word-rescue" ? guessLetter(s, letter) : s
      ) as typeof save;
      const records = recordWordRound(previous, save.sessions["word-rescue"], save.wordRecords);
      if (records) save = { ...save, wordRecords: records };
    }
    expect(save.wordRecords).toMatchObject({ wins: 0, losses: 1, counted: [initial.id] });
    expect(wrongLetters(save.sessions["word-rescue"])).toHaveLength(6);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(recordWordRound(save.sessions["word-rescue"], save.sessions["word-rescue"], save.wordRecords)).toBe(
      save.wordRecords
    );
  });
  it("keeps unassisted bests separate and never earns a result on loading a completed round", () => {
    const start = round(),
      won = type(start, "BRAIN");
    const first = recordWordRound(start, won)!;
    expect(first).toMatchObject({ wins: 1, losses: 0, bestWrong: 1 });
    expect(recordWordRound(undefined, won, first)).toBe(first);
    expect(recordWordRound(start, won, first)).toBe(first);
    const another = round("STAR"),
      assisted = type(wordHint(another), "TAR");
    expect(recordWordRound(another, assisted, first)).toMatchObject({ wins: 2, assistedWins: 1, bestWrong: 1 });
    expect(validWordRecords(first)).toBe(true);
    expect(validWordRecords({ ...first, assistedWins: 2 })).toBe(false);
    expect(validWordRecords({ ...emptyWordRecords(), counted: ["same", "same"] })).toBe(false);
  });
});
