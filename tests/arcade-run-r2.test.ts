import { describe, it, expect } from 'vitest';
import { CANOE_DEPTH, deckDepthFraction, visualRunHeight } from '../src/arcade/games/lagoon-run/geometry';
import { createRun, runStep, runTransition, type RunState } from '../src/arcade/games/lagoon-run/engine';
import { projectTrack } from '../src/arcade/games/lagoon-run/camera';
import { runLevels } from '../src/arcade/games/scrolling/content';
import { CANOE_START, runPoses } from '../src/arcade/games/scrolling/render';
const idle={type:'idle'} as const;
function hull(kind: 'canoe'|'moving-canoe',z:number) {
 const s=createRun(runLevels[0],42);
 s.rows=s.rows.map((r,i)=>({...r,z:i?-4:z,kind,lane:1,second:-1,third:false,shellLane:0,surface:'sand',passed:i?false:z>=1}));
 return s;
}
describe('Run round 2 art and collision agreement',()=>{
 it('foreshortens equal world-depth planks with exact end points',()=>{
  for(const near of [.6,.9,1.2])for(const far of [.2,.4])for(const u of [0,.1,.5,.9,1]) {
   const n=projectTrack(1.43,near),nl=projectTrack(.57,near),f=projectTrack(1.43,far),fl=projectTrack(.57,far);
   const t=deckDepthFraction(n.x-nl.x,f.x-fl.x,u);
   expect(n.y+(f.y-n.y)*t).toBeCloseTo(projectTrack(1,near+(far-near)*u).y,8);
  }
 });
 for(const kind of ['canoe','moving-canoe'] as const) {
  it(`${kind} blocks late entry until the full drawn hull clears`,()=>{
   for(const z of [1.02,1.12,1+CANOE_DEPTH-.015]) {
    const s=hull(kind,z),p=runPoses(s),a=p[CANOE_START],d=p[CANOE_START+3];
    expect(a.y).toBeGreaterThan(projectTrack(1,1).y);
    expect(d.y).toBeLessThan(projectTrack(1,1).y);
    expect(runStep(s,idle,1/120).bumps).toBe(1);
   }
   expect(runStep(hull(kind,1+CANOE_DEPTH+.001),idle,1/120).bumps).toBe(0);
   expect(runStep({...hull(kind,1.1),poseLane:0,lane:0,laneFrom:0},idle,1/120).bumps).toBe(0);
  });
  it(`${kind} can be avoided with legal lane input and scores a row once`,()=>{
   let s:RunState={...hull(kind,.96),poseLane:0,lane:0,laneFrom:0};
   for(let i=0;i<50;i++)s=runStep(s,idle,1/60);
   expect(s.bumps).toBe(0);expect(s.passed).toBe(1);
   let late={...hull(kind,1.08),poseLane:0,lane:0,laneFrom:0};
   late=runTransition(late,{type:'right'});
   for(let i=0;i<10;i++)late=runStep(late,idle,1/60);
   expect(late.bumps).toBe(1);
  });
 }
 it('checks a canoe in the second slot without repeating the point obstacle',()=>{
  const s=hull('canoe',1.1);s.rows[0]={...s.rows[0],kind:'rock',lane:0,second:1,secondKind:'canoe'};
  expect(runStep(s,idle,1/60).bumps).toBe(1);
  s.rows[0].secondKind='rock';expect(runStep(s,idle,1/60).bumps).toBe(0);
 });
 it('keeps kite, body and airborne shell inside the field using one height mapping',()=>{
  const s={...hull('canoe',.93),kite:6};s.rows[0].shellLane=1;s.rows[0].sky=true;
  const p=runPoses(s),h=visualRunHeight(2.7),shell=p[12];
  expect(p[0].y).toBeGreaterThan(150);expect(p[172].y).toBeGreaterThan(150);
  expect(p[0].y+130).toBeCloseTo(projectTrack(1,1).y-h*85);
  expect(shell.y+15+15*(shell.scale??1)).toBeCloseTo(projectTrack(1,1).y-h*85);
  expect(p[50].y+7).toBeCloseTo(projectTrack(1,1).y);
  expect(runStep(s,idle,1/60).rows[0].shellTaken&2).toBe(2);
 });
});
