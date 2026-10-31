import { describe, expect, it } from 'vitest';
import { createRun, runTransition, shellHeight, validRun } from '../src/arcade/games/lagoon-run/engine';
import { CAMERA_SLOT } from '../src/arcade/games/lagoon-run/camera';
import { runLevels } from '../src/arcade/games/scrolling/content';
import { runPoses, RUN_SLOTS } from '../src/arcade/games/scrolling/render';
import { interpolatePoses } from '../src/arcade/poses';

describe('Lagoon harbor presentation',()=>{
 it('keeps the camera visible at low speed and Reduce Motion through interpolation',()=>{
  const s=createRun(runLevels[0],42),a=runPoses(s,true),b=runPoses({...s,time:.5,travel:.1},true);
  expect(a).toHaveLength(RUN_SLOTS);expect(CAMERA_SLOT).toBe(RUN_SLOTS-1);
  for(const alpha of [0,.5,1])expect(interpolatePoses(a,b,alpha)[CAMERA_SLOT]).toMatchObject({x:0,y:0,angle:0,opacity:1,scale:0});
  expect(runPoses(s)[CAMERA_SLOT].opacity).toBe(1);
 });
 it('leans toward lane input, settles and suppresses shake/lines for Reduce Motion',()=>{
  const s=runTransition(createRun('endless',42),{type:'right'}),p=runPoses(s)[CAMERA_SLOT];
  expect(p.x).toBeLessThan(0);expect(p.angle).toBeGreaterThan(0);expect(p.scale).toBeGreaterThan(0);
  expect(runPoses({...s,poseLane:s.lane})[CAMERA_SLOT].angle).toBe(0);
  const hit={...s,cooldown:.3,time:.031};expect(Math.abs(runPoses(hit)[CAMERA_SLOT].y)).toBeGreaterThan(0);
  expect(runPoses(hit,true)[CAMERA_SLOT]).toMatchObject({x:0,y:0,angle:0,scale:0});
 });
 it('keeps pass feedback inside the right edge after a lane change',()=>{
  const s={...createRun(runLevels[0],42),poseLane:2,lane:2,feedback:.45,lastGain:10,cue:'step' as const};
  expect(runPoses(s)[56].x+80).toBeLessThanOrEqual(382);
 });
 it('preserves saves and shell arcs from the rules rather than inventing visual pickup heights',()=>{
  const s=createRun(runLevels[0],42),before=JSON.stringify(s);s.rows[0]={...s.rows[0],z:.7,action:'jump',surface:'sand',sky:false};
  const heights=[0,1,2].map(c=>shellHeight(s.rows[0],c));expect(heights[1]).toBeGreaterThan(heights[0]);expect(heights[1]).toBeGreaterThan(heights[2]);
  const modified=JSON.stringify(s);runPoses(s);expect(JSON.stringify(s)).toBe(modified);expect(validRun(JSON.parse(before))).toBe(true);
 });
});

it('reveals real upcoming trails and hazards before the old zero-depth cutoff without changing rules',()=>{
 const s=createRun(runLevels[0],42),before=JSON.stringify(s);
 const p=runPoses(s);
 expect(s.rows[1].z).toBeLessThan(0);
 expect(p[13+1]).not.toMatchObject({opacity:0});
 expect(p[3].opacity).toBeGreaterThan(0);
 expect(p[3].painterDepth).toBeLessThan(p[1].painterDepth!);
 expect(JSON.stringify(s)).toBe(before);
});
it('uses the existing landing lifetime for dust and removes it for Reduce Motion',()=>{
 const s={...createRun(runLevels[0],42),landing:.13};
 expect(runPoses(s)[55].opacity).toBe(1);
 expect(runPoses({...s,landing:0})[55].opacity).toBe(0);
 expect(runPoses(s,true)[55].opacity).toBe(0);
});

it('keeps the enlarged hero inside both outer lanes with optical camera follow',()=>{
 for(const lane of [0,1,2]){
  const s={...createRun(runLevels[0],42),lane,poseLane:lane},p=runPoses(s);
  const centre=195+(p[0].x+40-195)*1.7+p[CAMERA_SLOT].x;
  expect(centre-40*1.7).toBeGreaterThan(0);
  expect(centre+40*1.7).toBeLessThan(390);
 }
});
