import { levelOf } from "../../levelOptions";
import type { LearnEngine } from "../../types";

export type LogicState = { version: 1; level: number; seed: number; index: number; total: 4; entries: number[]; helped: boolean };
export type Cage = { cells: number[]; sum: number };
export type GridTask = { kind: "grid"; size: number; boxRows: number; boxCols: number; solution: number[]; givens: number[]; cages: Cage[]; title: string; symbols: string[]; writtenClue?: { cell: number; value: number; text: string } };
export type BalanceTask = { kind: "balance"; left: number; right: number; answer: number; title: string };
export type LogicTask = GridTask | BalanceTask;
const random = (n: number) => (Math.imul(n, 1664525) + 1013904223) >>> 0;
const base = (size: number, br: number, bc: number, seed: number) => {
  const shift = seed % size;
  return Array.from({length: size*size}, (_, i) => (((br===1 ? Math.floor(i/size) : Math.floor(i/size)*bc + Math.floor(Math.floor(i/size)/br)) + i%size + shift) % size)+1);
};
function valid(grid: number[], size: number, br: number, bc: number, cages: Cage[]) {
  for (let i=0;i<grid.length;i++) { const v=grid[i]; if (!v) continue; const r=Math.floor(i/size), c=i%size;
    for (let j=0;j<grid.length;j++) if (j!==i && grid[j]===v && (Math.floor(j/size)===r || j%size===c || (br>1 && Math.floor(Math.floor(j/size)/br)===Math.floor(r/br) && Math.floor((j%size)/bc)===Math.floor(c/bc)))) return false;
  }
  for (const cage of cages) { const vals=cage.cells.map(i=>grid[i]); const sum=vals.reduce((a,b)=>a+b,0); if (sum>cage.sum || (vals.every(Boolean) && sum!==cage.sum)) return false; }
  return true;
}
export function solutionCount(grid: number[], size: number, br: number, bc: number, cages: Cage[], limit=2): number {
  let best=-1, choices:number[]=[];
  for (let i=0;i<grid.length;i++) if (!grid[i]) { const options=Array.from({length:size},(_,n)=>n+1).filter(n=>{grid[i]=n;const ok=valid(grid,size,br,bc,cages);grid[i]=0;return ok;}); if (!options.length) return 0; if (best<0 || options.length<choices.length) {best=i;choices=options;if (options.length===1) break;} }
  if (best<0) return 1;
  let count=0;for (const n of choices) {grid[best]=n;count+=solutionCount(grid,size,br,bc,cages,limit-count);if(count>=limit) break;}grid[best]=0;return count;
}
export function taskAt(s: LogicState): LogicTask {
  const seed=random(s.seed+s.index*9419);
  if (s.level===4 && s.index===2) { const answer=2+seed%8, right=1+(seed>>>7)%7; return {kind:"balance",left:answer+right,right,answer,title:"Balance the two shell scales"}; }
  const size=s.level===1?2:s.level===2?3:s.level===4?6:4;
  const br=size===4?2:size===6?2:1, bc=size===4?2:size===6?3:1;
  const solution=base(size,br,bc,seed);
  const cages:Cage[]=[];
  if (s.level===5) for(let r=0;r<size;r++)for(let c=0;c<size;c+=2) {const cells=[r*size+c,r*size+c+1];cages.push({cells,sum:solution[cells[0]]+solution[cells[1]]});}
  const givens=[...solution], target = size===2?2:size===3?5:size===4?(cages.length?3:7):22;
  const order=Array.from({length:givens.length},(_,i)=>i).sort((a,b)=>(random(seed+a*37)%10000)-(random(seed+b*37)%10000));
  for (const i of order) { if (givens.filter(Boolean).length<=target) break; const was=givens[i];givens[i]=0; if (solutionCount([...givens],size,br,bc,cages)!==1) givens[i]=was; }
  let writtenClue: GridTask["writtenClue"];
  if (s.level===5 && s.index===0) { const cell=givens.findIndex(Boolean); const value=givens[cell]; givens[cell]=0; writtenClue={cell,value,text:`Clue: row ${Math.floor(cell/size)+1}, column ${cell%size+1} is ${value}.`}; }
  const symbols=s.level===1?["shell","fish"]:s.level===2?["shell","fish","star"]:s.level===3 && s.index<2?["shell","fish","star","crab"]:Array.from({length:size},(_,i)=>String(i+1));
  return {kind:"grid",size,boxRows:br,boxCols:bc,solution,givens,cages,title:s.level===1?"Who rides each boat?":s.level===2?"Fill the picture lagoon":s.level===5?"Solve the sum cages":"Fill each row, column and little box",symbols,writtenClue};
}
export function valueAt(s: LogicState, i: number) { const task=taskAt(s); return task.kind==="grid" ? task.givens[i] || s.entries[i] || 0 : s.entries[0] || 0; }
export function enter(s: LogicState, cell: number, value: number): LogicState {
  const task=taskAt(s);
  if (task.kind==="balance") { if(cell!==0 || !Number.isInteger(value) || value<0 || value>20) return s; const entries=[value]; return value===task.answer?{...s,index:s.index+1,entries:[]}:{...s,entries}; }
  if (!Number.isInteger(cell)||cell<0||cell>=task.solution.length||task.givens[cell]||!Number.isInteger(value)||value<1||value>task.size) return s;
  const entries=Array.from({length:task.solution.length},(_,i)=>s.entries[i]||0); entries[cell]=value;
  const complete=task.solution.every((n,i)=>task.givens[i]===n || entries[i]===n);
  return complete?{...s,index:s.index+1,entries:[]}:{...s,entries};
}
export function hint(s: LogicState): {state:LogicState;cell:number;value:number;reason:string} {
  const task=taskAt(s), state={...s,helped:true};
  if(task.kind==="balance") return {state,cell:0,value:task.answer,reason:`Both sides must hold the same number of shells. Take the ${task.right} loose shells away from ${task.left} to work out the bag.`};
  // Ignore mistaken entries when finding a sound deduction; never build a hint on a contradiction.
  const grid=task.givens.map((n,i)=>n || (s.entries[i]===task.solution[i] ? s.entries[i] : 0));
  if(task.writtenClue) grid[task.writtenClue.cell]=task.writtenClue.value;
  if(task.writtenClue && s.entries[task.writtenClue.cell]!==task.writtenClue.value) return {state,cell:task.writtenClue.cell,value:task.writtenClue.value,reason:task.writtenClue.text};
  let cell=task.solution.findIndex((n,i)=>!task.givens[i] && s.entries[i]!==n);
  let direct=false;
  for(let i=0;i<grid.length;i++) if(!grid[i]) {
    const candidates=Array.from({length:task.size},(_,n)=>n+1).filter(n=>{grid[i]=n;const ok=valid(grid,task.size,task.boxRows,task.boxCols,task.cages);grid[i]=0;return ok;});
    if(candidates.length===1){cell=i;direct=true;break;}
  }
  const row=Math.floor(cell/task.size), col=cell%task.size;
  const peers=grid.filter((n,i)=>n && (Math.floor(i/task.size)===row || i%task.size===col || (task.boxRows>1 && Math.floor(Math.floor(i/task.size)/task.boxRows)===Math.floor(row/task.boxRows) && Math.floor((i%task.size)/task.boxCols)===Math.floor(col/task.boxCols))));
  const used=[...new Set(peers)].map(n=>task.symbols[n-1]).join(", ");
  const reason=direct ? `Look at row ${row+1}, column ${col+1}. ${used ? `Its row, column${task.boxRows>1 ? " and box" : ""} already contain ${used}. ` : ""}Each needs one of each.${task.cages.length ? " The pair must also add to its marked sum." : ""} Only one choice fits all these clues.` : `Look at row ${row+1}, column ${col+1}. Try each choice against its row, column${task.boxRows>1 ? ", box" : ""}${task.cages.length ? " and sum cage" : ""}, then follow the remaining empty spots. Only one choice lets the whole grid follow every clue.`;
  return {state,cell,value:task.solution[cell],reason};
}
export const engine: LearnEngine<LogicState> = {
  id:"logic-lagoon",name:"Logic Lagoon",island:"thinking",ages:[6,14],ownLevels:true,
  levelNames:[
    {name:"Two friends",description:"Use picture clues to place two friends in two boats."},
    {name:"Picture grid",description:"Fill three rows and columns with three different pictures."},
    {name:"Little sudoku",description:"Solve 4 × 4 picture and number sudoku."},
    {name:"Bigger lagoon",description:"Solve 6 × 6 sudoku and balance a shell scale."},
    {name:"Cages and clues",description:"Use 4 × 4 arithmetic cages and written clues."},
  ],
  tagline:"Solve the island clues.",description:"Place one of each picture or number in every row and column. Follow the little boxes and sum clues, too.",
  help:"Tap an empty square, then choose a picture or number. Each row and column needs one of each. Help points to one useful step. There is no clock and you can change your answers.",
  color:"#57793D",surface:"#EFF4DC",modes:["solo","together"],skills:{"think.logic":"Solving logic grids","think.balance":"Balancing scales"},
  create:(o,ctx)=>({version:1,level:levelOf(o),seed:Math.floor(ctx.rng()*0xffffffff)>>>0,index:0,total:4,entries:[],helped:false}),
  validate:(v,o):v is LogicState=>{if(!v||typeof v!=="object"||Object.keys(v).sort().join()!=="entries,helped,index,level,seed,total,version")return false;const s=v as LogicState;if(s.version!==1||s.level!==levelOf(o)||s.total!==4||!Number.isInteger(s.seed)||s.seed<0||s.seed>0xffffffff||!Number.isInteger(s.index)||s.index<0||s.index>4||typeof s.helped!=="boolean"||!Array.isArray(s.entries))return false;if(s.index===4)return s.entries.length===0;const task=taskAt(s);return s.entries.length<=(task.kind==="grid"?task.solution.length:1)&&s.entries.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=(task.kind==="grid"?task.size:20)&& (task.kind!=="grid"||!task.givens[i]||n===0));},
  outcome:s=>s.index===4?"done":null,
};
