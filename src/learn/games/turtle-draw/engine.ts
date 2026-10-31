import type { LearnEngine } from '../../types';
import { levelOf } from '../../levelOptions';
export type Block={kind:'forward';n:number}|{kind:'turn';angle:number}|{kind:'color';color:'coral'|'teal'|'gold'}|{kind:'repeat';times:number;body:Block[]};
export type Task={seed:number;target:Block[];limit:number;requiredLoop:boolean;debug:boolean};
export type TurtleState={version:1;level:number;tasks:Task[];done:number;completed:Block[][];program:Block[];cursor:number;running:boolean;attempts:number;helped:boolean;free:boolean};
const f=(n:number):Block=>({kind:'forward',n}),t=(angle:number):Block=>({kind:'turn',angle}),r=(times:number,body:Block[]):Block=>({kind:'repeat',times,body});
export function task(level:number,seed:number):Task {const n=60+seed%3*10;let target:Block[];
if(level===1)target=seed%2?[f(n),t(90),f(n)]:[f(n)];
else if(level===2)target=seed%2?[f(n),t(90),f(n+20),t(90),f(n),t(90),f(n+20)]:[f(n),t(90),f(n),t(90),f(n),t(90),f(n)];
else if(level===3)target=[r(seed%2?3:4,[f(n),t(seed%2?120:90)])];
else if(level===4)target=seed%2?[r(8,[r(4,[f(n),t(90)]),t(45)])]:[r(seed%3?6:8,[f(n),t(seed%3?60:45)])];
else target=seed%2?[r(4,[f(n),t(90)])]:[r(3,[f(n),t(120)])];
return {seed,target,limit:level===5?3:level===4?10:20,requiredLoop:level>=3,debug:level===5&&seed%2===0};}
export function flatten(blocks:Block[],depth=0):Exclude<Block,{kind:'repeat'}>[]|null {if(depth>3||blocks.length>30)return null;const out:Exclude<Block,{kind:'repeat'}>[]=[];for(const b of blocks){if(b.kind==='repeat'){const part=flatten(b.body,depth+1);if(!part)return null;for(let i=0;i<b.times;i++)out.push(...part);}else out.push(b);if(out.length>120)return null;}return out;}
export type Point={x:number;y:number};export type Segment={from:Point;to:Point;color:string};
export function draw(blocks:Block[]):Segment[]|null {const flat=flatten(blocks);if(!flat)return null;let x=100,y=80,angle=0,color='teal';const lines:Segment[]=[];for(const b of flat){if(b.kind==='turn')angle=(angle+b.angle)%360;else if(b.kind==='color')color=b.color;else {const nx=Math.round((x+Math.cos(angle*Math.PI/180)*b.n)*100)/100,ny=Math.round((y+Math.sin(angle*Math.PI/180)*b.n)*100)/100;lines.push({from:{x,y},to:{x:nx,y:ny},color});x=nx;y=ny;}}return lines;}
const near=(a:number,b:number)=>Math.abs(a-b)<.3;
export function solves(task:Task,program:Block[]):boolean {if(program.length>task.limit||task.requiredLoop&&!program.some(b=>b.kind==='repeat'))return false;const a=draw(task.target),b=draw(program);return !!a&&!!b&&a.length===b.length&&a.every((s,i)=>near(s.from.x,b[i].from.x)&&near(s.from.y,b[i].from.y)&&near(s.to.x,b[i].to.x)&&near(s.to.y,b[i].to.y));}
export function validBlock(b:unknown,depth=0):b is Block {if(!b||typeof b!=='object'||Array.isArray(b)||depth>2)return false;const v=b as Record<string,unknown>;if(v.kind==='forward')return Object.keys(v).sort().join()==='kind,n'&&[60,70,80,90,100].includes(v.n as number);if(v.kind==='turn')return Object.keys(v).sort().join()==='angle,kind'&&[45,60,90,120].includes(v.angle as number);if(v.kind==='color')return Object.keys(v).sort().join()==='color,kind'&&['coral','teal','gold'].includes(v.color as string);return v.kind==='repeat'&&Object.keys(v).sort().join()==='body,kind,times'&&[2,3,4,6,8].includes(v.times as number)&&Array.isArray(v.body)&&v.body.length>0&&v.body.length<=8&&v.body.every(x=>validBlock(x,depth+1));}
/** Same structural validator used by saves; add the execution expansion bound for edits. */
export function programIssue(program: Block[]): string | null {
  if (program.length > 30 || !program.every(b => validBlock(b))) return "A repeat holds up to 8 blocks and 2 nested levels. Try a smaller plan.";
  if (!flatten(program)) return "That repeat makes more than 120 commands. Try fewer repeats.";
  return null;
}
export function wrapIssue(program: Block[], times: number): string | null {
  if (!program.length) return "Add a block first, then repeat it.";
  return programIssue([{kind:'repeat',times,body:program}]);
}
export const canWrap = (program: Block[], times: number): boolean => wrapIssue(program,times) === null;
export function replaceBlock(program: Block[], path: number[], replacement: Block): Block[] {
  const [index,...rest] = path;
  return program.map((block,i) => i !== index ? block : rest.length && block.kind === 'repeat' ? {...block,body:replaceBlock(block.body,rest,replacement)} : replacement);
}
export function drawingFeedback(task: Task, program: Block[]): {segment: number; message: string} {
  const goal=draw(task.target)||[], actual=draw(program)||[];
  for (let i=0;i<Math.min(goal.length,actual.length);i++) {
    const a=goal[i],b=actual[i];
    if (![near(a.from.x,b.from.x),near(a.from.y,b.from.y),near(a.to.x,b.to.x),near(a.to.y,b.to.y)].every(Boolean)) {
      const wanted=Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y), got=Math.hypot(b.to.x-b.from.x,b.to.y-b.from.y);
      return {segment:i,message:Math.abs(wanted-got)>.3 ? `Line ${i+1} is too ${got>wanted?'long':'short'}: ${Math.round(got)} units. Try ${Math.round(wanted)} units.` : `Line ${i+1} points a different way. Check the turn before it.`};
    }
  }
  return {segment:Math.min(goal.length,actual.length),message:actual.length<goal.length?'Add the missing lines.':actual.length>goal.length?'There are extra lines. Try fewer repeats.':task.requiredLoop?'The lines match! Use a repeat block for this goal.':'Check the block limit and try again.'};
}
export function initialProgram(t:Task):Block[] {if(!t.debug)return [];const copy=JSON.parse(JSON.stringify(t.target)) as Block[];const loop=copy[0] as Extract<Block,{kind:'repeat'}>;loop.body[1]= {kind:'turn',angle:90};return copy;}
/** One animation step of a run. A solve records (or replaces) this task's program, so redrawing a solved shape never adds a second entry. */
export function advance(s:TurtleState):TurtleState{const task=s.tasks[Math.min(s.done,3)],steps=Math.max(1,(draw(s.program)||[]).length),next=s.cursor+1,finished=next>=steps;return {...s,cursor:next,running:!finished,completed:finished&&!s.free&&solves(task,s.program)?[...s.completed.slice(0,s.done),s.program]:s.completed};}
export const engine:LearnEngine<TurtleState>={id:'turtle-draw',name:'Turtle Draw',island:'coding',ages:[6,11],ownLevels:true,
levelNames:[{name:'Lines in sand',description:'Draw a line, then an L.'},{name:'Four sides',description:'Trace squares and rectangles.'},{name:'Loop a shape',description:'Use repeat to draw triangles and squares.'},{name:'Angles and flowers',description:'Use 360 ÷ sides and a nested repeat.'},{name:'Tiny clever programs',description:'Draw with fewer blocks and fix a buggy loop.'}],tagline:'Draw with turtle code!',description:'Build a little program to trace the shape in the sand.',help:'Tap blocks to build a program. Repeat wraps the current plan, so you can make a loop inside a loop. Tap a plan command to edit it, even inside a repeat. Use the cross button to remove a top-level block. Each grid square is 10 units; the target labels show lengths. Press Draw and watch the turtle trace the faint shape. Show me reveals a working program. After a goal, try free drawing.',color:'#3D5A9A',surface:'#E3E9F7',modes:['solo','together'],skills:{'think.geometry':'Drawing with angles','think.loops':'Repeating a drawing','think.debug':'Fixing a drawing program'},
create:(o,c)=>{const level=levelOf(o),base=Math.floor(c.rng()*10000);const tasks=Array.from({length:4},(_,i)=>task(level,(base+i*7)%10000));return {version:1,level,tasks,done:0,completed:[],program:initialProgram(tasks[0]),cursor:0,running:false,attempts:0,helped:false,free:false};},
validate:(x,o):x is TurtleState=>{if(!x||typeof x!=='object'||Array.isArray(x))return false;const s=x as TurtleState;return Object.keys(s).sort().join()===['version','level','tasks','done','completed','program','cursor','running','attempts','helped','free'].sort().join()&&s.version===1&&s.level===levelOf(o)&&Array.isArray(s.tasks)&&s.tasks.length===4&&s.tasks.every(t=>Number.isInteger(t?.seed)&&t.seed>=0&&t.seed<=10000&&JSON.stringify(t)===JSON.stringify(task(s.level,t.seed)))&&Number.isInteger(s.done)&&s.done>=0&&s.done<=4&&Array.isArray(s.completed)&&s.completed.length>=s.done&&s.completed.length<=Math.min(4,s.done+1)&&s.completed.every((program,i)=>Array.isArray(program)&&program.length<=30&&program.every(b=>validBlock(b))&&solves(s.tasks[i],program))&&Array.isArray(s.program)&&s.program.length<=30&&s.program.every(b=>validBlock(b))&&Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<=120&&typeof s.running==='boolean'&&(!s.running||s.done<4)&&Number.isInteger(s.attempts)&&s.attempts>=0&&s.attempts<=10000&&typeof s.helped==='boolean'&&typeof s.free==='boolean'&& (s.done<4||!s.running);},
outcome:s=>s.done===4?'done':null,turn:s=>s.done%2 as 0|1};
