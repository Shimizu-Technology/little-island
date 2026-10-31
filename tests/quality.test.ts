import { mysteryInstructions } from "../src/mystery/instructions";
import { readFileSync, existsSync } from "node:fs";
import { QUALITY_GUIDANCE } from "../src/explore/guidance";
import { newExploreProgress } from "../src/explore/progress";
import { describe, expect, it } from "vitest";
import { createNumbers, numberLimit, rollNumbers, selectNumber, closeNumbers, undoNumbers } from "../src/games/numbers";
import { defaultOptions } from "../src/games/types";
import { emptySave, parseSave, validSession } from "../src/state/validation";
import { createPartySession, partyAction, partyActor, rematchParty, validPartySession } from "../src/party/engine";
import { createTic, ticHintReason } from "../src/games/tic";
import { activityFinished } from "../src/state/activities";
import { advanceRace, createRaceSession, startRace } from "../src/racer/engine";
describe("quality release regressions", () => {
  it("bundles exact guidance transcripts and preserves valid Explore progress through backup", () => {
    const audio = { ...JSON.parse(readFileSync("scripts/quality-audio.json", "utf8")), ...JSON.parse(readFileSync("scripts/learn/play-v25.json", "utf8")) };
    for (const [key, text] of Object.entries({...QUALITY_GUIDANCE, ...mysteryInstructions})) {
      expect(audio[key]).toBe(text);
      expect(existsSync(`assets/audio/${key}.m4a`)).toBe(true);
    }
    const progress = newExploreProgress();
    progress.query = "turtle";
    progress.location = { kind: "activity", world: "oceans" };
    const save = {...emptySave(), explore: { favorites: ["sun"], progress }};
    // Real topic identity comes from the content, not arbitrary imported strings.
    save.explore.favorites = [];
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(() => parseSave(JSON.stringify({...save, explore: {...save.explore, progress: {...progress, query:"x".repeat(101)}}}))).toThrow();
  });
  it("new number difficulties differ and all twelve Challenge numbers survive save/undo", () => {
    for (const [difficulty, max] of [["easy", 6], ["medium", 9], ["hard", 12]] as const) {
      const s = createNumbers({ ...defaultOptions, difficulty });
      expect(numberLimit(s)).toBe(max);
      expect(s.available).toEqual(Array.from({length:max}, (_,i)=>i+1));
      expect(validSession(s)).toBe(true);
      expect(rollNumbers(s).dice).toHaveLength(difficulty === "easy" ? 1 : 2);
    }
    let s = createNumbers({ ...defaultOptions, difficulty:"hard" });
    s = {...s, dice:[6,6]};
    const closed = closeNumbers(selectNumber(s,12));
    expect(closed.available).not.toContain(12);
    expect(validSession(closed)).toBe(true);
    expect(undoNumbers(closed)).toMatchObject({ available:s.available, dice:[6,6] });
    const save = {...emptySave(), sessions:{numbers:closed}};
    expect(parseSave(JSON.stringify(save))).toEqual(save);
  });
  it("keeps build6 hard-nine number rounds intact and rejects forged new limits", () => {
    const {maxNumber: _limit, ...legacy} = createNumbers({...defaultOptions,difficulty:"hard"});
    void _limit;
    legacy.available=Array.from({length:9},(_,i)=>i+1);
    expect(numberLimit(legacy)).toBe(9);
    expect(validSession(legacy)).toBe(true);
    expect(validSession({...legacy,maxNumber:12,available:[13]})).toBe(false);
    expect(validSession({...createNumbers(defaultOptions),maxNumber:12})).toBe(false);
  });
  it("does not give the previous imposter immunity; clue order rotates without changing legacy rounds", () => {
    const players=["A","B","C","D"];
    for(let previous=0;previous<4;previous++) {
      const assigned = new Set(Array.from({length:100},(_,seed)=>createPartySession({players,seed,previousImposter:previous}).imposter));
      expect(assigned).toEqual(new Set([0,1,2,3]));
    }
    const pairs = new Set(Array.from({length:200},(_,seed)=>{
      const s=createPartySession({players,seed});
      return `${s.firstClue}:${s.imposter}`;
    }));
    expect(pairs.size).toBe(16); // Public first speaker must not determine the hidden role.
    let s=createPartySession({players,seed:2,firstClue:2});
    while(s.phase==="roles") s=partyAction(s,{sessionId:s.id,revision:s.revision,player:partyActor(s)!,type:"role-done"});
    expect(partyActor(s)).toBe(2);
    const next=rematchParty(s);
    expect(next.firstClue).toBe(3);
    const { firstClue: _first,...legacy }=s; void _first;
    expect(validPartySession(legacy)).toBe(true);
    expect(partyActor(legacy)).toBe(0);
    expect(validPartySession({...s,firstClue:4})).toBe(false);
  });
  it("teaches the exact immediate winning or blocking square", () => {
    const s=createTic(defaultOptions);
    expect(ticHintReason({...s,board:["X","X",null,"O","O",null,null,null,null]},2)).toMatch(/completes/);
    expect(ticHintReason({...s,board:["X","X",null,"O",null,null,null,null,null]},2)).toMatch(/Block/);
  });
  it("an accessible eighteen-tick step travels the same distance at slow or fast frame cadences", () => {
    const results = [1/60,0.1,0.2,0.4,0.5].map(dt => {
      let state = startRace(createRaceSession("training", "practice", 1)), remainder=0, nudge=18;
      state = {...state, runners: state.runners.map(r=>({...r,x:5.8}))};
      for(let wall=0;wall<2-1e-8;wall+=dt) {
        const before=state.tick;
        const frame=advanceRace(state,{direction:1,directionTicks:nudge},dt,remainder);
        state=frame.session; remainder=frame.remainder; nudge=Math.max(0,nudge-(state.tick-before));
      }
      return {tick:state.tick,x:state.runners[0].x,falls:state.runners[0].falls};
    });
    for(const result of results) {
      expect(result.tick).toBe(120);
      expect(result.falls).toBe(0);
      expect(result.x).toBeCloseTo(results[0].x,8);
    }
  });
  it("does not advertise finished or timed-out races as resumable", () => {
    const s=createRaceSession();
    expect(activityFinished(s)).toBe(false);
    expect(activityFinished({...s,status:"finished"})).toBe(true);
    expect(activityFinished({...s,status:"timedout"})).toBe(true);
  });
});
