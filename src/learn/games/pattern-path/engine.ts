import { levelOf } from "../../levelOptions";
import type { LearnEngine } from "../../types";

export type PatternState = { version: 1; level: number; seed: number; index: number; total: 4; helped: boolean };
export type PatternTask = { title: string; tiles: string[]; missing: number; choices: string[]; answer: string; hint: string };
const colors = ["coral", "blue", "gold", "jade", "plum"];
const shells = (n: number) => `shells:${n}`;
const stone = (color: string, size = 0) => `stone:${color}${size ? `:${size}` : ""}`;
const next = (seed: number) => (Math.imul(seed, 1664525) + 1013904223) >>> 0;
const pick = (seed: number, n: number) => seed % n;
const shuffle = (items: string[], seed: number) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    seed = next(seed);
    const j = Math.floor(seed / 0x100000000 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function taskAt(s: PatternState): PatternTask {
  const seed = next(s.seed + s.index * 9871);
  const a = pick(seed, 5), b = (a + 1 + pick(seed >>> 4, 4)) % 5;
  let tiles: string[] = [], missing = 5, title = "Fill the missing stepping stone", hint = "Look at what repeats.";
  let pool: string[] = [];
  if (s.level === 1) {
    const cycle = s.index % 2 ? [stone(colors[a]), stone(colors[b]), stone(colors[b])] : [stone(colors[a]), stone(colors[b])];
    tiles = Array.from({ length: 7 }, (_, i) => cycle[i % cycle.length]); pool = colors.map(c => stone(c));
    hint = "The colored stones repeat. Their marks help you follow the order, too.";
  } else if (s.level === 2) {
    // Alternate growing and shrinking trails; the gap moves each task and each round.
    const down = s.index % 2 === 1;
    tiles = Array.from({ length: 7 }, (_, i) => shells(down ? 7 - i : i + 1));
    missing = 1 + (next(s.seed) % 6 + s.index * 2) % 6;
    pool = Array.from({ length: 7 }, (_, i) => shells(i + 1));
    hint = down ? "Each step has one fewer shell than the last." : "Each step has one more shell than the last.";
  } else if (s.level === 3) {
    if (s.index % 2) {
      const step = 2 + pick(seed >>> 6, 4), start = 1 + pick(seed >>> 10, 5);
      tiles = Array.from({ length: 7 }, (_, i) => String(start + i * step));
      pool = Array.from({ length: 9 }, (_, i) => String(start + i * step)); hint = `Count forward by ${step}.`;
    } else {
      tiles = Array.from({ length: 7 }, (_, i) => ["arrow:up", "arrow:right", "arrow:down", "arrow:left"][(i + a) % 4]);
      pool = ["arrow:up", "arrow:right", "arrow:down", "arrow:left"]; hint = "Each arrow turns one quarter turn.";
    }
  } else if (s.level === 4) {
    const one = colors[a], two = colors[b];
    tiles = Array.from({ length: 7 }, (_, i) => stone(i % 2 ? two : one, Math.floor(i / 2) % 2 + 1));
    pool = [one, two].flatMap(c => [1,2].map(n => stone(c,n)));
    hint = "Watch two things: the color changes every step; the size changes every two steps.";
    if (s.index === 3) {
      const row = [one, two, colors[(b + 1) % 5]];
      tiles = Array.from({ length: 9 }, (_, i) => stone(row[Math.floor(i / 3)], i % 3 + 1));
      missing = 7; title = "Complete the color and size reef";
      pool = row.flatMap(c => [1,2,3].map(n => stone(c,n)));
      hint = "Each row keeps one color. Stones grow larger from left to right. Each column keeps one size.";
    }
  } else {
    const kind = s.index % 3;
    if (kind === 0) { const base = 2 + pick(seed, 3); tiles = Array.from({ length: 7 }, (_, i) => String(base * 2 ** i)); hint = "Double the number each step."; }
    if (kind === 1) { const offset = pick(seed, 3); tiles = Array.from({ length: 7 }, (_, i) => String((i + 1 + offset) ** 2)); hint = "These are square numbers."; }
    if (kind === 2) { const x = 1 + pick(seed, 3), y = x + 1; tiles = [String(x), String(y)]; while (tiles.length < 7) tiles.push(String(Number(tiles.at(-1)) + Number(tiles.at(-2)))); hint = "Add the previous two numbers to get the next one."; }
    pool = [...tiles, String(Number(tiles[5]) + 1), String(Number(tiles[5]) - 1)];
    if (s.index === 3) { const start = 1 + pick(seed, 4); tiles = Array.from({length: 9}, (_, i) => String(start + Math.floor(i / 3) * 2 + i % 3)); missing = 7; pool = [...tiles, String(start + 8)]; title = "Complete the 3 × 3 number reef"; hint = "Across each row add one. Down each column add two."; }
  }
  const answer = tiles[missing];
  const distractors = shuffle([...new Set(pool)].filter(v => v !== answer), next(seed)).slice(0, 6);
  const choices = shuffle([answer, ...distractors], seed);
  return { title, tiles, missing, choices, answer, hint };
}
export function place(s: PatternState, tile: string): PatternState { return tile === taskAt(s).answer ? { ...s, index: s.index + 1 } : s; }
export const help = (s: PatternState): PatternState => ({ ...s, helped: true });
export const engine: LearnEngine<PatternState> = {
  id: "pattern-path", name: "Pattern Path", island: "thinking", ages: [4, 11], ownLevels: true,
  levelNames: [
    { name: "Color trail", description: "Fill AB and ABB color paths." },
    { name: "Growing shells", description: "Find the step with one more, or one fewer, shell." },
    { name: "Skip and turn", description: "Count by steps and turn arrows." },
    { name: "Two clues", description: "Follow color and size together." },
    { name: "Number reef", description: "Solve doubling, squares, adding pairs and a number matrix." },
  ],
  tagline: "Finish the island trail.", description: "Place the missing stepping stone to complete each pattern.",
  help: "Look at the stones before and after the gap. Tap a stone below to place it. Tap Help for one clue. You can try again as often as you like.",
  color: "#57793D", surface: "#EFF4DC", modes: ["solo", "together"], skills: { "think.pattern": "Finding patterns" },
  create: (o, ctx) => ({ version: 1, level: levelOf(o), seed: Math.floor(ctx.rng() * 0xffffffff) >>> 0, index: 0, total: 4, helped: false }),
  validate: (v, o): v is PatternState => !!v && typeof v === "object" && Object.keys(v).sort().join() === "helped,index,level,seed,total,version" && (v as PatternState).version === 1 && (v as PatternState).level === levelOf(o) && (v as PatternState).total === 4 && Number.isInteger((v as PatternState).seed) && (v as PatternState).seed >= 0 && (v as PatternState).seed <= 0xffffffff && Number.isInteger((v as PatternState).index) && (v as PatternState).index >= 0 && (v as PatternState).index <= 4 && typeof (v as PatternState).helped === "boolean",
  outcome: s => s.index === 4 ? "done" : null,
};
