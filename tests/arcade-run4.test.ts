import { describe, expect, it } from 'vitest';
import { HAZARDS, RUN_CHUNKS, validateChunkSequence } from '../src/arcade/games/lagoon-run/course';
import { collectPower, createRun, jumpHeight, rowSafe, runResult, runStep, runTransition, surfaceHeight, validRun, type RunState } from '../src/arcade/games/lagoon-run/engine';
import { runFixture } from '../src/arcade/games/lagoon-run/fixtures';
import { runPoses } from '../src/arcade/games/scrolling/render';
import { runLevels } from '../src/arcade/games/scrolling/content';
const idle = {type:'idle'} as const, dt=1/60;
function ticks(s:RunState,n:number){for(let i=0;i<n;i++)s=runStep(s,idle,dt);return s;}
describe('Lagoon Run v4 course contract',()=>{
  it('teaches jump, roll, lane in W1-1 and introduces each mechanic at an authored level',()=>{
    expect(createRun(runLevels[0],1).rows.slice(0,3).map(r=>r.action)).toEqual(['jump','duck','idle']);
    for(const c of RUN_CHUNKS.filter(c=>c.unlock>1&&c.id!=='crab-crossing')) {
      const s=createRun(runLevels[c.unlock-1],14);
      expect(s.rows[0].chunk,c.id).toBe(c.id);
    }
  });
  it('validates all 56 levels at maximum speed without depending on powers',()=>{
    for(const l of runLevels)expect(validateChunkSequence(RUN_CHUNKS.filter(c=>c.unlock<=l.rank*8+l.index&&c.difficulty<=l.rank),l.speed*1.18*1.12,l.spacing),l.id).toBe(true);
    const impossible={...RUN_CHUNKS[0],beats:[{...RUN_CHUNKS[0].beats[2],lane:0,second:1,shellLane:2,third:true,kind:'wall' as const,secondKind:'wall' as const}]};
    expect(validateChunkSequence([impossible],.5,.72)).toBe(false);
    expect(validateChunkSequence(RUN_CHUNKS,2,.1)).toBe(false);
  });
  it('replays legal three-star fixtures for every level, with Helper on and off',()=>{
    for(const helper of [false,true])for(const l of runLevels){const f=runFixture(l,771,helper);expect(f.result?.stars,`${l.id} helper=${helper} shells=${f.state.shells} hits=${f.state.bumps}`).toBe(3);expect(validRun(f.state),l.id).toBe(true);}
  },20000);
  it('survives seeded endless courses and keeps bounded validated state',()=>{
    for(let seed=1;seed<=24;seed++){const f=runFixture('endless',seed,false,18000);expect(f.state.bumps,`seed ${seed}`).toBe(0);expect(f.state.passed).toBeGreaterThan(200);expect(validRun(f.state)).toBe(true);}
  },20000);
  it('keeps authored contact spacing when moving canoes and coconuts approach faster',()=>{
    let s=createRun(runLevels[6],771);const contacts:number[]=[];
    for(let i=0;i<5000&&contacts.length<12;i++){
      const before=s.rows.filter(r=>!r.passed).sort((a,b)=>b.z-a.z)[0];
      s=runStep({...s,protection:1.2},{type:'idle'},dt);
      if(before&&!before.passed&&s.rows.some(r=>r.serial===before.serial&&r.passed))contacts.push(s.time);
    }
    for(let i=1;i<contacts.length;i++)expect(contacts[i]-contacts[i-1]).toBeGreaterThanOrEqual(.67);
  });
  it('uses the catalogue for every collision silhouette',()=>{
    const base=createRun(runLevels[0],1),row={...base.rows[0],lane:1,second:-1,third:false,surface:'sand' as const};
    for(const [kind,action] of Object.entries(HAZARDS)) {
      const r={...row,kind:kind as keyof typeof HAZARDS};expect(rowSafe(base,r),kind).toBe(false);
      expect(rowSafe({...base,lane:0,poseLane:0},r)).toBe(true);
      const moved=ticks(runTransition(base,{type:action==='jump'?'jump':'duck'}),10);
      expect(rowSafe(moved,r),kind).toBe(action!=='lane');
    }
  });
  it('climbs ramps, runs on roofs, bridges gaps, drops off edges and fast-drops from jumps',()=>{
    const base=createRun(runLevels[1],1),r={...base.rows[0],surface:'ramp' as const,z:.93};
    expect(surfaceHeight(r)).toBeGreaterThan(.5);expect(surfaceHeight({...r,z:1})).toBe(.85);expect(surfaceHeight({...r,z:1.9})).toBe(0);
    expect(surfaceHeight({...r,surface:'gap',z:1.1})).toBe(0);
    let s=ticks({...base,rows:[{...r,z:.82},...base.rows.slice(1)]},30);expect(s.elevation).toBeCloseTo(.85);
    const drop=runTransition({...s,jump:.3},{type:'duck'});expect(drop.jump).toBe(0);expect(drop.fastDrop).toBe(true);
    s=ticks({...s,rows:s.rows.map(row=>({...row,surface:'sand'}))},60);expect(s.elevation).toBe(0);
  });
  it('times powers, magnetizes individual shells, flies, lands protected and absorbs exactly one hit',()=>{
    let s=createRun(runLevels[0],1);
    s=collectPower(s,'magnet');expect(s.magnet).toBe(8);
    const row={...s.rows[0],z:.855,shellLane:0};s=runStep({...s,rows:[row,...s.rows.slice(1)]},idle,dt);expect(s.shells).toBe(1);
    s=collectPower(s,'kite');expect(jumpHeight(s)).toBe(2.7);expect(rowSafe(s,{...row,lane:1})).toBe(true);
    s=runStep({...s,kite:.01},idle,dt);expect(s.protection).toBe(1.2);
    s=collectPower({...createRun(runLevels[0],1),protection:0},'sandals');const jump=ticks(runTransition(s,{type:'jump'}),24);expect(jumpHeight(jump)).toBeCloseTo(2);
    const shield=collectPower(createRun(runLevels[0],1),'shield'),hit=runStep({...shield,rows:shield.rows.map((r,i)=>i?r:{...r,z:1})},idle,dt);
    expect(hit.shield).toBe(false);expect(hit.lives.hearts).toBe(3);expect(hit.bumps).toBe(0);
  });
  it('keeps boosts through an airborne expiry and cannot jump again while falling or gliding',()=>{
    const s=collectPower(createRun(runLevels[0],1),'sandals');
    const jump=runTransition({...s,sandals:.05},{type:'jump'}),air=ticks(jump,24);
    expect(air.sandals).toBe(0);expect(jumpHeight(air)).toBeCloseTo(2);
    const drop=runTransition(air,{type:'duck'});expect(drop.elevation).toBeCloseTo(2);
    expect(runTransition(drop,{type:'jump'})).toBe(drop);
    expect(runTransition(collectPower(s,'kite'),{type:'jump'}).jump).toBe(0);
  });
  it('expires timed powers, preserves a shield during heart protection, and spends it once',()=>{
    let s=collectPower(createRun(runLevels[0],1),'shield');
    const contact=(v:RunState)=>({...v,rows:v.rows.map((r,i)=>i?r:{...r,z:1,passed:false})});
    s=runStep(contact({...s,lives:{...s.lives,invulnerable:.5}}),idle,dt);expect(s.shield).toBe(true);
    s=runStep(contact({...s,lives:{...s.lives,invulnerable:0}}),idle,dt);expect(s.shield).toBe(false);expect(s.lives.hearts).toBe(3);
    s=runStep(contact({...s,protection:0}),idle,dt);expect(s.lives.hearts).toBe(2);
    let powers=collectPower(collectPower(createRun(runLevels[0],1),'magnet'),'sandals');
    powers=ticks({...powers,magnet:.05,sandals:.05},4);expect(powers.magnet).toBe(0);expect(powers.sandals).toBe(0);
  });
  it('only teaches steering when the current lane needs to change, then retires the hint',()=>{
    const base=createRun(runLevels[1],1),s={...base,rows:base.rows.map((r,i)=>({...r,z:i===0?.6:r.z}))};
    expect(runPoses(s)[57].opacity).toBe(0);
    const blocked={...s,lane:0,poseLane:0,laneFrom:0};expect(runPoses(blocked)[57].opacity).toBe(1);
    expect(runPoses(runTransition(blocked,{type:'right'}))[57].opacity).toBe(0);
  });
  it('rejects malformed powers and layers; keeps input immutable and does not persist runtime',()=>{
    const s=createRun(runLevels[0],1),raw=JSON.stringify(s);expect(validRun(s)).toBe(true);runStep(s,idle,dt);expect(JSON.stringify(s)).toBe(raw);
    for(const patch of [{magnet:NaN},{kite:7},{shield:1},{elevation:Infinity},{learned:8},{serial:-1},{jumpDuration:0},{extra:1}])expect(validRun({...s,...patch})).toBe(false);
    expect(validRun({...s,rows:s.rows.map((r,i)=>i?r:{...r,chunk:'invented'})})).toBe(false);
    expect(runResult(s)).toBeNull();
  });
});
