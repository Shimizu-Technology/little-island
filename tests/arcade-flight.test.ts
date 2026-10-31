import { describe, expect, it } from "vitest";
import { arcadeTransition, emptyArcade, validArcade } from "../src/arcade/progress";
import { createFlight as createWaitingFlight, flightGap, flightLearning, flightResult, flightSpeed, flightStep, flightTransition, validFlight, FLAP_VELOCITY, FLIGHT_GRAVITY, type FlightState } from "../src/arcade/games/fruit-bat-flight/engine";
import { fixtureInput } from "../src/arcade/games/lagoon-run/fixtures";
import { createRun, rowSafe, runResult, runStep, runTransition, validRun, type RunState } from "../src/arcade/games/lagoon-run/engine";
import { equation, flightLevels, mathGate, runLevels, validFact } from "../src/arcade/games/scrolling/content";
import { flightFrame, runFrame } from "../src/arcade/games/scrolling/commands";
import { projectTrack, trackSprite, roadEdge } from "../src/arcade/games/lagoon-run/camera";
import { FIXED_DT } from "../src/arcade/clock";
import { allLevelIds, worldIds } from "../src/arcade/types";
/** Most physics tests start mid-flight; the waiting/ready state has its own test below. */
const createFlight = (...args: Parameters<typeof createWaitingFlight>): FlightState => ({ ...createWaitingFlight(...args), waiting: false });
function fly(initial: FlightState, offset = .045, look = .175, trigger = -.05): FlightState {
  let s = initial;
  for (let i = 0; i < 90000 && !flightResult(s); i++) {
    const gate = s.gates.filter(g => !g.passed && g.x > look).sort((a,b) => a.x-b.x)[0];
    const target = gate ? flightLearning(s) ? [.24,.5,.76][gate.fact.choices.indexOf(gate.fact.answer)] : gate.center : .5;
    // A real player taps out of the hover (level start, or after a lost heart) the same way as any flap.
    if (s.waiting || (s.y > target + offset && s.vy > trigger)) s = flightTransition(s, {type:"flap"});
    s = flightStep(s,{type:"idle"},FIXED_DT);
    if (i%600===0) expect(validFlight(s), `${initial.level === "endless" ? "free" : initial.level.id} at ${i}`).toBe(true);
  }
  return s;
}
function run(initial: RunState): RunState {
  let s = initial;
  for(let i=0;i<50000&&!runResult(s);i++) {
    s=runStep(runTransition(s,fixtureInput(s)),{type:"idle"},FIXED_DT);
    if(i%600===0)expect(validRun(s)).toBe(true);
  }
  return s;
}
function advanceRun(s: RunState, ticks: number) {for(let i=0;i<ticks;i++)s=runStep(s,{type:"idle"},FIXED_DT);return s;}
describe("56-level feel curves",()=>{
  it("has every stable ID, six increasingly fast worlds, bounded geometry and honest goals",()=>{
    for(const levels of [flightLevels,runLevels]) {
      expect(levels.map(l=>l.id)).toEqual(allLevelIds);
      for(const world of worldIds)expect(levels.filter(l=>l.world===world)).toHaveLength(8);
      expect(levels.every(l=>l.target>=3&&l.spacing>.4&&l.goals.length===3&&l.goals.every(Boolean))).toBe(true);
      for(let i=1;i<48;i++)expect(levels[i].speed).toBeGreaterThan(levels[i-1].speed);
      expect(levels.filter(l=>l.storm)).toHaveLength(24);
    }
    expect(flightLevels[0].speed).toBe(.36);expect(flightLevels[0].target).toBe(12);
    expect(flightLevels[47].target).toBe(60);expect(runLevels[0].target).toBe(14);
  });
  it("produces deterministic unique correct math choices without timed reading",()=>{
    for(let seed=0;seed<100;seed++)for(let i=1;i<=8;i++) {
      const a=mathGate(seed,i);expect(a).toEqual(mathGate(seed,i));expect(validFact(a.fact)).toBe(true);
      expect(a.fact.choices.filter(n=>n===a.fact.answer)).toHaveLength(1);expect(equation(a.fact)).toContain("= ?");
      if(i<5)expect(a.fact.answer).toBeLessThanOrEqual(10);
    }
    expect(validFact({...mathGate(4,2).fact,choices:[1,1,1]})).toBe(false);
  });
  it("clears all 112 levels with legal inputs and valid bounded states",()=>{
    for(const level of flightLevels) {
      let s: FlightState | undefined;
      // Same legal flap policy, with timing search for the now-visible torso hull.
      for(const trigger of [-.05,-.35,.1]) {
        for(const look of [.175,.19,.2,.22,.14]) {
          for(const offset of [.045,.025,.065,0,-.02,.035,.055,.015,.075,.06,.07,.05,.04]) {
            const attempt=fly(createWaitingFlight(level,981,false),offset,look,trigger);
            if(flightResult(attempt)?.stars===3) { s=attempt; break; }
          }
          if(s) break;
        }
        if(s) break;
      }
      expect(s,level.id).toBeDefined(); expect(validFlight(s),level.id).toBe(true);
    }
    for(const level of runLevels){const s=run(createRun(level,771,false));expect(runResult(s)?.stars,level.id).toBe(3);expect(validRun(s),level.id).toBe(true);}
  },30000);
});
describe("Fruit Bat Flight physics and hearts",()=>{
  it("keeps a readable first-world flap arc and regular trunk cadence",()=>{
    const s=createWaitingFlight(flightLevels[0],42);
    const rise=FLAP_VELOCITY*FLAP_VELOCITY/(2*FLIGHT_GRAVITY)*660;
    expect(rise).toBeGreaterThan(65);
    expect(rise).toBeLessThan(flightGap(s)*660);
    expect(s.level !== "endless" && s.level.spacing/flightSpeed(s)).toBeGreaterThan(1.25);
    expect(s.level !== "endless" && s.level.spacing/flightSpeed(s)).toBeLessThan(1.5);
  });
  it("sets instant flap velocity, accepts every fast down, applies gravity and caps fall speed",()=>{
    const s=createFlight(flightLevels[0],42),raw=JSON.stringify(s);
    let next=flightTransition(s,{type:"flap"});expect(next.vy).toBe(-.65);
    for(let i=0;i<5;i++)next=flightTransition(next,{type:"flap"});expect(next.event).toBe(6);
    const a=flightStep(next,{type:"idle"},FIXED_DT);expect(a.vy).toBeCloseTo(-.65+1.9/60);
    expect(a).toEqual(flightStep(next,{type:"idle"},FIXED_DT));expect(JSON.stringify(s)).toBe(raw);
    expect(flightStep({...s,y:.4,vy:1.2},{type:"idle"},FIXED_DT).vy).toBe(1.2);
    for(const dt of [0,-1,NaN,Infinity,.2])expect(flightStep(s,{type:"idle"},dt)).toBe(s);
  });
  it("waits in a hover at the start until the first tap, then flies", () => {
    const s = createWaitingFlight(flightLevels[0], 3); expect(s.waiting).toBe(true); expect(validFlight(s)).toBe(true);
    let held = s; for (let i = 0; i < 120; i++) held = flightStep(held, { type: "idle" }, FIXED_DT);
    expect(held.travel).toBe(0); expect(held.y).toBe(s.y); expect(held.gates).toEqual(s.gates); expect(held.lives).toEqual(s.lives);
    const flying = flightStep(flightTransition(held, { type: "flap" }), { type: "idle" }, FIXED_DT);
    expect(flying.waiting).toBe(false); expect(flying.travel).toBeGreaterThan(0); expect(flying.y).toBeLessThan(s.y);
    expect(validFlight({ ...s, waiting: "yes" })).toBe(false);
  });
  it("spends 3/5 hearts, protects for 1.2 s after the respawn tap, and holds the world while waiting",()=>{
    for(const helper of [false,true]) {
      let s=createFlight(flightLevels[0],8,helper);const count=helper?5:3;
      for(let hit=1;hit<=count;hit++) {
        s=flightStep({...s,waiting:false,y:.98,vy:.5,cooldown:0,lives:{...s.lives,invulnerable:0}},{type:"idle"},FIXED_DT);
        expect(s.lives.hearts).toBe(count-hit);expect(s.lives.hit).toBe(hit);expect(s.lives.invulnerable).toBe(1.2);
        expect(s.travel).toBeGreaterThan(0);expect(s.y).toBeLessThan(hit < count ? .8 : 1);
        if(hit<count){expect(s.waiting).toBe(true);const held=flightStep(s,{type:"idle"},FIXED_DT);expect(held.travel).toBe(s.travel);expect(held.lives.invulnerable).toBe(1.2);const next=flightStep(flightTransition({...held,y:.98},{type:"flap"}),{type:"idle"},FIXED_DT);expect(next.waiting).toBe(false);expect(next.lives.hearts).toBe(s.lives.hearts);expect(next.travel).toBeGreaterThan(s.travel);}
      }
      expect(flightResult(s)?.outcome).toBe("game-over");expect(flightStep(s,{type:"idle"},FIXED_DT)).toBe(s);
    }
  });
  it("free play ends on one hit even with Helper and preserves terminal identity",()=>{
    for(const helper of [false,true]){const s=createFlight("endless",1,helper);const dead=flightStep({...s,y:.98},{type:"idle"},FIXED_DT);expect(dead.lives.hearts).toBe(0);expect(dead.y).toBe(.965);expect(flightResult(dead)?.outcome).toBe("game-over");expect(flightTransition(dead,{type:"flap"})).toBe(dead);}
    const end=flightTransition(createFlight("endless",1),{type:"finish"});expect(flightResult(end)?.outcome).toBe("stopped");
  });
  it("widens Helper gaps, preserves damage on toggles, and rewards skilled clears",()=>{
    const s=fly(createFlight(flightLevels[0],92,true));expect(flightResult(s)?.stars).toBe(3);expect(s.helped).toBe(true);
    expect(flightGap(s)).toBeGreaterThan(flightGap({...s,helper:false}));
    const fresh=createFlight(flightLevels[0],1);const damaged={...fresh,lives:{...fresh.lives,hearts:2}};
    expect(flightTransition(flightTransition(damaged,{type:"helper",value:true}),{type:"helper",value:false}).lives.hearts).toBe(2);
    for(const [bumps,fruit,stars] of [[0,12,3],[0,3,2],[1,12,2],[2,12,1]])expect(flightResult({...fresh,status:"cleared",passed:12,bumps,fruit})?.stars).toBe(stars);
  });
  it("wrong learning answers retry the same fact without spending hearts",()=>{
    const s=createFlight(flightLevels[48],16),g=s.gates[0],wrong=g.fact.choices.findIndex(n=>n!==g.fact.answer);
    const next=flightStep({...s,y:[.24,.5,.76][wrong],gates:[{...g,x:.17},...s.gates.slice(1)]},{type:"idle"},FIXED_DT);
    expect(next.cue).toBe("try");expect(next.lives.hearts).toBe(3);expect(next.gates[0].fact).toEqual(g.fact);expect(next.helped).toBe(true);
  });
});
describe("Lagoon camera, actions, patterns and lives",()=>{
  it("projects horizon, road edges, lane lines and sprite feet with one camera",()=>{
    for(const lane of [0,1,2])expect(projectTrack(lane,-1.2)).toEqual({x:195,y:660*.44,scale:0});
    expect(projectTrack(0,1).x).toBeCloseTo(195-390*.46*2/3);
    expect(projectTrack(2,1).y).toBeCloseTo(660*.84);
    for(const z of [-1.2,-.8,-.4,0,.1,.4,.8,1,1.15])for(const lane of [0,1,2]) {
      const p=projectTrack(lane,z),a=trackSprite(lane,z,72,72);
      expect(a.y+36+36*a.scale).toBeCloseTo(p.y);expect(p.x).toBeGreaterThanOrEqual(roadEdge(z,false).x);expect(p.x).toBeLessThanOrEqual(roadEdge(z,true).x);
    }
  });
  it("uses a 120ms lane tween and exactly .55s/.6s jump/slide with landing squash",()=>{
    const s=createRun(runLevels[0],22);const left=runTransition(s,{type:"left"});expect(left.poseLane).toBe(1);
    expect(advanceRun(left,4).poseLane).toBeGreaterThan(0);expect(advanceRun(left,8).poseLane).toBe(0);
    const jump=runTransition(s,{type:"jump"});expect(jump.jump).toBe(.55);expect(runTransition(jump,{type:"jump"})).toBe(jump);
    expect(advanceRun(jump,34).jump).toBe(0);expect(advanceRun(jump,34).landing).toBeGreaterThan(0);
    const duck=runTransition(jump,{type:"duck"});expect(duck.duck).toBe(.6);expect(duck.jump).toBe(0);expect(advanceRun(duck,37).duck).toBe(0);
    for(const lane of [-1,3,.5,NaN,Infinity])expect(runTransition(s,{type:"lane",lane})).toBe(s);
  });
  it("collides by visible pose; jump needs height, duck needs an active crouch",()=>{
    const s=createRun(runLevels[0],22),base={...s.rows[0],lane:1,z:1,second:-1,third:false,moving:false,crossing:false};
    for(const kind of ["coconut","crab","frond","line"] as const){
      const row={...base,kind};expect(rowSafe(s,row)).toBe(false);
      const low=kind==="coconut"||kind==="crab";
      const correct=advanceRun(runTransition(s,{type:low?"jump":"duck"}),8);expect(rowSafe(correct,row)).toBe(true);
      expect(rowSafe(runTransition(s,{type:low?"duck":"jump"}),row)).toBe(false);
      expect(rowSafe(advanceRun(runTransition(s,{type:"left"}),8),row)).toBe(true);
    }
  });
  it("authors forced jump/roll/lane beats rather than routing every shell around hazards",()=>{
    const s=createRun(runLevels[0],42);
    expect(s.rows.slice(0,3).map(r=>r.action)).toEqual(["jump","duck","idle"]);
    expect(s.rows[0].third).toBe(true);expect(s.rows[1].kind).toBe("net");
    expect(s.rows[2].shellLane).not.toBe(s.rows[2].lane);
    expect(createRun(runLevels[6],42).rows.some(r=>r.kind==="moving-canoe")).toBe(true);
  });
  it("no-input arcade loses with Helper on/off; learning retains unlimited retries",()=>{
    for(const helper of [false,true]){let s=createRun(runLevels[0],6,helper);s=advanceRun(s,10000);expect(runResult(s)?.outcome).toBe("game-over");expect(s.lives.hearts).toBe(0);expect(runStep(s,{type:"idle"},FIXED_DT)).toBe(s);}
    const s=createRun(runLevels[48],14),row={...s.rows[0],z:1},lane=row.fact.choices.findIndex(n=>n!==row.fact.answer);
    const next=runStep({...s,lane,poseLane:lane,laneFrom:lane,rows:[row,...s.rows.slice(1)]},{type:"idle"},FIXED_DT);
    expect(next.cue).toBe("try");expect(next.lives.hearts).toBe(3);expect(next.helped).toBe(true);expect(next.rows[0].fact).toEqual(row.fact);
  });
  it("spends one heart per protected hit without stopping road travel, scores accurate shell trails",()=>{
    const s=createRun(runLevels[0],2),row={...s.rows[0],z:1,lane:1};const hit=runStep({...s,rows:[row,...s.rows.slice(1)]},{type:"idle"},FIXED_DT);
    expect(hit.lives.hearts).toBe(2);expect(hit.passed).toBe(0);expect(runStep(hit,{type:"idle"},FIXED_DT).travel).toBeGreaterThan(hit.travel);
    for(const [bumps,shells,stars] of [[0,42,3],[0,0,2],[1,42,2],[2,42,1]])expect(runResult({...s,status:"cleared",passed:14,bumps,shells})?.stars).toBe(stars);
    expect(runResult(runTransition(createRun("endless",1),{type:"finish"}))?.outcome).toBe("stopped");
  });
});
describe("step reproducibility",()=>{
  it("keeps source state immutable and deterministically replays the same run inputs",()=>{
    const original=createRun(runLevels[32],981),raw=JSON.stringify(original);
    const act=(s: RunState)=>advanceRun(runTransition(s,{type:"left"}),90);
    expect(act(original)).toEqual(act(original));expect(JSON.stringify(original)).toBe(raw);
  });
  it("publishes recycle geometry without inventing another score/haptic cue",()=>{
    const f=createFlight(flightLevels[0],1),r=createRun(runLevels[0],1);
    const a=flightStep({...f,cue:"fruit",gates:f.gates.map((g,i)=>i?g:{...g,x:-.2,passed:true})},{type:"idle"},FIXED_DT);
    const b=runStep({...r,cue:"shell",rows:r.rows.map((row,i)=>i?row:{...row,z:1.9,passed:true,shellDone:7})},{type:"idle"},FIXED_DT);
    expect(a.event).toBeGreaterThan(f.event);expect(a.cue).toBe("ready");expect(b.cue).toBe("ready");
  });
});
describe("UI command mailbox",()=>{
  it("consumes rapid downs once, in order, without replaying persistent input",()=>{
    const input={helper:false,queue:[{id:1,action:{type:"flap" as const}},{id:2,action:{type:"flap" as const}}]};
    const a=flightFrame(createFlight(flightLevels[0],1),input,FIXED_DT);expect(a.event).toBe(2);expect(a.command).toBe(2);expect(flightFrame(a,input,FIXED_DT).event).toBe(2);
    const ri={helper:false,queue:[{id:1,action:{type:"left" as const}},{id:2,action:{type:"right" as const}},{id:3,action:{type:"jump" as const}}]};
    const r=runFrame(createRun(runLevels[0],1),ri,FIXED_DT);expect(r.lane).toBe(1);expect(r.jump).toBeGreaterThan(0);expect(runFrame(r,ri,FIXED_DT).event).toBe(r.event);
  });
});
describe("strict state and kit saves", () => {
  it("ignores malformed serialized actions without changing the engine", () => {
    const f = createFlight(flightLevels[0], 1), r = createRun(runLevels[0], 1);
    for (const input of [null, [], 3, {}, { type: "unknown" }, { type: "helper", value: "yes" }]) {
      expect(flightTransition(f, input as never)).toBe(f); expect(runTransition(r, input as never)).toBe(r);
    }
  });
  it("rejects malformed engine states and level content, while active rounds are never persisted", () => {
    for (const [create, valid, levels] of [[createFlight, validFlight, flightLevels], [createRun, validRun, runLevels]] as const) {
      const s = create(levels[0], 1); expect(valid(s)).toBe(true);
      for (const bad of [null, [], {}, { ...s, seed: -1 }, { ...s, score: Infinity }, { ...s, helper: 1 }, { ...s, time: NaN }, { ...s, level: { ...levels[0], speed: 999 } }, { ...s, level: { id: "w1-1" } }]) expect(valid(bad)).toBe(false);
    }
    const f = createFlight(flightLevels[0], 2); expect(validFlight({ ...f, gates: [] })).toBe(false); expect(validFlight({ ...f, y: 2 })).toBe(false);
    const r = createRun(runLevels[0], 2); expect(validRun({ ...r, rows: [] })).toBe(false); expect(validRun({ ...r, lane: 3 })).toBe(false);
    expect(validArcade({ ...emptyArcade(), flight: f })).toBe(false); expect(validArcade({ ...emptyArcade(), run: r })).toBe(false);
  });
  it("stores both games per learner, prevents duplicate credit and rejects hostile save additions", () => {
    let save = emptyArcade();
    for (const game of ["fruit-bat-flight", "lagoon-run"] as const) {
      save = arcadeTransition(save, "family", { type: "finish", game, level: "w1-1", score: 240, stars: 3, round: game, name: "Family" });
      expect(validArcade(save)).toBe(true); expect(save.people.family.games[game]?.stars["w1-1"]).toBe(3);
      expect(arcadeTransition(save, "family", { type: "finish", game, level: "w1-1", score: 999, stars: 3, round: game, name: "Family" })).toBe(save);
    }
    expect(save.people.kai).toBeUndefined(); const raw = JSON.parse(JSON.stringify(save)); raw.people.family.games["fruit-bat-flight"].running = true; expect(validArcade(raw)).toBe(false);
    const bad = JSON.parse(JSON.stringify(save)); bad.people.family.games["lagoon-run"].stars["w7-1"] = 3; expect(validArcade(bad)).toBe(false);
  });
});

