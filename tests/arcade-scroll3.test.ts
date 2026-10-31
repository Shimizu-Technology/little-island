import { describe, expect, it } from "vitest";
import { batAngle, batExtentX, batExtentY, batTouchesGate, batTouchesRect, BAT_RX, BAT_RY, CEILING, GROUND, FLIGHT_H, FLIGHT_W, TRUNK_HALF } from "../src/arcade/games/fruit-bat-flight/hull";
import { createFlight, flightStep } from "../src/arcade/games/fruit-bat-flight/engine";
import { createRun, runStep, runTransition, validRun } from "../src/arcade/games/lagoon-run/engine";
import { flightLevels, runLevels } from "../src/arcade/games/scrolling/content";
import { runnerFrame, runnerDrawings } from "../src/arcade/games/scrolling/character";
import { sceneryPose } from "../src/arcade/games/scrolling/environmentPoses";
import { runPoses } from "../src/arcade/games/scrolling/render";
import { projectTrack } from "../src/arcade/games/lagoon-run/camera";
const idle={type:"idle" as const},dt=1/60;
describe("individual runner shell contacts",()=>{
  function at(z:number,lane:number) { const s=createRun(runLevels[0],4);return {...s,lane,poseLane:lane,laneFrom:lane,rows:s.rows.map((r,i)=>i?r:{...r,z,shellLane:0,lane:1,second:-1,third:false,action:"idle" as const})}; }
  it("resolves each contact separately, preserves missed shells, and never awards one twice",()=>{
    let s=at(.855,0),original=JSON.stringify(s);const a=runStep(s,idle,dt);expect(JSON.stringify(s)).toBe(original);expect(a.shells).toBe(1);expect(a.rows[0].shellTaken).toBe(4);expect(a.rows[0].bursts[2]).toBe(.26);expect(a.passed).toBe(0);expect(validRun(a)).toBe(true);
    s=runStep({...a,rows:a.rows.map((r,i)=>i?r:{...r,z:.925})},idle,dt);expect(s.shells).toBe(2);expect(s.rows[0].shellTaken).toBe(6);
    s=runStep({...s,rows:s.rows.map((r,i)=>i?r:{...r,z:.995})},idle,dt);expect(s.shells).toBe(3);expect(s.rows[0].shellTaken).toBe(7);expect(s.score).toBe(40);expect(s.passed).toBe(1);expect(validRun(s)).toBe(true);
    const again=runStep(s,idle,dt);expect(again.shells).toBe(3);expect(again.score).toBe(40);
    const missed=runStep(at(.855,2),idle,dt);expect(missed.shells).toBe(0);expect(missed.rows[0].shellDone).toBe(4);expect(missed.rows[0].shellTaken).toBe(0);expect(runPoses(missed)[13].opacity).not.toBe(0);
  });
  it("samples the actual eased lane at each shell, allows partial trails and keeps passed obstacles",()=>{
    let s=runStep(at(.855,0),idle,dt);s=runTransition(s,{type:"right"});
    for(let i=0;i<32;i++)s=runStep(s,idle,dt);
    expect(s.shells).toBe(1);expect(s.rows[0].shellDone).toBe(7);expect(s.rows[0].shellTaken).toBe(4);
    const passed={...s,rows:s.rows.map((r,i)=>i?r:{...r,z:1.06,passed:true})};const p=runPoses(passed);expect(p[1].opacity).toBe(1);expect(p[1].y).toBeGreaterThan(projectTrack(1,1).y-72);
    expect(validRun({...s,rows:s.rows.map((r,i)=>i?r:{...r,shellDone:0,shellTaken:4})})).toBe(false);
    expect(validRun({...s,rows:s.rows.map((r,i)=>i?r:{...r,bursts:[NaN,0,0]})})).toBe(false);
  });
});
describe("anchored authored poses and camera scenery",()=>{
  it("plays eight connected drawings at 16 poses/s with distinct jump/roll/landing/stumble/clear states",()=>{
    const s=createRun(runLevels[0],2);expect(new Set(Array.from({length:8},(_,i)=>runnerFrame({...s,time:i/16})))).toHaveLength(8);
    expect(runnerDrawings).toHaveLength(8);for(const d of runnerDrawings){expect(d.knee).toHaveLength(2);expect(d.foot.every(p=>p[1]<=128)).toBe(true);}
    expect([.55,.3,.05].map(jump=>runnerFrame({...s,jump}))).toEqual([8,9,10]);expect([.6,.3,.04].map(duck=>runnerFrame({...s,duck}))).toEqual([11,12,13]);expect(runnerFrame({...s,landing:.1})).toBe(10);expect(runnerFrame({...s,cooldown:.1})).toBe(14);expect(runnerFrame({...s,status:"cleared"})).toBe(15);
    for(const jump of [0,.55,.3,.05]){const p=runPoses({...s,jump});expect(p[50].y).toBeCloseTo(projectTrack(1,1).y-7);expect(p.slice(80,96).filter(p=>p.opacity!==0)).toHaveLength(1);}
  });
  it("projects twelve side objects outside the lanes with slower far motion and recycle identities",()=>{
    for(let i=0;i<12;i++){const p=sceneryPose(.1,i),q=sceneryPose(.11,i);expect(Number.isFinite(p.y)).toBe(true);expect(p.x+50<195||p.x+50>195).toBe(true);expect(q.y).not.toBe(p.y);}
    expect(Math.abs(sceneryPose(.11,8).y-sceneryPose(.1,8).y)).toBeLessThan(Math.abs(sceneryPose(.11,0).y-sceneryPose(.1,0).y));expect(sceneryPose(3,0).identity).not.toBe(sceneryPose(0,0).identity);
  });
});
describe("one visible bat torso hull",()=>{
  it("tests exact edge, corner and near-edge misses at neutral, climb and fall angles",()=>{
    expect(batTouchesRect(0,0,0,BAT_RX+.01,-5,80,5)).toBe(false);expect(batTouchesRect(0,0,0,BAT_RX,-5,80,5)).toBe(true);expect(batTouchesRect(0,0,0,20,20,80,80)).toBe(false);expect(batTouchesRect(0,0,0,-1,-1,1,1)).toBe(true);
    for(const angle of [-.436,0,1.134]){const e=batExtentY(angle);expect(batTouchesRect(0,0,angle,-100,e+.01,100,100)).toBe(false);expect(batTouchesRect(0,0,angle,-100,e,100,100)).toBe(true);}
    expect(batExtentY(0)).toBe(BAT_RY);
  });
  it("does not award a gap while the visible torso still overlaps its trailing trunk edge",()=>{
    const base={...createFlight(flightLevels[0],8),waiting:false,y:.5,vy:0};
    const overlapping=flightStep({...base,gates:base.gates.map((g,i)=>i?g:{...g,x:.17,center:.5,base:.5})},idle,.00001);
    expect(overlapping.passed).toBe(0);
    const threshold=.24-(TRUNK_HALF+batExtentX(0))/FLIGHT_W;
    const clear=flightStep({...base,gates:base.gates.map((g,i)=>i?g:{...g,x:threshold-.001,center:.5,base:.5})},idle,.00001);
    expect(clear.passed).toBe(1);expect(clear.score).toBe(1);
  });

  it("uses the same support extent for ceiling, ground, trunk and gap edges",()=>{
    const x=.24,center=.5,gap=.3,extent=batExtentY(batAngle(0));
    expect(batTouchesGate(center-gap/2+extent/FLIGHT_H+.001,0,x,center,gap)).toBe(false);expect(batTouchesGate(center-gap/2+extent/FLIGHT_H,0,x,center,gap)).toBe(true);
    for(const y of [(CEILING+extent-.5)/FLIGHT_H,(GROUND-extent+.5)/FLIGHT_H]){const s={...createFlight(flightLevels[0],4),waiting:false,y,vy:0};expect(flightStep(s,idle,.00001).lives.hearts).toBe(2);}
  });
});
