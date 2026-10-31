import { describe, expect, it } from 'vitest';
import { HIDDEN_POSE, interpolatePoses } from '../src/arcade/poses';
import { createRun, rowSafe, runTransition, runStep, surfaceHeight, SLIDE_SECONDS } from '../src/arcade/games/lagoon-run/engine';
import { DUCK_MAX_ELEVATION } from '../src/arcade/games/lagoon-run/geometry';
import { runLevels } from '../src/arcade/games/scrolling/content';
import { runnerFrame } from '../src/arcade/games/scrolling/character';
import { runPoses } from '../src/arcade/games/scrolling/render';
const fixture=()=>{
 const s=createRun(runLevels[0],42);
 s.rows=s.rows.map((r,i)=>({...r,z:i?-4:.999,kind:'net',lane:1,second:-1,third:false,surface:'sand',power:'none',shellTaken:7}));
 return s;
};
describe('Run round 3 presentation contract',()=>{
 it('keeps rendered contact and painter side together at every interpolation alpha, including canoes',()=>{
  for(const kind of ['net','canoe','moving-canoe'] as const){
   const s=fixture();s.rows[0].kind=kind;const a=runPoses(s);s.rows[0].z=1.001;const b=runPoses(s);
   for(let n=0;n<=100;n++){
    const p=interpolatePoses(a,b,n/100)[1];
    expect(p.frame!>10000).toBe(p.painterDepth!>1);
    if(kind==='net')expect(p.painterDepth).toBeCloseTo(p.scale!,12);
   }
   expect(interpolatePoses(a,b,.01)[1].frame).toBeLessThan(10000);
   expect(interpolatePoses(a,b,.99)[1].frame).toBeGreaterThan(10000);
  }
 });
 it('sorts offset shells, hazards, power-ups and canoe actors together by actual depth',()=>{
  const s=fixture();s.rows[0].z=.90;s.rows[1]={...s.rows[1],z:.82,shellTaken:0,power:'magnet'};
  s.rows[2]={...s.rows[2],z:.92,kind:'canoe'};
  const p=runPoses(s);
  expect(p[15].painterDepth).toBeLessThan(p[1].painterDepth!); // .82+.07 < .90
  expect(p[15].frame).toBeLessThan(p[1].frame!);
  expect(p[1].frame).toBeLessThan(p[5].frame!);
  expect(p[168].frame).toBeGreaterThan(10000); // .82+.23
  const actors=p.filter(x=>x.painterDepth!==undefined);
  expect(new Set(actors.map(x=>x.frame)).size).toBe(actors.length);
  for(const x of p)if(x.opacity===0)expect(x).toBe(HIDDEN_POSE);
 });
 it('breaks equal-depth ties by actor identity even after row slots move',()=>{
  const s=fixture();s.rows[0].z=.9;s.rows[1].z=.9;s.rows[1].kind='canoe';
  const a=runPoses(s).filter(p=>p.painterDepth!==undefined).map(p=>[p.painterKey,p.frame]).sort();
  [s.rows[0],s.rows[1]]=[s.rows[1],s.rows[0]];
  const b=runPoses(s).filter(p=>p.painterDepth!==undefined).map(p=>[p.painterKey,p.frame]).sort();
  expect(b).toEqual(a);
 });
 it('preserves recycle/snap identity, canonical hidden slots and fixed-step inputs',()=>{
  const s=fixture();s.rows[0].z=.9;s.rows[1].z=.82;s.rows[1].shellTaken=0;
  const a=runPoses(s);s.rows[0].serial+=100;s.rows[0].z=1.01;
  const b=runPoses(s);for(const p of b)Object.freeze(p);
  const rendered=interpolatePoses(a,b,.01);
  expect(rendered[1].painterDepth).toBe(b[1].painterDepth);
  expect(rendered[1].identity).toBe(b[1].identity);
  expect(rendered[1].frame).toBeGreaterThan(10000);
  expect(rendered[4]).toBe(HIDDEN_POSE);
  expect(b[15].frame).toBe(runPoses(s)[15].frame);
 });
 it('measures duck elevation from raised support rather than from the beach',()=>{
  const s=fixture();s.rows[0]={...s.rows[0],z:1,surface:'boardwalk',shellLane:1};
  const base=surfaceHeight(s.rows[0]);expect(base).toBeGreaterThan(0);
  expect(rowSafe({...s,duck:SLIDE_SECONDS,elevation:base+.079},s.rows[0])).toBe(true);
  expect(rowSafe({...s,duck:SLIDE_SECONDS,elevation:base+.081},s.rows[0])).toBe(false);
 });
 it('keeps a safe duck low during a lane change or lingering stumble recovery',()=>{
  const s={...fixture(),duck:SLIDE_SECONDS,cooldown:.1,lane:2,poseLane:1};
  expect(runnerFrame(s)).toBe(11);expect(runPoses(s)[0].angle).toBe(0);
 });
 it('sorts a moving actor crossing a different actor during interpolation',()=>{
  const s=fixture();s.rows[0].z=.88;s.rows[1].z=.82;s.rows[1].shellTaken=0;
  const a=runPoses(s);s.rows[0].z=.92;const b=runPoses(s);
  expect(interpolatePoses(a,b,.1)[1].frame).toBeLessThan(interpolatePoses(a,b,.1)[15].frame!);
  expect(interpolatePoses(a,b,.9)[1].frame).toBeGreaterThan(interpolatePoses(a,b,.9)[15].frame!);
 });
 for(const kind of ['net','banner','frond','line'] as const){
  it(`${kind}: keeps a late grounded duck safe and rejects excessive elevation`,()=>{
   const s=fixture();const row={...s.rows[0],kind};const frames=new Set<number>();
   // 120Hz plus both exact safe-window boundaries; test the highest allowed feet.
   for(const duck of [SLIDE_SECONDS,.080001,...Array.from({length:72},(_,i)=>SLIDE_SECONDS-i/120)]){
    const state={...s,duck,elevation:DUCK_MAX_ELEVATION-1e-6};
    if(!rowSafe(state,row))continue;
    const frame=runnerFrame(state);frames.add(frame);
   }
   expect([...frames].sort()).toEqual([11,12,13]);
   expect(rowSafe({...s,duck:SLIDE_SECONDS,elevation:DUCK_MAX_ELEVATION},row)).toBe(false);
   expect(rowSafe({...s,duck:.08},row)).toBe(false);
   // A last-fixed-step duck still succeeds at actual engine contact.
   s.rows[0]=row;const after=runStep(runTransition(s,{type:'duck'}),{type:'idle'},1/60);
   expect(after.rows[0].passed).toBe(true);expect(after.bumps).toBe(0);expect(runnerFrame(after)).toBe(11);
  });
 }
});
