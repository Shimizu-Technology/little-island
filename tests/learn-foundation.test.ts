import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import { engines, skillLabels } from "../src/learn/engines";
import { replaySession, startSession, validLearnSession } from "../src/learn/session";
import { pickItems, practiceSummary, priority, recordPractice, validSkills } from "../src/learn/skills";
import { learnIds, type LearnOptions } from "../src/learn/types";
import { emptySave, parseSave } from "../src/state/validation";
import { applyLearnSave, applyPractice } from "../src/state/learnAction";

const DAY = 20_000;

describe("learning skill memory", () => {
  it("climbs on success (once per day) and drops on a miss", () => {
    let p = recordPractice(undefined, "read.short-a", true, DAY);
    expect(p["read.short-a"]).toMatchObject({ tries: 1, right: 1, box: 1 });
    p = recordPractice(p, "read.short-a", true, DAY);
    expect(p["read.short-a"].box).toBe(1);
    p = recordPractice(p, "read.short-a", true, DAY + 1);
    expect(p["read.short-a"].box).toBe(2);
    p = recordPractice(p, "read.short-a", false, DAY + 1);
    expect(p["read.short-a"]).toMatchObject({ tries: 4, right: 3, box: 0 });
  });
  it("ignores malformed skill ids", () => {
    expect(recordPractice({}, "bad id", true, DAY)).toEqual({});
  });
  it("prefers new and missed skills, and interleaves", () => {
    const progress = recordPractice(recordPractice(undefined, "num.easy", true, DAY), "num.easy", true, DAY + 1);
    expect(priority(undefined, DAY + 1)).toBeGreaterThan(priority(progress["num.easy"], DAY + 1));
    const items = [
      ...Array.from({ length: 4 }, (_, i) => ({ skill: "num.a", n: i })),
      ...Array.from({ length: 4 }, (_, i) => ({ skill: "num.b", n: i })),
    ];
    const chosen = pickItems(items, {}, 6, random(3), DAY);
    expect(chosen).toHaveLength(6);
    for (let i = 1; i < chosen.length; i++) expect(chosen[i].skill).not.toBe(chosen[i - 1].skill);
  });
  it("validates stored progress strictly", () => {
    expect(validSkills(recordPractice(undefined, "sci.float", true, DAY))).toBe(true);
    expect(validSkills({ "sci.float": { tries: 1, right: 2, box: 1, day: DAY } })).toBe(false);
    expect(validSkills({ "x.y": { tries: 1, right: 1, box: 1, day: DAY } })).toBe(false);
    expect(validSkills({ "sci.float": { tries: 1, right: 1, box: 6, day: DAY } })).toBe(false);
  });
  it("summarises recent practice without numbers", () => {
    let p = recordPractice(undefined, "read.a", true, DAY);
    for (let d = 1; d < 4; d++) p = recordPractice(p, "read.a", true, DAY + d);
    p = recordPractice(p, "num.b", false, DAY + 3);
    const lines = practiceSummary(p, { "read.a": "Short a words", "num.b": "Counting on" }, DAY + 3);
    expect(lines.map((l) => [l.label, l.state])).toEqual([
      ["Short a words", "getting-easier"],
      ["Counting on", "practicing"],
    ]);
  });
});

describe("learning game contract (every engine)", () => {
  const paces = ["easy", "medium", "hard"] as const;
  for (const id of learnIds) {
    const engine = engines[id];
    it(`${id}: creates valid, save-safe rounds in every mode, pace and language`, () => {
      expect(engine.id).toBe(id);
      expect(engine.modes.length).toBeGreaterThan(0);
      for (const skill of Object.keys(engine.skills)) expect(skill).toMatch(/^(read|num|sci|think|ch)\.[a-z0-9-]+$/);
      for (const mode of engine.modes)
        for (const pace of paces)
          for (const language of engine.languages ?? [undefined]) {
            const options: LearnOptions = { mode, pace, ...(language ? { language } : {}) };
            const s = startSession(id, { options, names: ["Mia", "Dad"], starter: 1 }, {}, 1234 + paces.indexOf(pace));
            expect(validLearnSession(s, id)).toBe(true);
            const roundTrip = JSON.parse(JSON.stringify(s));
            expect(validLearnSession(roundTrip, id)).toBe(true);
            expect(engine.outcome(roundTrip.state, options)).toBe(engine.outcome(s.state, options));
            const again = replaySession(s, {}, 99);
            expect(validLearnSession(again, id)).toBe(true);
            expect(again.id).not.toBe(s.id);
            if (mode === "versus") expect(again.match?.names).toEqual(["Mia", "Dad"]);
          }
      expect(engine.validate(null, { mode: engine.modes[0], pace: "easy" })).toBe(false);
      expect(engine.validate({}, { mode: engine.modes[0], pace: "easy" })).toBe(false);
    });
  }
  it("collects skill labels across games", () => {
    expect(typeof skillLabels()).toBe("object");
  });
});

