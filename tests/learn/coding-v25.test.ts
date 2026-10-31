import { execution as botExecution, trace, makePuzzle } from '../../src/learn/games/beep-bot/engine';
import { optionsAtLevel, type LearningLevel } from '../../src/learn/levelOptions';

import { describe, expect, it } from 'vitest';
import { execute, executionOutput, executionPlan, taskAt as labTask } from '../../src/learn/games/code-lab/engine';
import { counterAt, engine as tide, advance as tideAdvance, taskAt as tideTask, matches, route } from '../../src/learn/games/tide-logic/engine';
import { canWrap, wrapIssue, programIssue, replaceBlock, drawingFeedback, task as turtleTask, type Block, validBlock } from '../../src/learn/games/turtle-draw/engine';
describe('2.5 coding regressions', () => {
  it('visits a function body once, regardless of its argument', () => {
    expect(executionPlan(labTask(3, 0, 0), '')).toEqual([0, 2, 1]);
    expect(executionPlan(labTask(3, 0, 1), '3')).toEqual([0, 2, 1]);
    expect(executionPlan(labTask(5, 0, 3), '3')).toEqual([0, 2, 1]);
    expect(executionPlan(labTask(2, 0, 2), '')).toEqual([0, 1, 1, 1, 2]);
  });
  it('distinguishes AND from OR with all four clue combinations on every belt', () => {
    for (let seed = 0; seed < 1000; seed++) for (let index = 0; index < 4; index++) {
      const t = tideTask(3, seed, index);
      expect(new Set(t.items.map(i => `${matches(i,t.target.first)},${matches(i,t.target.second)}`)).size).toBe(4);
      expect(t.items.some(i => route(i,t.target) !== route(i,{...t.target,join:t.target.join==='and'?'or':'and'}))).toBe(true);
    }
  });
  it('preserves the eight-child loop validation boundary', () => {
    expect(validBlock({kind:'repeat',times:2,body:Array(9).fill({kind:'forward',n:60})})).toBe(false);
  });
});

describe('2.5 execution, editing and resume', () => {
  it('derives all authored robot effects, text and watched values from execution', () => {
    for(let level=1;level<=5;level++) for(let index=0;index<4;index++) {
      const t=labTask(level,0,index),frames=execute(t,t.answer);
      expect(frames.at(-1)?.robot).toBe(t.robot);
      expect(executionOutput(frames)).not.toContain('undefined');
    }
    const fn=execute(labTask(3,0,1),'3');
    expect(fn.map(f=>f.robot)).toEqual([0,0,3]);
    expect(fn[1].watch.times).toBe(3);
    expect(executionOutput(fn)).toBe('3 jumps');
    const loop=execute(labTask(2,0,2),'');
    expect(loop.map(f=>f.robot)).toEqual([0,1,2,3,3]);
    expect(loop.slice(1,4).map(f=>f.watch.i)).toEqual([0,1,2]);
    expect(execute(labTask(2,0,0),'').map(f=>f.watch.score)).toEqual([0,1,1]);
    expect(execute(labTask(5,0,1),'').at(-1)?.output).toEqual(['6']);
    expect(execute(labTask(5,0,0),'0').at(-1)?.output).toEqual(['Fizz']);
  });
  it('counts processed catches exactly once and reconstructs after reload', () => {
    const o=optionsAtLevel({mode:'solo',pace:'easy'},4 as LearningLevel);
    let s={...tide.create(o,{skills:{},rng:()=>0,starter:0,today:0}),index:1};
    const t=tideTask(4,0,1); s={...s,rule:t.target,running:0};
    let expected=0;
    for(const item of t.items) {
      expect(counterAt(s)).toBe(expected);
      if(route(item,t.target)==='left')expected++;
      s=tideAdvance(s);
      expect(tide.validate(JSON.parse(JSON.stringify(s)),o)).toBe(true);
      expect(counterAt(JSON.parse(JSON.stringify(s)))).toBe(expected);
    }
    expect(expected).toBeGreaterThan(0);
  });
  it('loads original version-1 belts unchanged and upgrades on the next belt', () => {
    const o=optionsAtLevel({mode:'solo',pace:'easy'},3 as LearningLevel);
    const created=tide.create(o,{skills:{},rng:()=>0,starter:0,today:0});
    const legacy=tideTask(3,0,0,1),original={...created,version:1 as const,rule:{...legacy.target,join:'or'},running:legacy.items.length};
    expect(tide.validate(original,o)).toBe(true);
    expect(tideTask(3,0,0,1).items).toEqual(legacy.items);
    const next=tideAdvance(original);
    expect(next.version).toBe(2);expect(tide.validate(next,o)).toBe(true);
    expect(original.version).toBe(1); // input is preserved
  });
  it('explains wrap refusal at body, nesting and expansion limits', () => {
    const f:Block={kind:'forward',n:60};
    expect(canWrap(Array(8).fill(f),2)).toBe(true);
    expect(canWrap(Array(9).fill(f),2)).toBe(false);
    expect(wrapIssue(Array(9).fill(f),2)).toContain('8 blocks');
    expect(canWrap([{kind:'repeat',times:2,body:[{kind:'repeat',times:2,body:[f]}]}],2)).toBe(false);
    expect(wrapIssue([{kind:'repeat',times:8,body:[f,f,f]}],8)).toContain('120');
    expect(wrapIssue([],2)).toContain('Add a block');
  });
  it('repairs a turn inside a loop while preserving the surrounding program', () => {
    const original:Block[]=[{kind:'repeat',times:3,body:[{kind:'forward',n:60},{kind:'turn',angle:90}]}];
    const fixed=replaceBlock(original,[0,1],{kind:'turn',angle:120});
    expect(programIssue(fixed)).toBe(null);
    expect(fixed).toEqual(turtleTask(5,0).target);
    expect(original[0]).toMatchObject({body:[{kind:'forward',n:60},{kind:'turn',angle:90}]});
  });
  it('identifies too long, too short and wrong direction at the first differing line', () => {
    expect(drawingFeedback(turtleTask(1,0),[{kind:'forward',n:70}])).toEqual({segment:0,message:'Line 1 is too long: 70 units. Try 60 units.'});
    expect(drawingFeedback(turtleTask(1,2),[{kind:'forward',n:60}]).message).toContain('too short');
  });
  it('keeps Beep at its last legal cell and identifies the failing card, including partial repeats', () => {
    const p={start:0,shell:24,rocks:[],answer:[],seed:0};
    expect(botExecution(p,['up'])).toEqual({path:[0,-1],pos:0,failedCard:0});
    expect(botExecution(p,['right','up']).failedCard).toBe(1);
    expect(botExecution({...p,start:3},['right','repeat3']).pos).toBe(4);
    expect(botExecution({...p,start:2},['right','repeat3']).pos).toBe(4);
    expect(botExecution({...p,rocks:[1]},['right']).pos).toBe(0);
    for(let level=1;level<=5;level++)for(let seed=0;seed<100;seed++) {
      const puzzle=makePuzzle(level,seed);expect(trace(puzzle,puzzle.answer).at(-1)).toBe(puzzle.shell);
    }
  });
});
