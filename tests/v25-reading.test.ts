import { describe, expect, it } from "vitest";
import { bank as letters } from "../src/learn/games/letter-lagoon/engine";
import { bank as stories } from "../src/learn/games/story-studio/engine";
import { bank as words } from "../src/learn/games/word-workshop/engine";
import { engine, whichHelp, whichNext, whichPick } from "../src/learn/games/which-one/engine";
import { optionsAtLevel } from "../src/learn/levels";
import { move, type State } from "../src/learn/games/letter-lagoon/puzzle";
import { readingSpeech } from "../src/learn/kit/readingSpeech";
import speech from "../scripts/learn/reading-v25.json";
import { existsSync } from "node:fs";
import { STORIES } from "../src/learn/content/reading/stories";

describe("2.5 reading repairs", () => {
  it("resizes the shell while retaining the same crab", () => {
    const pages = STORIES.flatMap(s => s.pages).filter(p => p.text.startsWith("This shell is big") || p.text.startsWith("This shell is little"));
    expect(pages).toHaveLength(2);
    expect(pages.map(p => p.scene.subjectSize)).toEqual([61, 61]);
    expect(pages[0].scene.objectSize).toBeGreaterThan(pages[1].scene.objectSize!);
  });
  it("offers valid, persisted reading help without a wrong answer or first-try point", () => {
    const o = optionsAtLevel({ mode: "versus", pace: "easy" }, 1);
    const s = engine.create(o, {skills:{}, rng:()=>0.2, today:0, starter:0});
    const helped = whichHelp(s);
    expect(helped.wrong).toBeNull();
    expect(engine.validate(JSON.parse(JSON.stringify(helped)), o)).toBe(true);
    const solved = whichPick(helped, helped.orders[0].indexOf(0));
    expect(whichNext(solved).clean).toEqual([false]);
  });
  it("teaches four fox sounds across three letters", () => {
    const fox = letters[4].find(t=>t.prompt === "Build fox")!;
    expect(fox.answer).toEqual(["f", "o", "x"]);
    expect(fox.clue).toContain("f · o · k · s");
    expect(fox.clue).toContain("x writes two sounds");
  });
  it("first sounds never answers by copying the target picture", () => {
    for (const t of letters[2]) {
      expect(t.picture).not.toBe(t.answer[0]);
      expect(t.picture![0]).toBe(t.answer[0][0]);
      expect(t.extras.every(x=>x[0] !== t.answer[0][0])).toBe(true);
    }
  });
  it("every trace has its letter-name clip", () => {
    for (const t of letters[3]) expect(t.audio).toBe(`letter-${t.answer[0].toLowerCase()}`);
  });
  it("young story tasks and all selectable cards have narration", () => {
    for (const t of stories.slice(0,2).flat()) {
      expect(t.audio).toBeTruthy();
      for (const card of [...t.answer, ...t.extras]) expect(t.cardAudio?.[card]).toBeTruthy();
    }
  });
  it("specifies present tense for the ambiguous read repair", () => {
    const t = stories[4].find(t=>t.prompt.includes("She read books"))!;
    expect(t.prompt).toContain("present tense");
    expect(t.clue).toContain("present tense");
  });
  it("joins completed words, excluding root definitions and context answers", () => {
    for (const t of words.slice(0,4).flat()) {
      expect(t.completedWord).toBe(t.answer.slice(0,2).join(""));
      expect(t.completedAudio).toBeTruthy();
    }
    expect(words[4].every(t=>!t.completedWord)).toBe(true);
  });
  it("listening records help without placing a card or exposing the next answer", () => {
    const s: State = { version: 1, level: 1, starter: 0, ids: [0,1,2,3], index: 0,
      placed: [], helped: false, hint: false, miss: false, clean: [] };
    const next = move(s, { type: "listen" }, stories);
    expect(next).toEqual({ ...s, helped: true });
  });
  it("registers every narrated task, card and completed word or reuses a bundled recording", () => {
    const keys = [
      ...stories.slice(0,2).flat().flatMap(t=>[t.audio!, ...Object.values(t.cardAudio!)]),
      ...words.slice(0,4).flat().map(t=>t.completedAudio!),
    ];
    for (const key of keys) expect(key in speech || existsSync(new URL(`../assets/audio/${key}.m4a`, import.meta.url)), key).toBe(true);
    expect(readingSpeech("rainbow")).toBe("rainbow");
    expect(readingSpeech("sun")).toBe("sound-boat-word-sun");
    expect(readingSpeech(".")).not.toBe(readingSpeech("?"));
  });

});
