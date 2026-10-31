import {describe,it,expect} from 'vitest';
import {engine as beep,makePuzzle,solves as botSolves,trace,advance} from '../src/learn/games/beep-bot/engine';
import {engine as turtle,task,solves as turtleSolves,draw,initialProgram,validBlock} from '../src/learn/games/turtle-draw/engine';
import {optionsAtLevel} from '../src/learn/levels';
import {badgesFor,grantsFor,learningTrack} from '../src/badges/engine';
const options=(level:1|2|3|4|5)=>optionsAtLevel({mode:'solo',pace:'easy'},level);
const ctx={skills:{},rng:()=>.25,starter:0 as const,today:20000};
describe('Coding island engines',()=>{
 for(const level of [1,2,3,4,5] as const)it(`Beep Bot level ${level} solves four distinct tasks, validates, and finishes`,()=>{
  const o=options(level);let s=beep.create(o,ctx);expect(beep.validate(s,o)).toBe(true);expect(beep.validate(JSON.parse(JSON.stringify(s)),o)).toBe(true);
  expect(new Set(s.puzzles.map(p=>JSON.stringify({start:p.start,shell:p.shell,rocks:p.rocks,answer:p.answer}))).size).toBe(4);
  for(const p of s.puzzles){expect(botSolves(p,p.answer)).toBe(true);expect(trace(p,p.answer).at(-1)).toBe(p.shell);if(level>=3)expect(p.rocks.length).toBeGreaterThan(0);}
  if(level===4)expect(botSolves(s.puzzles[0],s.program)).toBe(false);
  for(let i=0;i<4;i++){s={...s,program:s.puzzles[i].answer,cursor:s.puzzles[i].answer.length};s=advance(s);expect(beep.validate(s,o)).toBe(true);}
  expect(beep.outcome(s,o)).toBe('done');expect(beep.validate({...s,version:2},o)).toBe(false);
 });
 for(const level of [1,2,3,4,5] as const)it(`Turtle Draw level ${level} traces four goals with valid blocks`,()=>{
  const o=options(level);let s=turtle.create(o,ctx);expect(turtle.validate(s,o)).toBe(true);expect(turtle.validate(JSON.parse(JSON.stringify(s)),o)).toBe(true);
  for(const t of s.tasks){expect(t.target.every(b=>validBlock(b))).toBe(true);expect(turtleSolves(t,t.target)).toBe(true);expect(draw(t.target)?.length).toBeGreaterThan(0);}
  if(level===5)expect(s.tasks.some(t=>t.debug&& !turtleSolves(t,initialProgram(t)))).toBe(true);
  s={...s,done:4,completed:s.tasks.map(t=>t.target),program:[],cursor:0};expect(turtle.outcome(s,o)).toBe('done');expect(turtle.validate({...s,tasks:[...s.tasks,{...task(level,9),seed:-1}]} as typeof s,o)).toBe(false);
 });
 it('repeat cards show the total number of moves they make',()=>{
  const p={start:0,shell:4,rocks:[],answer:[] as ('right'|'repeat2'|'repeat3')[],seed:0};
  expect(trace(p,['right','repeat2']).at(-1)).toBe(2);
  expect(trace(p,['right','repeat3']).at(-1)).toBe(3);
 });
 it('rejects malformed saved puzzles without throwing',()=>{
  const o=options(1), s=beep.create(o,ctx);
  const malformed={...s,done:1,completed:[s.puzzles[0].answer],puzzles:[null,...s.puzzles.slice(1)]};
  expect(()=>beep.validate(malformed,o)).not.toThrow();
  expect(beep.validate(malformed,o)).toBe(false);
 });
 it('varies Beep layouts and keeps Turtle goals within the sand canvas',()=>{
  for(let base=0;base<100;base++)for(const level of [1,2,3,4,5]){
   const puzzles=Array.from({length:4},(_,i)=>makePuzzle(level,(base+i*7)%10000));
   expect(new Set(puzzles.map(p=>JSON.stringify({start:p.start,shell:p.shell,rocks:p.rocks,answer:p.answer}))).size).toBe(4);
   expect(puzzles.every(p=>botSolves(p,p.answer))).toBe(true);
  }
  for(const level of [2,3,4]){
   const bank=new Set(Array.from({length:80},(_,seed)=>JSON.stringify({start:makePuzzle(level,seed).start,answer:makePuzzle(level,seed).answer})));
   expect(bank.size).toBeGreaterThanOrEqual(12);
  }
  for(let seed=0;seed<30;seed++){
   const segments=draw(task(4,seed).target)!;
   for(const segment of segments)for(const point of [segment.from,segment.to]){
    expect(point.x).toBeGreaterThanOrEqual(-40);expect(point.x).toBeLessThanOrEqual(340);
    expect(point.y).toBeGreaterThanOrEqual(-45);expect(point.y).toBeLessThanOrEqual(255);
   }
  }
 });
 it('difficulty rises and malformed programs fail',()=>{
  expect(makePuzzle(1,1).answer.length).toBeLessThan(makePuzzle(4,1).answer.length);
  expect(makePuzzle(5,1).answer).toContain('repeat2');
  expect(task(5,1).limit).toBeLessThan(task(2,1).limit);
  expect(task(4,1).target[0].kind).toBe('repeat');
  expect(validBlock({kind:'repeat',times:999,body:[]})).toBe(false);
 });
 it('Coding milestones grant the four rewards, and Crab history moves tracks',()=>{
  expect(['beep-bot','crab-commands','turtle-draw','tide-logic','code-lab'].every(id=>learningTrack[id]==='coding')).toBe(true);
  expect(badgesFor(['learn:crab-commands:5'])).toContain('coding-4');
  expect(badgesFor(['learn:crab-commands:5'])).not.toContain('science-1');
  expect(grantsFor(['coding-1','coding-2','coding-3','coding-4'])).toEqual(expect.arrayContaining(['outfit:robot-tee','robot-buddy','accessory:coder-headset','computer-desk']));
 });
});
