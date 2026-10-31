import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { optionsAtLevel } from '../src/learn/levels';
import { engine as pattern, taskAt as patternTask, place as patternPlace } from '../src/learn/games/pattern-path/engine';
import { Board as PatternBoard } from '../src/learn/games/pattern-path/view';
import { engine as shape, taskAt as shapeTask, place as shapePlace, chooseCube, normalize, rotate, flip } from '../src/learn/games/shape-shift/engine';
import { Board as ShapeBoard } from '../src/learn/games/shape-shift/view';
import { engine as logic, taskAt as logicTask, enter, solutionCount } from '../src/learn/games/logic-lagoon/engine';
import { Board as LogicBoard } from '../src/learn/games/logic-lagoon/view';
import type { BoardProps, LearnOptions } from '../src/learn/types';
const { Pass } = vi.hoisted(() => ({ Pass: ({ children }: { children?: unknown }) => children as never }));
vi.mock("../src/components/motion", () => ({ useReducedMotion: () => true }));
vi.mock('react-native', () => ({ View: Pass, ScrollView: Pass, Platform: { OS: 'web' } }));
vi.mock('react-native-svg', () => ({ default: Pass, Circle: Pass, Ellipse: Pass, Path: Pass, Rect: Pass }));
vi.mock('../src/components/ui', () => ({ C: { ink: '#123' }, Copy: Pass, PressableScale: Pass }));
const base: LearnOptions={mode:'solo',pace:'easy'};
const context=(seed:number)=>({rng:()=>seed/0xffffffff,skills:{},starter:0 as const,today:0});
const props=<S,>(game:'pattern-path'|'shape-shift'|'logic-lagoon',state:S,options:LearnOptions):BoardProps<S>=>({session:{game,version:1,id:'test',revision:0,options,state},update:()=>{},practice:()=>{},skills:{},sound:()=>{},stopSound:()=>{},soundOn:false,width:390,height:844,active:true,coach:{active:false,done:()=>{}},cheer:()=>{}});
function solveShape(s:ReturnType<typeof shape.create>) { const task=shapeTask(s), p=task.pieces[s.placed.length]; for(let mirrored=0;mirrored<2;mirrored++)for(let turn=0;turn<4;turn++){let cells=mirrored?flip(p.cells):p.cells;for(let i=0;i<turn;i++)cells=rotate(cells);const x=Math.min(...p.target.map(c=>c[0])),y=Math.min(...p.target.map(c=>c[1]));const next=shapePlace(s,s.placed.length,normalize(cells),x,y);if(next!==s)return next;}throw new Error('unsolvable piece'); }
describe('2.3 Thinking engines',()=>{
 for(let level=1 as 1|2|3|4|5;level<=5;level++) {
  const o=optionsAtLevel(base,level);
  it(`level ${level} generated rounds are solvable and validate`,()=>{
   for(const seed of [1,17,92345]) {
    let p=pattern.create(o,context(seed));expect(pattern.validate(JSON.parse(JSON.stringify(p)),o)).toBe(true);
    for(let i=0;i<4;i++){const t=patternTask(p);expect(t.choices).toContain(t.answer);expect(patternPlace(p,'wrong')).toBe(p);p=patternPlace(p,t.answer);}
    expect(pattern.outcome(p,o)).toBe('done');expect(pattern.validate(p,o)).toBe(true);
    let sh=shape.create(o,context(seed));expect(shape.validate(sh,o)).toBe(true);
    for(let i=0;i<4;i++){const n=shapeTask(sh).pieces.length;for(let j=0;j<n;j++)sh=solveShape(sh);if(level===5&&i===3){const cube=shapeTask(sh).cube!;expect(shape.validate(sh,o)).toBe(true);expect(renderToStaticMarkup(<ShapeBoard {...props('shape-shift',sh,o)}/>)).toContain('Fold the cube');expect(chooseCube(sh,cube.faces[2])).toBe(sh);sh=chooseCube(sh,cube.answer);}}
    expect(shape.outcome(sh,o)).toBe('done');expect(shape.validate(sh,o)).toBe(true);
    let l=logic.create(o,context(seed));expect(logic.validate(l,o)).toBe(true);
    for(let i=0;i<4;i++){const t=logicTask(l);if(t.kind==='grid'){const clues=[...t.givens];if(t.writtenClue)clues[t.writtenClue.cell]=t.writtenClue.value;expect(solutionCount(clues,t.size,t.boxRows,t.boxCols,t.cages)).toBe(1);for(let j=0;j<t.solution.length && l.index===i;j++)if(!t.givens[j])l=enter(l,j,t.solution[j]);}else l=enter(l,0,t.answer);}
    expect(logic.outcome(l,o), `level ${level} seed ${seed} index ${l.index} task ${JSON.stringify(logicTask(l))} entries ${JSON.stringify(l.entries)}`).toBe('done');expect(logic.validate(l,o)).toBe(true);
   }
  });
  it(`level ${level} boards render`,()=>{
   expect(renderToStaticMarkup(<PatternBoard {...props('pattern-path',pattern.create(o,context(3)),o)}/>)).toContain('stone');
   expect(renderToStaticMarkup(<ShapeBoard {...props('shape-shift',shape.create(o,context(3)),o)}/>)).toContain('piece');
   const logicHtml=renderToStaticMarkup(<LogicBoard {...props('logic-lagoon',logic.create(o,context(3)),o)}/>);expect(logicHtml).toContain('PUZZLE');if(level===5){expect(logicHtml).toContain('Purple dashed pairs');const cageTask=logicTask(logic.create(o,context(3)));expect(cageTask.kind==='grid' ? cageTask.cages.length : 0).toBeGreaterThan(0);}
  });
 }
 it('rejects malformed and mismatched saves',()=>{const o=optionsAtLevel(base,3),other=optionsAtLevel(base,4);for(const e of [pattern,shape,logic]){const s=e.create(o,context(7));expect(e.validate({...s,extra:true},o)).toBe(false);expect(e.validate({...s,version:2},o)).toBe(false);expect(e.validate(s,other)).toBe(false);}});
 it('levels change puzzle size or rules',()=>{const options=[1,2,3,4,5].map(n=>optionsAtLevel(base,n as 1|2|3|4|5));expect(options.map(o=>patternTask(pattern.create(o,context(5))).hint).filter((x,i,a)=>a.indexOf(x)===i).length).toBe(5);expect(options.map(o=>shapeTask(shape.create(o,context(5))).pieces.length)).toEqual([2,2,3,4,4]);expect(options.map(o=>{const t=logicTask(logic.create(o,context(5)));return t.kind==='grid'?t.size:0;})).toEqual([2,3,4,6,4]);});
 it('uses marked stones, recognisable silhouettes, and real cages',()=>{
  const easy=optionsAtLevel(base,1),hard=optionsAtLevel(base,5);
  for(const seed of [1,17,92345]){
   const first=patternTask(pattern.create(easy,context(seed)));
   expect(first.tiles.every(tile=>/^stone:(coral|jade|blue|gold|plum)$/.test(tile))).toBe(true);
   const pictures=[1,2,3,4,5].map(n=>shapeTask(shape.create(optionsAtLevel(base,n as 1|2|3|4|5),context(seed))).picture);
   expect(pictures).toEqual(['Boat','House','Fish','Rocket','Cube net']);
   for(let index=0;index<4;index++){
    const state={...logic.create(hard,context(seed)),index};const task=logicTask(state);
    expect(task.kind).toBe('grid');if(task.kind!=='grid')continue;
    expect(task.cages.length).toBe(8);
    expect(task.cages.flatMap(c=>c.cells).sort((a,b)=>a-b)).toEqual(Array.from({length:16},(_,i)=>i));
    expect(task.cages.every(c=>c.cells.reduce((sum,i)=>sum+task.solution[i],0)===c.sum)).toBe(true);
   }
  }
 });
});
