import type { LearnEngine } from '../../types';
import { levelOf } from '../../levelOptions';
export type Arrow = 'up'|'right'|'down'|'left'|'repeat2'|'repeat3';
export type Puzzle = { start:number; shell:number; rocks:number[]; answer:Arrow[]; seed:number };
export type BotState = { version:1; level:number; puzzles:Puzzle[]; done:number; completed:Arrow[][]; program:Arrow[]; cursor:number; running:boolean; attempts:number; helped:boolean };
const dirs:Arrow[]=['up','right','down','left'];
export function cardEffect(p:Puzzle,pos:number,card:Arrow,previous:Arrow|null):{pos:number;bump:boolean} {
  const move = card.startsWith('repeat') ? previous : card;
  if(!move || move.startsWith('repeat')) return {pos,bump:true};
  const count = card.startsWith('repeat') ? Number(card.slice(-1))-1 : 1;
  for(let i=0;i<count;i++) {
    const d=dirs.indexOf(move),x=pos%5+([0,1,0,-1][d]),y=Math.floor(pos/5)+([-1,0,1,0][d]);
    if(x<0||x>4||y<0||y>4||p.rocks.includes(y*5+x)) return {pos,bump:true};
    pos=y*5+x;
  }
  return {pos,bump:false};
}
export function step(p:Puzzle,pos:number,card:Arrow,previous:Arrow|null):number {const result=cardEffect(p,pos,card,previous);return result.bump?-1:result.pos;}
export function execution(p:Puzzle,program:Arrow[]):{path:number[];pos:number;failedCard:number|null} {
  let pos=p.start,previous:Arrow|null=null;const path=[pos];
  for(let i=0;i<program.length;i++) {
    const card=program[i],result=cardEffect(p,pos,card,previous);pos=result.pos;
    path.push(result.bump?-1:pos);
    if(result.bump)return {path,pos,failedCard:i};
    if(!card.startsWith('repeat'))previous=card;
  }
  return {path,pos,failedCard:null};
}
export const trace=(p:Puzzle,program:Arrow[]):number[]=>execution(p,program).path;
export const solves=(p:Puzzle,program:Arrow[])=>{const path=trace(p,program);return path.at(-1)===p.shell && path.slice(0,-1).every(x=>x!==p.shell);};
const pathFor=(level:number,seed:number):Arrow[]=>{const a:Arrow=seed%2?'right':'down',b:Arrow=a==='right'?'down':'right',variant=Math.floor(seed/4)%4;if(level===1)return Array(1+seed%3).fill(a);
if(level===2)return [[a,b],[a,b,b],[a,a,b],[a,b,a]][variant];
if(level===3)return [[a,b,b],[a,a,b,b],[a,b,a,b],[a,b,b,a]][variant];
if(level===4)return [[a,b,b,a],[a,a,b,b],[a,b,a,b],[a,b,b,b]][variant];
return [a,seed%2?'repeat2':'repeat3',b];};
export function makePuzzle(level:number,seed:number):Puzzle {const answer=pathFor(level,seed);const spot=seed%4;const start=level===5&&seed%2===0 ? (spot===0?0:2) : spot%2+Math.floor(spot/2)*5;let p:Puzzle={start,shell:0,rocks:[],answer,seed};const path=trace(p,answer);p={...p,shell:path.at(-1)!};if(level>=3){const direct=seed%2?'down':'right';const blocked=step(p,start,direct,null);if(blocked>=0&&!path.includes(blocked))p={...p,rocks:[blocked]};}return p;}
export function initialProgram(p:Puzzle,level:number):Arrow[] {if(level!==4)return [];const wrong=[...p.answer];wrong[1]=wrong[1]==='right'?'down':'right';return wrong;}
export function advance(s:BotState):BotState {const next=s.done+1;return {...s,done:next,completed:[...s.completed,s.program.slice(0,s.cursor)],program:next<s.puzzles.length?initialProgram(s.puzzles[next],s.level):[],cursor:0,running:false,helped:false};}
export function tick(s:BotState):BotState {if(!s.running)return s;const cursor=s.cursor+1;const p=s.puzzles[s.done];const path=trace(p,s.program.slice(0,cursor));return {...s,cursor,running:cursor<s.program.length&&path.at(-1)!>=0&&path.at(-1)!==p.shell};}
const validArrow=(x:unknown,l:number):x is Arrow=>dirs.includes(x as Arrow)||(l===5&&['repeat2','repeat3'].includes(x as string));
export const engine:LearnEngine<BotState>={id:'beep-bot',name:'Beep Bot',island:'coding',ages:[4,6],ownLevels:true,
levelNames:[{name:'One little path',description:'Put one, two or three arrows in order.'},{name:'Around the corner',description:'Make Beep turn toward a shell.'},{name:'Find a way',description:'Choose arrows around sandcastles.'},{name:'Fix the arrow',description:'Find and change one wrong arrow in a program.'},{name:'Again and again',description:'Use repeat cards to make a small loop.'}],
tagline:'Code Beep to find a shell!',description:'Tap arrow cards and press Go to guide Beep to a shell.',help:'Tap arrows to add them to Beep’s plan. Tap a plan card to remove it. Press Go to watch Beep follow each card. If Beep bumps, try another path. Show me gives a plan you can change. Level 4 begins with one wrong card. Level 5 adds repeat cards.',introAudio:'beep-bot-intro',helpAudio:'beep-bot-help',color:'#3D5A9A',surface:'#E3E9F7',modes:['solo','together'],skills:{'think.sequence':'Putting steps in order','think.debug':'Finding and fixing a step','think.loops':'Repeating a step'},
create:(o,c)=>{const level=levelOf(o),base=Math.floor(c.rng()*10000);const puzzles=Array.from({length:4},(_,i)=>makePuzzle(level,(base+i*7)%10000));return {version:1,level,puzzles,done:0,completed:[],program:initialProgram(puzzles[0],level),cursor:0,running:false,attempts:0,helped:false};},
validate:(x,o):x is BotState=>{if(!x||typeof x!=='object'||Array.isArray(x))return false;const s=x as BotState;if(Object.keys(s).sort().join()!==['version','level','puzzles','done','completed','program','cursor','running','attempts','helped'].sort().join()||s.version!==1||s.level!==levelOf(o)||!Array.isArray(s.puzzles)||s.puzzles.length!==4||!s.puzzles.every(p=>{if(!p||!Number.isInteger(p.seed)||p.seed<0||p.seed>10000)return false;return JSON.stringify(p)===JSON.stringify(makePuzzle(s.level,p.seed));})||!Number.isInteger(s.done)||s.done<0||s.done>4||!Array.isArray(s.completed)||s.completed.length!==s.done||!s.completed.every((program,i)=>Array.isArray(program)&&program.length<=32&&program.every(c=>validArrow(c,s.level))&&solves(s.puzzles[i],program))||!Array.isArray(s.program)||s.program.length>32||!s.program.every(c=>validArrow(c,s.level))||!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>s.program.length||typeof s.running!=='boolean'||!Number.isInteger(s.attempts)||s.attempts<0||s.attempts>10000||typeof s.helped!=='boolean')return false;return (!s.running||s.done<4&&s.cursor<s.program.length)&& (s.done<4||s.program.length===0);},
outcome:s=>s.done===4?'done':null,turn:(s)=>s.done%2 as 0|1};
