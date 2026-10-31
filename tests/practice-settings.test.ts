import { describe, expect, it } from "vitest";
import { defaultPracticeSettings, validPracticeNotes, validPracticeSettings, validPracticeSummary } from "../src/practice/types";
import { recordPracticeNote } from "../src/practice/notes";
import { emptySave, parseSave } from "../src/state/validation";
import { createGame } from "../src/games";
import { defaultOptions } from "../src/games/types";

describe("private practice settings and notes", () => {
  it("keeps old saves and original rounds intact, with practice off by default", () => {
    const before = { ...emptySave(), sessions: { memory: createGame("memory", defaultOptions) } };
    const restored = parseSave(JSON.stringify(before));
    expect(restored).toEqual(before);
    expect(restored.settings.practice ?? defaultPracticeSettings).toEqual(defaultPracticeSettings);
    expect(defaultPracticeSettings.enabled).toBe(false);
    for (const subject of ["math", "reading", "mixed"] as const) for (const limit of [10, 20] as const) for (const operation of ["add", "subtract", "mixed"] as const) {
      const practice = { enabled: true, subject, limit, operation };
      expect(validPracticeSettings(practice)).toBe(true);
      const next = parseSave(JSON.stringify({ ...before, settings: { ...before.settings, practice } }));
      expect(next.settings.practice).toEqual(practice);
      expect(next.sessions).toEqual(before.sessions);
    }
  });
  it("rejects unsupported settings and forged notes rather than replacing original data", () => {
    for (const practice of [{ ...defaultPracticeSettings, limit: 100 }, { ...defaultPracticeSettings, subject: "video" }, { ...defaultPracticeSettings, enabled: "yes" }, { ...defaultPracticeSettings, extra: true }]) {
      expect(validPracticeSettings(practice)).toBe(false);
      expect(() => parseSave(JSON.stringify({ ...emptySave(), settings: { sound: true, help: true, practice } }))).toThrow();
    }
    for (const notes of [{ "num.add-within-10": { independent: -1, helped: 2 } }, { "num.add-within-10": { independent: 2, helped: 100000 } }, { "not-a-skill": { independent: 2, helped: 1 } }]) {
      expect(validPracticeNotes(notes)).toBe(false);
      expect(() => parseSave(JSON.stringify({ ...emptySave(), practiceNotes: notes }))).toThrow();
    }
  });
  it("counts guided and independent completions separately, immutably and within bounds", () => {
    const first = recordPracticeNote(undefined, "num.add-within-10", false);
    const second = recordPracticeNote(first, "num.add-within-10", true);
    expect(first).toEqual({ "num.add-within-10": { independent: 1, helped: 0 } });
    expect(second).toEqual({ "num.add-within-10": { independent: 1, helped: 1 } });
    expect(parseSave(JSON.stringify({ ...emptySave(), practiceNotes: second })).practiceNotes).toEqual(second);
    expect(recordPracticeNote({ "num.add-within-10": { independent: 99999, helped: 99999 } }, "num.add-within-10", false)["num.add-within-10"].independent).toBe(99999);
  });
  it("requires three completed questions unless an adult explicitly bypassed", () => {
    const result = { skill: "read.short-a", helped: true };
    expect(validPracticeSummary({ results: [result, result], bypassed: false })).toBe(false);
    expect(validPracticeSummary({ results: [result, result, result], bypassed: false })).toBe(true);
    expect(validPracticeSummary({ results: [], bypassed: true })).toBe(true);
    expect(validPracticeSummary({ results: [result, result, result, result], bypassed: true })).toBe(false);
    expect(validPracticeSummary({ results: [{ skill: "bad", helped: false }], bypassed: true })).toBe(false);
  });
});
