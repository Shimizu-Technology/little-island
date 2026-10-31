import { describe, expect, it } from 'vitest';
import { createRun, rowSafe, runStep, runTransition, SLIDE_SECONDS } from '../src/arcade/games/lagoon-run/engine';
import { HIDDEN_POSE, interpolatePose } from '../src/arcade/poses';
import { runLevels } from '../src/arcade/games/scrolling/content';
import { runPoses, POWER_AURA, RUN_SLOTS } from '../src/arcade/games/scrolling/render';
import { runnerFrame, RUN_EXTRA } from '../src/arcade/games/scrolling/character';

describe('Run v5 visual contact contract',()=>{
 it('orders a hazard behind then in front at the exact collision plane, without opacity tween or duplicate slots',()=>{
  const s=createRun(runLevels[0],42);s.rows[0]={...s.rows[0],z:.999,kind:'net',lane:1,second:-1,third:false};
  const back=runPoses(s)[1];s.rows[0].z=1.001;const front=runPoses(s)[1];
  expect(back.frame).toBeLessThan(10000);expect(front.frame).toBeGreaterThan(10000);
  expect(interpolatePose(back,front,.01).frame).toBeLessThan(10000);
  expect(interpolatePose(back,front,.99).frame).toBeGreaterThan(10000);
  expect(front.identity).toBe(back.identity);
 });
 it('keeps painter ranks stable between crossings and sorts recycled rows by depth',()=>{
  const s=createRun(runLevels[0],42);s.rows=s.rows.map((r,i)=>({...r,z:[.8,.4,.6,.2,.1][i]}));
  const a=runPoses(s);const b=runPoses({...s,rows:s.rows.map(r=>({...r,z:r.z+.01}))});
  for(let i=0;i<5;i++)expect(b[1+i*2].frame).toBe(a[1+i*2].frame);
  expect(a[1].frame).toBeGreaterThan(a[5].frame!);expect(a[5].frame).toBeGreaterThan(a[3].frame!);
  const hidden=runPoses(createRun(runLevels[0],42));for(const pose of hidden)if(pose.opacity===0)expect(pose).toBe(HIDDEN_POSE);
 });
 it('matches the beam clearance with a low roll throughout contact and recovers cleanly',()=>{
  let s=createRun(runLevels[0],42);s.rows=s.rows.map((r,i)=>({...r,z:i?-4:.9,kind:'net',lane:1,second:-1,third:false}));
  s=runTransition(s,{type:'duck'});let contacts=0;
  for(let i=0;i<50;i++){s=runStep(s,{type:'idle'},1/60);if(s.rows[0].z>=.99&&s.rows[0].z<=1.01){contacts++;expect(rowSafe(s,s.rows[0])).toBe(true);expect(runnerFrame(s)).toBe(12);}}
  expect(contacts).toBeGreaterThan(0);expect(s.bumps).toBe(0);expect(s.duck).toBe(0);
  const beam={...s.rows[0],kind:'net' as const,lane:1,second:-1,third:false,surface:'sand' as const};
  expect(rowSafe({...s,duck:SLIDE_SECONDS},beam)).toBe(true);
  expect(rowSafe({...s,duck:0},beam)).toBe(false);
 });
 it('provides sixteen evenly timed run poses and keeps inactive slots canonical',()=>{
  const s=createRun(runLevels[0],42);const frames=new Set<number>();for(let i=0;i<16;i++){s.time=i/16;frames.add(runnerFrame(s));}
  expect(frames.size).toBe(16);s.time=1/16;const p=runPoses(s);expect(p.length).toBe(RUN_SLOTS);
  expect(p[RUN_EXTRA]).not.toBe(HIDDEN_POSE);expect(p[80]).toBe(HIDDEN_POSE);expect(p[81]).toBe(HIDDEN_POSE);
  expect(runPoses(s)[80]).toBe(p[80]);
 });
 it('ties runner effects to their own powers and keeps shadows grounded while airborne',()=>{
  const s={...createRun(runLevels[0],42),magnet:8,sandals:10,kite:6,shield:true};const p=runPoses(s);
  expect(p[POWER_AURA].opacity).toBeGreaterThan(0);expect(p[POWER_AURA+1].opacity).toBe(1);expect(p[172].opacity).toBe(1);expect(p[173].opacity).toBeGreaterThan(0);
  const plain=runPoses({...s,magnet:0,sandals:0,kite:0,shield:false});expect(plain[POWER_AURA].opacity).toBe(0);expect(plain[POWER_AURA+1].opacity).toBe(0);expect(p[50].y).toBe(plain[50].y);
  expect(p[57].y).toBeLessThan(150);
 });
});
