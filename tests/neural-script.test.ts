import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { growthTracks } from "../src/learn/growth/content";
import { describe, expect, it } from "vitest";

function speech(lines: string[]) {
  return JSON.parse(execFileSync("python3", ["-c", `
import importlib.util,json,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('speech','scripts/generate-neural-audio.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
print(json.dumps([m.spoken(x) for x in json.load(sys.stdin)]))
`], { input: JSON.stringify(lines), encoding: "utf8", timeout: 30000 })) as string[];
}

describe("equations spoken without losing their meaning", () => {
  it("keeps every growth prompt and explanation aligned with its playable question", () => {
    const lines = JSON.parse(readFileSync(new URL("../scripts/learn/growth.json", import.meta.url), "utf8")) as Record<string, string>;
    let count = 0;
    for (const [game, stages] of Object.entries(growthTracks)) for (const [stage, track] of Object.entries(stages)) for (const q of track.questions) {
      const key = `growth-${game}-${stage}-${q.id}`;
      expect(lines[`${key}-prompt`], key).toBe([q.context, q.prompt].filter(Boolean).join(" "));
      expect(lines[`${key}-explanation`], key).toBe(q.explanation);
      count++;
    }
    expect(count).toBe(328);
  });
  it("reads every unknown position and both subtraction symbols", () => {
    expect(speech([
      "What number fills the blank? ? + 7 = 23",
      "What number fills the blank? 92 - ? = 68",
      "Both sides must have the same value. 8 + 7 = 10 + ?",
      "Check: 35 − 8 = 27.",
      "3 × 5 = 15.",
    ])).toEqual([
      "What number fills the blank? blank plus 7 equals 23",
      "What number fills the blank? 92 minus blank equals 68",
      "Both sides must have the same value. 8 plus 7 equals 10 plus blank",
      "Check: 35 minus 8 equals 27.",
      "3 times 5 equals 15.",
    ]);
  });
  it("keeps ordinary questions and hyphenated words intact", () => {
    expect(speech(["Will it float or sink?", "Move two ten-shell coins.", "Repeat → ↑ twice."])).toEqual([
      "Will it float or sink?", "Move two ten-shell coins.", "Repeat  right   up  twice.",
    ]);
  });
});
