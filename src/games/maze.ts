import { Base, Options, base, random, shuffle } from "./types";
export type MazeState = Base & { game: "maze"; size: number; walls: number[]; path: number[]; seed: number };
// Wall bits: north=1, east=2, south=4, west=8. Depth-first generation visits every cell.
export const directions = [
  { name: "Up", dr: -1, dc: 0, bit: 1, opposite: 4 },
  { name: "Right", dr: 0, dc: 1, bit: 2, opposite: 8 },
  { name: "Down", dr: 1, dc: 0, bit: 4, opposite: 1 },
  { name: "Left", dr: 0, dc: -1, bit: 8, opposite: 2 },
];
export function createMaze(options: Options, seed = Math.floor(Math.random() * 0x7fffffff)): MazeState {
  const size = options.difficulty === "easy" ? 5 : options.difficulty === "medium" ? 7 : 9;
  const walls = Array<number>(size * size).fill(15),
    visited = new Set([0]),
    stack = [0],
    rng = random(seed);
  while (stack.length) {
    const cell = stack[stack.length - 1],
      r = Math.floor(cell / size),
      c = cell % size;
    const choices = shuffle(directions, rng).filter((d) => {
      const nr = r + d.dr,
        nc = c + d.dc;
      return nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(nr * size + nc);
    });
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const d = choices[0],
      next = (r + d.dr) * size + c + d.dc;
    walls[cell] &= ~d.bit;
    walls[next] &= ~d.opposite;
    visited.add(next);
    stack.push(next);
  }
  return { ...base("maze", options), game: "maze", size, walls, path: [0], seed };
}
export const mazeDone = (s: MazeState) => s.path[s.path.length - 1] === s.size * s.size - 1;
export function mazeMove(s: MazeState, index: number): MazeState {
  if (mazeDone(s)) return s;
  const current = s.path[s.path.length - 1],
    dr = Math.floor(index / s.size) - Math.floor(current / s.size),
    dc = (index % s.size) - (current % s.size);
  const d = directions.find((d) => d.dr === dr && d.dc === dc);
  if (!Number.isInteger(index) || index < 0 || index >= s.walls.length || !d || s.walls[current] & d.bit) return s;
  if (s.path.length > 1 && s.path[s.path.length - 2] === index) return { ...s, path: s.path.slice(0, -1) };
  return { ...s, path: [...s.path, index] };
}
export function mazeRoute(s: MazeState): number[] {
  const from = s.path[s.path.length - 1],
    queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const route = queue.shift()!,
      cell = route[route.length - 1];
    if (cell === s.walls.length - 1) return route;
    for (const d of directions)
      if (!(s.walls[cell] & d.bit)) {
        const next = cell + d.dr * s.size + d.dc;
        if (next >= 0 && next < s.walls.length && !seen.has(next)) {
          seen.add(next);
          queue.push([...route, next]);
        }
      }
  }
  return [];
}