describe("learning saves", () => {
  const id = learnIds[0];
  const options: LearnOptions = { mode: engines[id].modes[0], pace: "easy" };
  it("round-trips through parseSave and rejects bad sessions", () => {
    const session = startSession(id, { options }, {}, 7);
    const save = applyPractice({ ...emptySave(), learn: { [id]: session }, recentLearn: id }, "num.count-on", true);
    expect(parseSave(JSON.stringify(save)).learn?.[id]?.id).toBe(session.id);
    expect(() => parseSave(JSON.stringify({ ...save, learn: { [id]: { ...session, version: 2 } } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, learn: { "not-a-game": session } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, recentLearn: "nope" }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...save, learn: { [id]: { ...session, options: { ...options, extra: 1 } } } }))).toThrow();
  });
  it("rejects stale or replaced rounds", () => {
    const first = startSession(id, { options }, {}, 1);
    const saved = applyLearnSave(emptySave(), id, first, { id: null, epoch: 0 }, 0);
    expect(saved.learn?.[id]).toBe(first);
    expect(saved.recentLearn).toBe(id);
    const next = { ...first, revision: 1 };
    expect(applyLearnSave(saved, id, next, { id: "other", epoch: 0 }, 0)).toBe(saved);
    expect(applyLearnSave(saved, id, next, { id: first.id, revision: 5, epoch: 0 }, 0)).toBe(saved);
    expect(applyLearnSave(saved, id, next, { id: first.id, revision: 0, epoch: 1 }, 0)).toBe(saved);
    expect(applyLearnSave(saved, id, next, { id: first.id, revision: 0, epoch: 0 }, 0).learn?.[id]).toBe(next);
  });
});

describe("review regressions", () => {
  it("rejects a malformed Tide Pool save without throwing", async () => {
    const { engines: all } = await import("../src/learn/engines");
    const opts = { mode: "solo" as const, pace: "easy" as const };
    const s = startSession("tide-pool", { options: opts }, {}, 5).state as Record<string, unknown>;
    const broken = JSON.parse(JSON.stringify(s));
    const pool = Object.values(broken).find((v) => v && typeof v === "object" && "creatures" in (v as object)) as Record<string, unknown> | undefined;
    if (pool) {
      pool.creatures = null;
      pool.high = true;
      pool.light = true;
    }
    expect(() => all["tide-pool"].validate(broken, opts)).not.toThrow();
    expect(all["tide-pool"].validate(broken, opts)).toBe(false);
  });
  it("never asks 'who wants more' with equal amounts", async () => {
    const mod = await import("../src/learn/games/island-market/orders");
    const orders = Object.values(mod).find(Array.isArray) as { kind: string; a?: number; b?: number }[];
    for (const o of orders.filter((o) => o.kind === "compare")) expect(o.a).not.toBe(o.b);
  });
  it("treats vowel teams as one sound tile", async () => {
    const { wordBank } = await import("../src/learn/kit/reading");
    for (const w of wordBank)
      for (const team of ["ee", "ea", "ai", "oa", "oo"])
        if (w.word.includes(team)) expect(w.tiles.some((t) => t.includes(team)), w.word).toBe(true);
  });
});

describe("reading pictures make sense", () => {
  it("only puts things 'in' objects you can be inside", async () => {
    const { insideStyle } = await import("../src/learn/kit/scene");
    const { SENTENCES } = await import("../src/learn/content/reading/sentences");
    const { STORIES } = await import("../src/learn/content/reading/stories");
    const scenes = [
      ...SENTENCES.flatMap((s) => s.scenes),
      ...STORIES.flatMap((t) => [...t.pages.map((p) => p.scene), ...t.questions.flatMap((q) => q.scenes)]),
    ];
    for (const sc of scenes) if (sc.relation === "in") expect(insideStyle[sc.object], `${sc.subject} in ${sc.object}`).toBeTruthy();
  });
});

describe("first-move coaching memory", () => {
  it("saves which games showed the hand and rejects bad lists", () => {
    const save = { ...emptySave(), coached: ["sound-boat", "reef-race"] };
    expect(parseSave(JSON.stringify(save)).coached).toEqual(["sound-boat", "reef-race"]);
    expect(() => parseSave(JSON.stringify({ ...emptySave(), coached: ["nope"] }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...emptySave(), coached: ["reef-race", "reef-race"] }))).toThrow();
  });
});
