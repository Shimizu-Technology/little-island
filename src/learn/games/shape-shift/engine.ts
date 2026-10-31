import { levelOf } from "../../levelOptions";
import type { LearnEngine } from "../../types";

export type Cell = [number, number];
export type ShapeState = { version: 1; level: number; seed: number; index: number; total: 4; placed: number[]; helped: boolean };
export type Piece = { name: string; cells: Cell[]; target: Cell[]; color: string };
export type ShapeTask = { pieces: Piece[]; picture: string; width: number; height: number; title: string; hint: string; cube?: { faces: string[]; answer: string } };
type Part = { name: string; color: string; cells: Cell[] };
const blueprints: Record<string, Part[]> = {
  Boat: [
    {name:"Sail tip",color:"#EFBF75",cells:[[2,0],[2,1],[3,1]]},
    {name:"Sail",color:"#F3D599",cells:[[2,2],[3,2]]},
    {name:"Hull left",color:"#5C9FA0",cells:[[0,3],[1,3],[2,3],[1,4],[2,4]]},
    {name:"Hull right",color:"#4A8792",cells:[[3,3],[4,3],[5,3],[3,4],[4,4]]},
  ],
  House: [
    {name:"Roof left",color:"#DA836C",cells:[[2,0],[1,1],[2,1]]},
    {name:"Roof right",color:"#C96F63",cells:[[3,0],[3,1],[4,1]]},
    {name:"Wall left",color:"#DAB87D",cells:[[1,2],[2,2],[1,3],[2,3],[1,4],[2,4]]},
    {name:"Wall right",color:"#EACB94",cells:[[3,2],[4,2],[3,3],[4,3],[3,4],[4,4]]},
  ],
  Fish: [
    {name:"Tail",color:"#E9BA61",cells:[[0,1],[1,2],[0,3]]},
    {name:"Back",color:"#63A9A5",cells:[[2,1],[2,2],[2,3],[3,0],[3,1]]},
    {name:"Face",color:"#79C2B5",cells:[[3,2],[4,1],[4,2],[5,2]]},
    {name:"Fin",color:"#4F969C",cells:[[3,3],[3,4],[4,3]]},
  ],
  Rocket: [
    {name:"Nose",color:"#D9826B",cells:[[2,0],[3,0],[2,1],[3,1]]},
    {name:"Body",color:"#79ACBC",cells:[[2,2],[3,2],[2,3],[3,3]]},
    {name:"Left wing",color:"#E4B760",cells:[[1,3],[1,4],[2,4],[2,5]]},
    {name:"Right wing",color:"#E4B760",cells:[[4,3],[4,4],[3,4],[3,5]]},
  ],
  "Cube net": [
    {name:"Top face",color:"#A98AB5",cells:[[2,0],[2,1]]},
    {name:"Left face",color:"#C4A8C7",cells:[[1,1]]},
    {name:"Right face",color:"#8F78A8",cells:[[3,1]]},
    {name:"Bottom faces",color:"#B99CC1",cells:[[2,2],[2,3]]},
  ],
};
export const rotate = (cells: Cell[]): Cell[] => cells.map(([x,y]) => [-y,x]);
export const flip = (cells: Cell[]): Cell[] => cells.map(([x,y]) => [-x,y]);
export const normalize = (cells: Cell[]): Cell[] => { const minX = Math.min(...cells.map(c => c[0])), minY = Math.min(...cells.map(c => c[1])); return cells.map(([x,y]) => [x-minX,y-minY]); };
export const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every(([x,y]) => b.some(([u,v]) => x===u && y===v));
const random = (n: number) => (Math.imul(n, 1664525) + 1013904223) >>> 0;
export function taskAt(s: ShapeState): ShapeTask {
  const seed = random(s.seed + s.index * 11717), count = s.level <= 2 ? 2 : s.level === 3 ? 3 : 4;
  const picture = s.level===5 && (s.index===0 || s.index===3) ? "Cube net" : ["Boat","House","Fish","Rocket"][(s.level+s.index-1)%4];
  const parts=blueprints[picture];
  const groups = count===2 ? picture==="Rocket" ? [[0,1,2],[3]] : [[0,1],[2,3]] : count===3 ? [[0,1],[2],[3]] : [[0],[1],[2],[3]];
  const pieces: Piece[] = groups.map((group,i) => {
    const target=group.flatMap(j=>parts[j].cells);
    let cells=normalize(target);
    if (s.level>=3 && (random(seed+i*23)%2)) cells=flip(cells);
    const turns=s.level>=2 ? 1+random(seed+i*7)%3 : 0;
    for(let t=0;t<turns;t++) cells=rotate(cells);
    return {name:group.length>1 ? group.map(j=>parts[j].name).join(" + ") : parts[group[0]].name,cells:normalize(cells),target,color:parts[group[0]].color};
  });
  const faces = ["A","B","C","D","E","F"].map((_,i) => ["A","B","C","D","E","F"][(i+seed%6)%6]);
  return { pieces, picture, width: 6, height: 6, title: `Build the ${picture.toLowerCase()}`, hint: `Start with ${pieces[s.placed.length]?.name ?? "a piece"}. ${s.level === 1 ? "Move it to the gold corner until its outline fits." : s.level === 2 ? "Turn it, then move it until its outline fits." : "Turn or flip it, then move it until its outline fits."}`, ...(s.level===5 && s.index===3 ? {cube:{faces,answer:faces[5]}} : {}) };
}
export function fits(piece: Piece, cells: Cell[], x: number, y: number) { return sameCells(normalize(cells).map(([a,b]) => [a+x,b+y]), piece.target); }
export function place(s: ShapeState, pieceIndex: number, cells: Cell[], x: number, y: number): ShapeState {
  if (pieceIndex !== s.placed.length || !fits(taskAt(s).pieces[pieceIndex], cells, x, y)) return s;
  const placed = [...s.placed, pieceIndex];
  return placed.length === taskAt(s).pieces.length && !(s.level===5 && s.index===3) ? { ...s, index: s.index + 1, placed: [] } : { ...s, placed };
}
export function chooseCube(s: ShapeState, face: string): ShapeState { return s.level===5 && s.index===3 && s.placed.length===taskAt(s).pieces.length && face===taskAt(s).cube?.answer ? {...s,index:4,placed:[]} : s; }
export const help = (s: ShapeState): ShapeState => ({ ...s, helped: true });
export const engine: LearnEngine<ShapeState> = {
  id: "shape-shift", name: "Shape Shift", island: "thinking", ages: [4,13], ownLevels: true,
  levelNames: [
    { name: "Big pieces", description: "Fit two big pieces without turning." },
    { name: "Turn it", description: "Rotate pieces to fill a silhouette." },
    { name: "Flip the fish", description: "Fit three pieces and try mirror flips." },
    { name: "Mirror island", description: "Place four pieces with turns and flips." },
    { name: "Fold the net", description: "Rotate and mirror a six-square cube net and other pieces." },
  ],
  tagline: "Turn shapes to fit the island.", description: "Fit each piece into the glowing island silhouette. Turn and flip when needed.",
  help: "Choose the next piece. Tap Turn or Flip, then drag it to the picture or tap the gold placement corner. A piece snaps in when every square fits. Help shows a clue.",
  color: "#57793D", surface: "#EFF4DC", modes: ["solo", "together"], skills: { "think.spatial": "Turning and fitting shapes" },
  create: (o, ctx) => ({version: 1, level: levelOf(o), seed: Math.floor(ctx.rng()*0xffffffff) >>> 0, index: 0, total: 4, placed: [], helped: false}),
  validate: (v,o): v is ShapeState => { if (!v || typeof v !== "object" || Object.keys(v).sort().join() !== "helped,index,level,placed,seed,total,version") return false; const s=v as ShapeState; if (s.version !== 1 || s.level !== levelOf(o) || s.total !== 4 || !Number.isInteger(s.seed) || s.seed<0 || s.seed>0xffffffff || !Number.isInteger(s.index) || s.index<0 || s.index>4 || typeof s.helped !== "boolean" || !Array.isArray(s.placed)) return false; return s.placed.length <= (s.index===4 ? 0 : taskAt(s).pieces.length-(s.level===5 && s.index===3 ? 0 : 1)) && s.placed.every((n,i) => n===i); },
  outcome: s => s.index===4 ? "done" : null,
};
