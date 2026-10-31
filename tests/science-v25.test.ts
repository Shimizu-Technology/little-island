import { expect, it } from 'vitest';
import { learnIds } from '../src/learn/types';
import { engines } from '../src/learn/engines';
import { startSession, outcomeOf, validLearnSession } from '../src/learn/session';
import { growthMove, growthProgress, growthQuestions } from '../src/learn/growth/engine';
import type { GrowthState } from '../src/learn/growth/types';
import { taskAt as pattern, type PatternState } from '../src/learn/games/pattern-path/engine';
import { taskAt as shape, type ShapeState } from '../src/learn/games/shape-shift/engine';
import { hint, taskAt as logic, type LogicState } from '../src/learn/games/logic-lagoon/engine';
import speech from '../scripts/learn/science-v25.json';
import { tasks, wrongFeedback, goalTranscript, scienceSpeechKey } from '../src/learn/games/weather-watch/model';
import { missions } from '../src/learn/games/tide-pool/engine';

it('helped correct answers tie across every scored growth game and both stages, preserving assistance', () => {
 for (const game of learnIds.filter(id => !engines[id].ownLevels && engines[id].modes.includes('versus'))) for (const stage of ['stretch','deep'] as const) for (const starter of [0,1] as const) {
  let s = startSession(game, { options: {mode:'versus',pace:'easy',stage}, starter }, {}, 25);
  const qs = growthQuestions(game,s.options,s.state as GrowthState);
  for (const [i,q] of qs.entries()) {
   let state=s.state as GrowthState;
   if(i===0) state=growthMove(state,{type:'help'},qs);
   state=growthMove(state,{type:'answer',value:q.answer},qs);
   s={...s,state:growthMove(state,{type:'next'},qs)};
  }
  expect(growthProgress(s.state as GrowthState,qs).clean).toEqual([false,true,true,true]);
  expect(outcomeOf(s)).toBe('draw'); expect(validLearnSession(s),game).toBe(true);
 }
});
it('pattern choices distribute the answer across positions and retain one answer',()=>{
 for(let level=1;level<=5;level++) {
  const positions=new Set<number>();
  for(let seed=0;seed<100;seed++)for(let index=0;index<4;index++) {
   const t=pattern({version:1,level,seed,index,total:4,helped:false});
   expect(t.choices.filter(v=>v===t.answer)).toHaveLength(1); positions.add(t.choices.indexOf(t.answer));
  }
  expect(positions.size).toBeGreaterThan(2);
 }
});
it('matrix hints describe actual size and number rules',()=>{
 const s:PatternState={version:1,level:4,seed:17,index:3,total:4,helped:false};
 expect(pattern(s).hint).toMatch(/size|larger/); expect(pattern(s).hint).not.toContain('dot');
 const t=pattern({...s,level:5});for(let i=0;i<9;i++){if(i%3<2)expect(+t.tiles[i+1]- +t.tiles[i]).toBe(1);if(i<6)expect(+t.tiles[i+3]- +t.tiles[i]).toBe(2);}
});
it('shape help names only controls available at that level',()=>{
 const s:ShapeState={version:1,level:1,seed:2,index:0,total:4,helped:false,placed:[]};
 expect(shape(s).hint).not.toMatch(/turn|flip/i);expect(shape({...s,level:2}).hint).not.toMatch(/flip/i);
});
it('logic help provides a reason without entering the answer',()=>{
 for(let level=1;level<=5;level++)for(let seed=0;seed<20;seed++) {
  const s:LogicState={version:1,level,seed,index:0,total:4,entries:[],helped:false}; const h=hint(s);
  expect(h.reason.length).toBeGreaterThan(20);expect(h.state.entries).toEqual([]);
  const t=logic(s);if(t.kind==='grid')expect(h.value).toBe(t.solution[h.cell]);
 }
});
it('wrong feedback addresses each science task, not generic chain advice',()=>{
 for(const game of ['weather-watch','food-web','space-station'] as const)for(let level=1;level<=5;level++)for(const q of tasks(game,level,17)) {
  expect(wrongFeedback(q,[]).length).toBeGreaterThan(20);
 }
 expect(wrongFeedback(tasks('weather-watch',1,1)[0],[2])).toMatch(/coat|warmth/i);
 expect(wrongFeedback(tasks('food-web',1,1)[0],[2])).toMatch(/plastic/i);
 expect(wrongFeedback(tasks('space-station',1,1)[0],[1])).toMatch(/away|night/i);
});
it('coral explanation teaches suitable temperature, including cold stress',()=>{
 expect(missions.find(m=>m.id==='coral')!.why).toMatch(/too hot or too cold/);
});

it('registers every seeded science goal, fact and retry explanation for narration',()=>{
 const lines:Record<string,string>=speech;
 for(const game of ['weather-watch','food-web','space-station'] as const)for(let level=1;level<=5;level++)for(let seed=0;seed<30;seed++)for(const q of tasks(game,level,seed)) {
  for(const text of [goalTranscript(q),q.fact,...Array.from({length:Math.max(q.labels.length,1)},(_,i)=>wrongFeedback(q,[i]))]) expect(lines[scienceSpeechKey(text)]).toBe(text);
 }
});
