import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createNumbers, closeNumbers, rollNumbers, numbersStatus, numberChoices, needsPracticeRoll } from "../src/games/numbers";
import { defaultOptions } from "../src/games/types";
import { validSession, parseSave, emptySave } from "../src/state/validation";
import { createMysterySession, playSoloIntent, chooseMysteryBot, mysteryView, validMysterySession } from "../src/mystery/engine";
import { raceCourse } from "../src/racer/courses";
import { createRaceSession, validRaceSession, startRace, stepRace } from "../src/racer/engine";
import { createGrowth, growthDraft, growthMove, growthQuestions, validGrowth } from "../src/learn/growth/engine";
import { noteLabel } from "../src/learn/noteLabel";
import { levelRoundSkill } from "../src/learn/learners";
const source = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
describe("classic audit regressions", () => {
  it("keeps Gentle going after a close and an impossible roll, retaining closed numbers", () => {
    let s = { ...createNumbers(defaultOptions), dice: [1], selected: [1] };
    s = closeNumbers(s);
    s = { ...s, dice: [1] };
    expect(needsPracticeRoll(s)).toBe(true);
    expect(numbersStatus(s)).toBe("playing");
    const next = rollNumbers(s);
    expect(next.available).toEqual([2,3,4,5,6]);
    expect(next.seed).not.toBe(s.seed);
    expect(validSession(next)).toBe(true);
    const { gentlePractice: _p, ...old } = s;
    expect(numbersStatus(old)).toBe("stuck");
    expect(validSession(old)).toBe(true);
    expect(validSession({ ...s, gentlePractice: "yes" })).toBe(false);
    expect(validSession({ ...s, bestRemaining: -1 })).toBe(false);
    expect(s.bestRemaining).toBe(20);
    expect(parseSave(JSON.stringify({ ...emptySave(), sessions: { numbers: next } })).sessions.numbers).toEqual(next);
  });
  it("allows a Gentle board to clear with repeated practice rolls", () => {
    let s = { ...createNumbers(defaultOptions), seed: 1 };
    for(let i=0;i<1000 && s.available.length;i++) {
      s = rollNumbers(s);
      const choice = numberChoices(s.available, s.dice[0])[0];
      if(choice) s = closeNumbers({ ...s, selected: choice });
    }
    expect(numbersStatus(s)).toBe("won");
    expect(s.bestRemaining).toBe(0);
  });
  it("shows the terminal canoe winner count and contains celebrations away from copy", () => {
    expect(source("board/Boards.tsx")).toContain('seat = typeof s.outcome === "number" ? s.outcome : s.turn');
    const ui = source("board/Screen.tsx");
    expect(ui).toContain('overflow: "hidden"');
    expect(ui).toContain('p.outcome !== null && success && <Celebrate burst={1}');
    expect(ui).toContain('s.mode !== "solo" || p.outcome === 0');
    expect(ui).toContain('flexDirection: wide ? "row" : "column"');
  });
  it("does not signal a completed classic round during hydration or round replacement", () => {
    expect(source("app/play.tsx")).toContain('s?.id === previousRound.current.id && store.epoch === previousRound.current.epoch && finished && !previousRound.current.finished');
    expect(source("components/Audio.tsx")).toContain('"NotAllowedError"');
  });
  it("uses friendly foundation and growth parent labels without internal IDs", () => {
    expect(noteLabel(`sound-boat:easy:${levelRoundSkill}`, {})).toContain("Level 1 · Cat, hen and sun · Completed rounds");
    expect(noteLabel("sound-boat:stretch:internal-id", {})).not.toContain("internal-id");
    expect(noteLabel("shell-math:hard:math.add", { "math.add": "Adding" })).toContain("Level 3 · More sums to 20 · Adding");
  });
  it("persists bounded tile drafts and clears them when changing question", () => {
    const o = { mode: "solo", pace: "easy", stage: "stretch" } as const;
    let s = createGrowth("sound-boat", o, { rng: () => .1, starter: 0, today: 1, skills: {} });
    const qs = growthQuestions("sound-boat", o, s);
    // The track includes tile construction; select such a question as the first one.
    const i = qs.findIndex(q => q.tiles);
    expect(i).toBeGreaterThanOrEqual(0);
    if(i) { [s.ids[0],s.ids[i]] = [s.ids[i],s.ids[0]]; [s.orders[0],s.orders[i]] = [s.orders[i],s.orders[0]]; }
    const questions = growthQuestions("sound-boat", o, s);
    s = growthDraft(s, [0], questions);
    expect(validGrowth(JSON.parse(JSON.stringify(s)), "sound-boat", o)).toBe(true);
    expect(s.draft).toEqual([0]);
    for(const bad of [[-1],[999],[0,0],[0.5]]) expect(validGrowth({ ...s, draft: bad }, "sound-boat", o)).toBe(false);
    s = growthMove(s, { type: "answer", value: questions[0].answer }, questions);
    expect(s.draft).toBeUndefined();
    s = growthMove(s, { type: "next" }, questions);
    expect(validGrowth(s, "sound-boat", o)).toBe(true);
    expect(s.draft).toBeUndefined();
  });
  it("offers Mystery replay and preserves the original harder option", () => {
    expect(source("mystery/MysteryScreen.tsx")).toContain('>Play again</Button>');
    expect(source("mystery/MysteryScreen.tsx")).toContain('>Challenge</Button>');
    expect(validMysterySession(createMysterySession(undefined, 1, "crew"))).toBe(true);
    const malformed = createMysterySession(undefined, 1, "crew");
    expect(validMysterySession({ ...malformed, adventure: { ...malformed.adventure, balance: "free-points" } })).toBe(false);
    expect(validMysterySession(createMysterySession(undefined, 1, "crew", "test", 1, "gentle"))).toBe(true);
  });
  it("gives gentle crew a viable job route across 300 seeds", () => {
    const receipt: Record<string, Record<string, number>> = {};
    for(const balance of ["gentle", "challenge"] as const) {
      const results: Record<string, number> = {};
      for(let seed=0;seed<300;seed++) {
        let s = createMysterySession(undefined, seed, "crew", `probe-${seed}`, 1, balance);
        for(let n=0;n<500 && !s.result;n++) {
          s = playSoloIntent(s, chooseMysteryBot(mysteryView(s, "you")) ?? {type:"wait"});
          expect(validMysterySession(s)).toBe(true);
        }
        const key = s.result ? `${s.result.winner}:${s.result.reason}` : "unfinished";
        results[key] = (results[key] ?? 0) + 1;
      }
      receipt[balance] = results;
    }
    console.log("Mystery seeded public-view bot policy (not child win rates)", JSON.stringify(receipt));
    expect(receipt.gentle["crew:tasks"] ?? 0).toBeGreaterThanOrEqual(240);
    expect(receipt.challenge["mischief:pranks"] ?? 0).toBeGreaterThan(0);
  }, 30000);
  it("validates Dash settings, separates rival speeds and softens helper falls", () => {
    const make = (helper: boolean, rivalStrength: "easy"|"steady"|"fast") => createRaceSession("lagoon", "race", 1, "test", {helper,rivalStrength});
    const easy = make(true,"easy"), steady = make(false,"steady"), fast = make(false,"fast");
    for(const s of [easy,steady,fast,createRaceSession()]) expect(validRaceSession(s)).toBe(true);
    expect(easy.runners[1].speed).toBeLessThan(steady.runners[1].speed);
    expect(steady.runners[1].speed).toBeLessThan(fast.runners[1].speed);
    expect(validRaceSession({...easy,rivalStrength:"impossible"})).toBe(false);
    let a = startRace(easy), b = startRace(steady);
    a = {...a,runners:a.runners.map((r,i)=>i ? r : {...r,y:-3,grounded:false})};
    b = {...b,runners:b.runners.map((r,i)=>i ? r : {...r,y:-3,grounded:false})};
    expect(stepRace(a,{direction:0}).runners[0].recovery).toBe(12);
    expect(stepRace(b,{direction:0}).runners[0].recovery).toBe(42);
    const obstacle = raceCourse("lagoon", 2).obstacles.find(o => o.kind !== "gate" && o.kind !== "roller")!;
    const contact = (s: typeof a) => ({...s, runners: s.runners.map((r,i) => i ? r : {...r,x:obstacle.x,y:obstacle.y+obstacle.height*.8,vy:0,grounded:false})});
    expect(stepRace(contact(startRace(easy)),{direction:0}).runners[0].falls).toBe(0);
    expect(stepRace(contact(startRace(steady)),{direction:0}).runners[0].falls).toBe(1);
  });
});