describe("Helper toggles never leave a run with zero hearts", () => {
  it("Flight: turning Helper off after three Helper hits ends the level as a game over", () => {
    let s = createFlight(flightLevels[0], 5, true);
    for (let hit = 0; hit < 3; hit++) s = flightStep({ ...s, waiting: false, y: .98, vy: .5, cooldown: 0, lives: { ...s.lives, invulnerable: 0 } }, { type: "idle" }, FIXED_DT);
    expect(s.lives.hearts).toBe(2);
    const off = flightTransition(s, { type: "helper", value: false });
    expect(off.lives.hearts).toBe(0); expect(off.status).toBe("bumped"); expect(flightResult(off)?.outcome).toBe("game-over"); expect(validFlight(off)).toBe(true);
    const fewer = flightTransition(flightStep({ ...createFlight(flightLevels[0], 5, true), y: .98, vy: .5 }, { type: "idle" }, FIXED_DT), { type: "helper", value: false });
    expect(fewer.lives.hearts).toBe(2); expect(fewer.status).toBe("playing");
  });
  it("Run: turning Helper off after three Helper hits ends the level as a game over", () => {
    const s = createRun(runLevels[0], 5, true), hurt = { ...s, lives: { ...s.lives, hearts: 2, hit: 3 }, bumps: 3 };
    const off = runTransition(hurt, { type: "helper", value: false });
    expect(off.lives.hearts).toBe(0); expect(off.status).toBe("stumbled"); expect(runResult(off)?.outcome).toBe("game-over");
  });
});

describe("waiting holds the world still", () => {
  it("gap width and centres are continuous across a wait after a lost heart (moving-gap world)", () => {
    const level = flightLevels.find(l => l.id === "w6-1")!;
    let s = flightStep(flightTransition(createWaitingFlight(level, 12, false), { type: "flap" }), { type: "idle" }, FIXED_DT);
    s = flightStep({ ...s, y: .98, vy: .5, cooldown: 0, lives: { ...s.lives, invulnerable: 0 } }, { type: "idle" }, FIXED_DT);
    expect(s.waiting).toBe(true);
    const gap = flightGap(s), centres = s.gates.map(g => g.center), time = s.time;
    let held = s; for (let i = 0; i < 180; i++) held = flightStep(held, { type: "idle" }, FIXED_DT);
    expect(held.time).toBe(time); expect(flightGap(held)).toBe(gap); expect(held.gates.map(g => g.center)).toEqual(centres); expect(held.hover).toBeGreaterThan(s.hover);
    const resumed = flightStep(flightTransition(held, { type: "flap" }), { type: "idle" }, FIXED_DT);
    resumed.gates.forEach((g, i) => expect(Math.abs(g.center - centres[i])).toBeLessThan(.01));
  });
});
