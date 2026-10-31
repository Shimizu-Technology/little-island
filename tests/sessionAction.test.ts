import { describe, expect, it } from "vitest";
import { applySessionAction } from "../src/state/sessionAction";
import { emptySave } from "../src/state/validation";
import { customWord, guessLetter, wordDone, wordHint } from "../src/games/words";
import { defaultOptions } from "../src/games/types";

describe("rapid player intents", () => {
  it("keeps all RAIN taps captured before a render, including I and completion", () => {
    const round = customWord(defaultOptions, "RAIN")!;
    let save = { ...emptySave(), sessions: { "word-rescue": round } };
    const actions = ["R", "A", "I", "N"].map((letter) => () => {
      save = applySessionAction(save, "word-rescue", round.id, (current) =>
        current.game === "word-rescue" ? guessLetter(current, letter) : current
      ) as typeof save;
    });
    actions.forEach((action) => action());
    expect(save.sessions["word-rescue"].guessed).toEqual(["R", "A", "I", "N"]);
    expect(wordDone(save.sessions["word-rescue"])).toBe(true);
    expect([...round.word].map((l) => (save.sessions["word-rescue"].guessed.includes(l) ? l : null))).toEqual([
      "R",
      "A",
      "I",
      "N",
    ]);
  });
  it("composes reveal and repeated-letter guesses without skipping or double-counting", () => {
    const round = customWord({ ...defaultOptions, wordRules: "practice" }, "MAMA")!;
    let save = { ...emptySave(), sessions: { "word-rescue": round } };
    const reveal = () => {
      save = applySessionAction(save, "word-rescue", round.id, (current) =>
        current.game === "word-rescue" ? wordHint(current) : current
      ) as typeof save;
    };
    reveal();
    reveal();
    reveal();
    expect(save.sessions["word-rescue"].guessed).toEqual(["M", "A"]);
    expect(save.sessions["word-rescue"].hints).toBe(2);
  });
  it("rejects a queued tap after a new round or restored round replaces its source", () => {
    const old = customWord(defaultOptions, "RAIN")!;
    const next = { ...customWord(defaultOptions, "STAR")!, id: "new-round" };
    const save = { ...emptySave(), sessions: { "word-rescue": next } };
    expect(
      applySessionAction(save, "word-rescue", old.id, (current) =>
        current.game === "word-rescue" ? guessLetter(current, "R") : current
      )
    ).toBe(save);
    expect(applySessionAction(emptySave(), "word-rescue", old.id, (current) => current)).toEqual(emptySave());
  });
});
